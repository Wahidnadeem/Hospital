/* ---------- smaller forms ---------- */
function vitalsForm(pid) {
  const p = Store.get('patients', pid); const u = patUser(p); const adult = (ageYears(u.date_of_birth) ?? 20) >= 16;
  const keys = [['bp_systolic', 'سیستولیک mmHg'], ['bp_diastolic', 'دیاستولیک mmHg'], ['pulse_rate', 'نبض /دقیقه'], ['respiratory_rate', 'تنفس /دقیقه'], ['temperature', 'حرارت °C'], ['oxygen_sat', 'SpO₂ ٪'], ['weight_kg', 'وزن kg'], ['height_cm', 'قد cm'], ['blood_glucose', 'قند mg/dL'], ['pain_scale', 'درد (۰–۱۰)'], ...(adult ? [] : [['muac_cm', 'MUAC cm']])];
  openModal({
    title: 'ثبت علائم حیاتی', sub: esc(patName(p)) + ' · ' + mono(p.mrn), state: {},
    parts: { calc: s => { const b = bmiOf(s.weight_kg, s.height_cm); const n = adult ? news2(s) : null; return `<div class="row">${b ? `<span class="pill line">BMI ${nf(b, 1)} · ${bmiClass(b)}</span>` : ''}${n ? `<span class="pill ${NEWS_L[n.level][1]}">NEWS2 ${fa(n.score)} · ${NEWS_L[n.level][0]}</span>` : ''}${s.muac_cm ? pill(L.nut, muacClass(s.muac_cm)) : ''}</div>`; } },
    view: s => `<div class="grid-f" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">${keys.map(([k, l]) => field(l, inp(k, s[k], { num: 1, parts: 'calc' }), { for: 'f-' + k })).join('')}</div><div data-part="calc" style="margin-top:12px">${M ? M.parts.calc(s) : ''}</div>`,
    save: s => {
      const row = { patient_id: pid, record_id: null, recorded_by: actorUser(), recorded_at: nowISO() }; let any = false;
      for (const [k] of keys) if (s[k] != null && s[k] !== '') { if (isNaN(s[k])) throw new DbErr('مقادیر باید عدد باشند.'); row[k] = s[k]; any = true; }
      if (!any) throw new DbErr('حداقل یک مقدار وارد کنید.');
      row.bmi = bmiOf(row.weight_kg, row.height_cm);
      Store.tx(() => { Store.insert('vital_signs', row); const n = adult ? news2(row) : null; if (n && n.score >= 5) Store.insert('clinical_alerts', { alert_type: 'critical_vitals', patient_id: pid, doctor_id: null, record_id: null, priority: n.score >= 7 ? 'critical' : 'warning', message: `NEWS2 = ${fa(n.score)} — ${NEWS_L[n.level][0]}`, is_acknowledged: false }); });
      return 'علائم حیاتی ثبت شد.';
    },
  });
}
function doctorModal(id) {
  const d = Store.get('doctors', id); const u = U(d.user_id) || {}; const t = TODAY();
  const av = Store.by('doctor_availability', 'doctor_id', id).filter(a => a.is_active !== false).sort((a, b) => ((a.day_of_week + 1) % 7) - ((b.day_of_week + 1) % 7));
  const up = Store.by('appointments', 'doctor_id', id).filter(a => a.appointment_date >= t && !['cancelled', 'no_show', 'completed'].includes(a.status)).sort((a, b) => (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time)).slice(0, 8);
  openModal({
    title: esc(docName(d)), sub: esc(docSpec(d)) + ' · ' + esc(hospName(d.hospital_id)), wide: true, save: false,
    footer: () => `${can('appt') ? `<button class="btn pri" data-act="book" data-doctor="${id}">${I.cal}نوبت با این داکتر</button>` : ''}<button class="btn" data-act="m-close">بستن</button>`,
    view: () => `<div class="g g2"><div class="stack"><dl class="kv"><dt>نام انگلیسی</dt><dd class="mono">Dr. ${esc([u.first_name_en, u.last_name_en].filter(Boolean).join(' '))}</dd><dt>تخصص</dt><dd>${esc(docSpec(d))}</dd><dt>شرح تخصص</dt><dd>${esc(d.sub_specialization || '—')}</dd><dt>شفاخانه</dt><dd>${esc(hospName(d.hospital_id))}</dd><dt>نمبر جواز</dt><dd>${d.license_number ? mono(d.license_number) : '<span class="faint">در سند اعلام نشده</span>'}</dd><dt>فیس ویزیت</dt><dd>${d.consultation_fee ? afn(d.consultation_fee) : '<span class="faint">تعیین نشده</span>'}</dd><dt>منبع</dt><dd class="faint">${d.source === 'spec' ? 'وب‌سایت رسمی شفاخانه (سند HDHS)' : 'ثبت در سیستم'}</dd></dl>
      ${note('شماره تماس انفرادی داکتران منتشر نشده است؛ تماس از طریق شفاخانه مربوطه.', 'info')}
      <div><div class="fs-h">تقسیم اوقات هفتگی</div><div class="chips">${av.map(a => `<span class="tag">${WEEKDAYS[a.day_of_week]} ${fmtTime(a.start_time)}–${fmtTime(a.end_time)}</span>`).join('') || '<span class="faint">ثبت نشده</span>'}</div></div></div>
      <div><div class="fs-h">نوبت‌های پیش رو</div><div class="lst card">${up.length ? up.map(a => `<div class="li"><span class="time">${fmtTime(a.appointment_time)}</span><div class="grow">${esc(patName(Store.get('patients', a.patient_id)))}<div class="faint" style="font-size:12px">${fmtDate(a.appointment_date, true)}</div></div>${pill(L.appt, a.status)}</div>`).join('') : empty('نوبتی ثبت نشده.')}</div></div></div>`,
  });
}
function doctorNewForm() {
  openModal({
    title: 'ثبت داکتر جدید', wide: true, state: { days: [6, 0, 1, 2, 3, 4], start: '08:00', end: '14:00' }, saveLabel: 'ثبت داکتر',
    view: s => `<div class="grid-f">${field('نام', inp('first_name', s.first_name), { req: 1, for: 'f-first_name' })}${field('تخلص', inp('last_name', s.last_name), { req: 1, for: 'f-last_name' })}${field('نام انگلیسی', inp('first_name_en', s.first_name_en, { dir: 'ltr' }), { for: 'f-first_name_en' })}${field('تخلص انگلیسی', inp('last_name_en', s.last_name_en, { dir: 'ltr' }), { for: 'f-last_name_en' })}
      ${field('جنس', sel('gender', s.gender, [['male', 'مرد'], ['female', 'زن']]), { req: 1, for: 'f-gender' })}${field('نمبر جواز شورای طبی', inp('license_number', s.license_number, { dir: 'ltr' }), { req: 1, for: 'f-license_number', hint: 'یکتا' })}
      ${field('تخصص', sel('specialization_id', s.specialization_id, specOpts()), { req: 1, for: 'f-specialization_id' })}${field('شفاخانه', sel('hospital_id', s.hospital_id, hospOpts()), { req: 1, for: 'f-hospital_id' })}
      ${field('شروع کار', inp('start', s.start, { type: 'time' }), { for: 'f-start' })}${field('ختم کار', inp('end', s.end, { type: 'time' }), { for: 'f-end' })}${field('فیس ویزیت (افغانی)', inp('fee', s.fee, { num: 1 }), { for: 'f-fee' })}</div>
      <p class="faint" style="font-size:12px;margin-top:10px">تقسیم اوقات: شنبه تا پنجشنبه، نوبت‌های ۱۵ دقیقه‌ای.</p>`,
    save: s => {
      need(s.first_name, 'نام'); need(s.last_name, 'تخلص'); need(s.gender, 'جنس'); need(s.license_number, 'نمبر جواز'); need(s.specialization_id, 'تخصص'); need(s.hospital_id, 'شفاخانه');
      if (!(s.start < s.end)) throw new DbErr('ساعت ختم کار باید بعد از شروع باشد.');
      Store.tx(() => { const u = Store.insert('users', { first_name: s.first_name, last_name: s.last_name, first_name_en: s.first_name_en || null, last_name_en: s.last_name_en || null, gender: s.gender, phone: null, national_id: null, email: null, role_id: 'role-doctor', status: 'active', blood_type: 'Unknown', language: 'dari' });
        const d = Store.insert('doctors', { user_id: u.id, license_number: s.license_number.trim(), specialization_id: s.specialization_id, hospital_id: s.hospital_id, sub_specialization: null, consultation_fee: numOrNull(s.fee), status: 'active', languages: ['dari'], available_online: false, source: 'manual' });
        for (const dow of s.days) Store.insert('doctor_availability', { doctor_id: d.id, hospital_id: s.hospital_id, day_of_week: dow, start_time: s.start, end_time: s.end, slot_duration: 15, max_patients: 24, is_online: false, is_active: true }); });
      return 'داکتر ثبت شد.';
    },
  });
}
function cancelForm(id) {
  const a = Store.get('appointments', id);
  openModal({ title: 'لغو نوبت', sub: mono(a.appointment_no), state: { reason: '' }, saveLabel: 'لغو نوبت',
    view: s => field('دلیل لغو', txt('reason', s.reason, { ph: 'مثلاً درخواست بیمار، رخصتی داکتر' }), { req: 1, for: 'f-reason' }),
    save: s => { need(s.reason, 'دلیل لغو'); Store.update('appointments', id, { status: 'cancelled', cancel_reason: s.reason, cancelled_by: actorUser() }); return 'نوبت لغو شد و ساعت آن آزاد شد.'; } });
}
/* FEFO dispensing */
function dispensePlan(rx, phId) {
  const t = TODAY(); const items = Store.by('prescription_items', 'prescription_id', rx.id).filter(i => !i.is_dispensed);
  return items.map(it => {
    const batches = Store.by('pharmacy_inventory', 'pharmacy_id', phId).filter(b => b.medicine_id === it.medicine_id && b.expiry_date >= t && b.quantity > 0).sort((a, b) => a.expiry_date.localeCompare(b.expiry_date));
    let left = it.quantity; const take = [];
    for (const b of batches) { if (!left) break; const n = Math.min(left, b.quantity); take.push({ b, n }); left -= n; }
    return { it, take, short: left };
  });
}
function dispenseForm(id) {
  const rx = Store.get('prescriptions', id); const p = Store.get('patients', rx.patient_id);
  openModal({ title: 'تحویل دوا', sub: mono(rx.prescription_no) + ' · ' + esc(patName(p)), wide: true, state: { ph: rx.pharmacy_id || (Store.all('pharmacies')[0] || {}).id }, saveLabel: 'تأیید تحویل',
    view: s => { const plan = dispensePlan(rx, s.ph); const al = plan.flatMap(x => allergyHits(p, x.it.medicine_id));
      return `${al.length ? note('<b>هشدار حساسیت:</b> ' + al.map(a => esc(a.drug)).join('، ') + ' — قبل از تحویل با داکتر تماس بگیرید.', 'crit') : ''}
      <div class="grid-f" style="margin-bottom:14px">${field('دواخانه', sel('ph', s.ph, Store.all('pharmacies').map(x => [x.id, x.name]), { rr: 1, blank: false }), { for: 'f-ph' })}</div>
      <div class="tw"><table class="t"><thead><tr><th>دوا</th><th class="n">تجویز</th><th>بچ‌ها (اول‌منقضی)</th><th>وضعیت</th></tr></thead><tbody>${plan.map(x => `<tr><td style="direction:ltr;text-align:end"><b style="font-weight:600">${esc(medName(x.it.medicine_id))}</b></td><td class="n">${fa(x.it.quantity)}</td><td style="font-size:12.5px">${x.take.map(t => `${mono(t.b.batch_number)} × ${fa(t.n)} <span class="faint">(انقضا ${fmtShort(t.b.expiry_date)})</span>`).join('<br>') || '<span class="faint">موجود نیست</span>'}</td><td>${x.short ? `<span class="pill crit"><i></i>کمبود ${fa(x.short)}</span>` : '<span class="pill ok"><i></i>کامل</span>'}</td></tr>`).join('')}</tbody></table></div>
      <p class="faint" style="font-size:12px;margin-top:10px">اقلامی که موجودی کامل ندارند، باقی می‌مانند و نسخه «تحویل ناقص» ثبت می‌شود. موجودی به‌طور خودکار کم می‌شود.</p>`; },
    save: s => {
      const plan = dispensePlan(rx, s.ph); if (!plan.some(x => !x.short)) throw new DbErr('هیچ قلمی به‌طور کامل در این دواخانه موجود نیست.');
      Store.tx(() => {
        for (const x of plan) { if (x.short) continue; for (const t of x.take) Store.update('pharmacy_inventory', t.b.id, { quantity: t.b.quantity - t.n, updated_at: nowISO() }); Store.update('prescription_items', x.it.id, { is_dispensed: true }); }
        const left = Store.by('prescription_items', 'prescription_id', rx.id).filter(i => !i.is_dispensed).length;
        Store.update('prescriptions', rx.id, { status: left ? 'partially_dispensed' : 'dispensed', pharmacy_id: s.ph, dispensed_at: nowISO(), dispensed_by: actorUser() });
      });
      return 'دوا تحویل شد و موجودی به‌روز شد.';
    } });
}
function stockForm(phId) {
  openModal({ title: 'ورود موجودی', sub: esc((Store.get('pharmacies', phId) || {}).name), state: { min_stock_level: 20 }, saveLabel: 'ثبت موجودی',
    view: s => `<div class="grid-f">${field('دوا', sel('medicine_id', s.medicine_id, Store.all('medicines').sort((a, b) => a.generic_name.localeCompare(b.generic_name)).map(m => [m.id, m.generic_name])), { req: 1, cls: 'span2', for: 'f-medicine_id' })}
      ${field('نمبر بچ', inp('batch_number', s.batch_number, { dir: 'ltr' }), { req: 1, for: 'f-batch_number' })}${field('تعداد', inp('quantity', s.quantity, { num: 1 }), { req: 1, for: 'f-quantity' })}
      ${field('تاریخ انقضا', inp('expiry_date', s.expiry_date, { type: 'date', parts: 'exh' }), { req: 1, for: 'f-expiry_date' }).replace('</div>', `<span class="hint" data-part="exh">${dateHint(s.expiry_date)}</span></div>`)}${field('قیمت خرید (افغانی)', inp('unit_price', s.unit_price, { num: 1 }), { for: 'f-unit_price' })}${field('قیمت فروش (افغانی)', inp('selling_price', s.selling_price, { num: 1 }), { for: 'f-selling_price' })}${field('حداقل موجودی', inp('min_stock_level', s.min_stock_level, { num: 1 }), { for: 'f-min_stock_level' })}</div>`,
    parts: { exh: s => dateHint(s.expiry_date) },
    save: s => { need(s.medicine_id, 'دوا'); need(s.batch_number, 'نمبر بچ'); need(s.quantity, 'تعداد'); need(s.expiry_date, 'تاریخ انقضا');
      if (!(s.quantity > 0) || !Number.isInteger(s.quantity)) throw new DbErr('تعداد باید عدد صحیح مثبت باشد.');
      if (s.expiry_date <= TODAY()) throw new DbErr('دوای منقضی را نمی‌توان وارد موجودی کرد.');
      if (s.selling_price != null && s.unit_price != null && s.selling_price < s.unit_price) throw new DbErr('قیمت فروش کمتر از قیمت خرید است.');
      Store.insert('pharmacy_inventory', { pharmacy_id: phId, medicine_id: s.medicine_id, batch_number: s.batch_number, quantity: s.quantity, unit_price: s.unit_price ?? null, selling_price: s.selling_price ?? null, manufacture_date: null, expiry_date: s.expiry_date, supplier_id: null, min_stock_level: s.min_stock_level ?? 10, updated_at: nowISO() });
      return 'موجودی ثبت شد.'; } });
}
function labResultForm(id) {
  const o = Store.get('lab_orders', id); const p = Store.get('patients', o.patient_id); const res = Store.by('lab_results', 'order_id', id);
  const st = {}; for (const r of res) st[r.id] = r.result_value ?? '';
  openModal({ title: 'ثبت نتایج آزمایش', sub: mono(o.order_no) + ' · ' + esc(patName(p)) + ' · ' + ageText((patUser(p) || {}).date_of_birth) + ' · ' + (L.gender[(patUser(p) || {}).gender] || ''), wide: true, state: st, saveLabel: 'ثبت نتایج',
    parts: Object.fromEntries(res.map(r => ['fl' + r.id, s => { const t = Store.get('lab_tests', r.test_id); const f = labFlag(t, s[r.id], p); return f ? pill(L.flag, f) : '<span class="faint">—</span>'; }])),
    view: s => `<div class="tw"><table class="t"><thead><tr><th>آزمایش</th><th>نتیجه</th><th>واحد</th><th>محدوده نورمال</th><th>وضعیت</th></tr></thead><tbody>${res.map(r => { const t = Store.get('lab_tests', r.test_id); const rg = labRange(t, p);
      return `<tr><td>${esc(t.name)} ${mono(t.code)}</td><td style="min-width:140px">${t.qualitative ? `<select class="in" data-bind="${r.id}" data-parts="fl${r.id}">${opt('', '—', s[r.id])}${opt('منفی', 'منفی', s[r.id])}${opt('مثبت', 'مثبت', s[r.id])}</select>` : `<input class="in" data-bind="${r.id}" data-parts="fl${r.id}" inputmode="decimal" value="${esc(s[r.id])}" dir="ltr">`}</td><td>${t.unit ? mono(t.unit) : ''}</td><td class="faint">${Array.isArray(rg) ? fa(rg[0] + '–' + rg[1]) : esc(rg || '')}</td><td data-part="fl${r.id}">${M ? M.parts['fl' + r.id](s) : ''}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="faint" style="font-size:12px;margin-top:10px">محدوده بر اساس سن و جنس بیمار انتخاب شده. نتیجه بحرانی برای داکتر درخواست‌کننده هشدار کلینیکی ایجاد می‌کند.</p>`,
    save: s => {
      if (res.some(r => s[r.id] === '' || s[r.id] == null)) throw new DbErr('نتیجه همه آزمایش‌ها را وارد کنید.');
      Store.tx(() => { const ts = nowISO();
        for (const r of res) { const t = Store.get('lab_tests', r.test_id); const val = toLatin(String(s[r.id])).replace('٫', '.').trim(); if (!t.qualitative && isNaN(parseFloat(val))) throw new DbErr(`نتیجه ${t.name} باید عدد باشد.`); const f = labFlag(t, val, p); const rg = labRange(t, p);
          Store.update('lab_results', r.id, { result_value: val, flag: f, is_abnormal: f !== 'normal', result_date: ts, performed_by: actorUser(), normal_range: Array.isArray(rg) ? rg.join('–') : rg });
          if (f && f.startsWith('critical')) Store.insert('clinical_alerts', { alert_type: 'critical_lab', patient_id: p.id, doctor_id: o.doctor_id, record_id: o.record_id, priority: 'critical', message: `${t.name} = ${fa(val)} ${t.unit || ''} (${L.flag[f][0]})`, is_acknowledged: false }); }
        Store.update('lab_orders', id, { status: 'resulted', resulted_at: ts });
      });
      return 'نتایج ثبت و برای داکتر ارسال شد.';
    } });
}
function pregForm() {
  openModal({ title: 'ثبت حاملگی', state: { pq: '', risk_level: 'low', gravida: 1, para: 0 }, saveLabel: 'ثبت',
    parts: { ppres: s => ppres(s), pres: s => patientPicker(s), eddh: s => s.lmp_date ? `تاریخ تخمینی ولادت (قاعده ناگله): ${fmtDate(eddOf(s.lmp_date))} · هفته ${fa(gaWeeks(s.lmp_date))}` : 'تاریخ اولین روز آخرین قاعدگی' },
    view: s => `<div class="grid-f"><div class="full" data-part="pres">${patientPicker(s)}</div>${field('LMP', inp('lmp_date', s.lmp_date, { type: 'date', parts: 'eddh' }), { req: 1, cls: 'span2', for: 'f-lmp_date' }).replace('</div>', `<span class="hint" data-part="eddh">${M ? M.parts.eddh(s) : ''}</span></div>`)}${field('تعداد حاملگی (G)', inp('gravida', s.gravida, { num: 1 }), { for: 'f-gravida' })}${field('تعداد ولادت (P)', inp('para', s.para, { num: 1 }), { for: 'f-para' })}${field('سطح خطر', sel('risk_level', s.risk_level, Object.entries(L.risk).map(([k, v]) => [k, v[0]]), { blank: false }), { for: 'f-risk_level' })}</div>`,
    save: s => { need(s.patient_id, 'بیمار'); need(s.lmp_date, 'LMP'); const p = Store.get('patients', s.patient_id); const u = patUser(p);
      if (u.gender !== 'female') throw new DbErr('پرونده حاملگی فقط برای بیمار زن قابل ثبت است.');
      const ga = gaWeeks(s.lmp_date); if (ga < 0 || ga > 44) throw new DbErr('تاریخ LMP با حاملگی فعال مطابقت ندارد (۰ تا ۴۴ هفته).');
      if (Store.by('maternal_health', 'patient_id', p.id).some(m => m.status === 'active')) throw new DbErr('این بیمار قبلاً حاملگی فعال ثبت‌شده دارد.');
      if (s.para > s.gravida) throw new DbErr('تعداد ولادت نمی‌تواند بیشتر از تعداد حاملگی باشد.');
      Store.insert('maternal_health', { patient_id: p.id, lmp_date: s.lmp_date, edd_date: eddOf(s.lmp_date), gravida: s.gravida, para: s.para, abortion_count: 0, status: 'active', risk_level: s.risk_level, delivery_date: null, delivery_type: null, delivery_place: null, baby_id: null, notes: null });
      return 'حاملگی ثبت شد؛ تاریخ تخمینی ولادت ' + fmtDate(eddOf(s.lmp_date)); } });
}
function ancForm(mid) {
  const m = Store.get('maternal_health', mid); const p = Store.get('patients', m.patient_id); const n = Store.countBy('anc_visits', 'maternal_id', mid) + 1;
  openModal({ title: `ویزیت ANC شماره ${fa(n)}`, sub: esc(patName(p)) + ' · هفته ' + fa(gaWeeks(m.lmp_date)), wide: true, state: { iron_given: true, folate_given: true, next_visit_date: addDays(TODAY(), 28) }, saveLabel: 'ثبت ویزیت',
    view: s => `<div class="grid-f">${[['weight_kg', 'وزن kg'], ['bp_systolic', 'سیستولیک'], ['bp_diastolic', 'دیاستولیک'], ['fetal_heart_rate', 'ضربان قلب جنین'], ['fundal_height', 'ارتفاع رحم cm']].map(([k, l]) => field(l, inp(k, s[k], { num: 1 }), { for: 'f-' + k })).join('')}
      ${field('داکتر', sel('doctor_id', s.doctor_id, Store.all('doctors').filter(d => ['نسایی و ولادی', 'طب عمومی'].includes(docSpec(d))).map(d => [d.id, docName(d)])), { for: 'f-doctor_id' })}${field('ویزیت بعدی', inp('next_visit_date', s.next_visit_date, { type: 'date' }), { for: 'f-next_visit_date' })}
      <div class="full row" style="gap:18px"><label class="chk"><input type="checkbox" data-bind="iron_given" ${s.iron_given ? 'checked' : ''}>آهن داده شد</label><label class="chk"><input type="checkbox" data-bind="folate_given" ${s.folate_given ? 'checked' : ''}>فولیک اسید داده شد</label><label class="chk"><input type="checkbox" data-bind="tt_vaccine_given" ${s.tt_vaccine_given ? 'checked' : ''}>واکسین تیتانوس</label></div></div>`,
    save: s => { const ga = gaWeeks(m.lmp_date);
      if (s.bp_systolic != null && s.bp_diastolic != null && s.bp_diastolic >= s.bp_systolic) throw new DbErr('فشار دیاستولیک باید کمتر از سیستولیک باشد.');
      Store.tx(() => {
        Store.insert('anc_visits', { maternal_id: mid, visit_number: n, visit_date: TODAY(), weeks_of_gestation: ga, doctor_id: s.doctor_id || null, weight_kg: s.weight_kg ?? null, bp_systolic: s.bp_systolic ?? null, bp_diastolic: s.bp_diastolic ?? null, fetal_heart_rate: s.fetal_heart_rate ?? null, fundal_height: s.fundal_height ?? null, fetal_presentation: null, iron_given: !!s.iron_given, folate_given: !!s.folate_given, tt_vaccine_given: !!s.tt_vaccine_given, risk_factors: [], notes: null, next_visit_date: s.next_visit_date || null });
        if (s.tt_vaccine_given) Store.insert('vaccinations', { patient_id: p.id, vaccine_name: 'توکسوئید تیتانوس', vaccine_code: 'TT', dose_number: Store.by('vaccinations', 'patient_id', p.id).filter(v => v.vaccine_code === 'TT').length + 1, batch_number: null, date_given: TODAY(), next_dose_date: null, given_by: actorUser(), hospital_id: null, site: null, adverse_reaction: null, notes: null });
        if (ga >= 20 && (s.bp_systolic >= 140 || s.bp_diastolic >= 90)) { Store.update('maternal_health', mid, { risk_level: s.bp_systolic >= 160 || s.bp_diastolic >= 110 ? 'critical' : 'high' }); Store.insert('clinical_alerts', { alert_type: 'critical_vitals', patient_id: p.id, doctor_id: s.doctor_id || null, record_id: null, priority: 'critical', message: `فشار ${fa(s.bp_systolic + '/' + s.bp_diastolic)} در هفته ${fa(ga)} حاملگی — ارزیابی پره‌اکلامپسی`, is_acknowledged: false }); }
      });
      return 'ویزیت ANC ثبت شد.'; } });
}
function pregCloseForm(mid) {
  const m = Store.get('maternal_health', mid); const p = Store.get('patients', m.patient_id);
  openModal({ title: 'ثبت نتیجه حاملگی', sub: esc(patName(p)), state: { status: 'delivered', delivery_type: 'normal', delivery_date: TODAY(), register_baby: true, baby_gender: '', birth_weight: null }, saveLabel: 'ثبت',
    view: s => `<div class="grid-f">${field('نتیجه', sel('status', s.status, [['delivered', 'ولادت زنده'], ['stillbirth', 'مرده‌زایی'], ['miscarriage', 'سقط']], { rr: 1, blank: false }), { for: 'f-status' })}${field('تاریخ', inp('delivery_date', s.delivery_date, { type: 'date' }), { req: 1, for: 'f-delivery_date' })}
      ${s.status === 'delivered' ? field('نوع ولادت', sel('delivery_type', s.delivery_type, [['normal', 'نورمال'], ['cesarean', 'سزارین'], ['assisted', 'کمکی']], { blank: false }), { for: 'f-delivery_type' }) + field('محل ولادت', inp('delivery_place', s.delivery_place), { for: 'f-delivery_place' }) + `<div class="full"><label class="chk"><input type="checkbox" data-bind="register_baby" data-rerender ${s.register_baby ? 'checked' : ''}>ثبت پرونده نوزاد (کارت صحی طفل از بدو تولد)</label></div>` + (s.register_baby ? field('جنس نوزاد', sel('baby_gender', s.baby_gender, [['male', 'پسر'], ['female', 'دختر']]), { req: 1, for: 'f-baby_gender' }) + field('وزن ولادت (گرام)', inp('birth_weight', s.birth_weight, { num: 1 }), { for: 'f-birth_weight' }) : '') : ''}</div>`,
    save: s => { need(s.delivery_date, 'تاریخ');
      Store.tx(() => { let babyId = null;
        if (s.status === 'delivered' && s.register_baby) { need(s.baby_gender, 'جنس نوزاد'); const mu = patUser(p);
          const bu = Store.insert('users', { first_name: 'نوزاد', last_name: mu.last_name, gender: s.baby_gender, date_of_birth: s.delivery_date, blood_type: 'Unknown', phone: null, national_id: null, email: null, role_id: 'role-patient', status: 'active', language: 'dari' });
          const bp = Store.insert('patients', { user_id: bu.id, mrn: genMRN(), province: 'هرات', district: p.district, village: p.village, allergies: [], chronic_conditions: [], registered_at: nowISO(), emergency_contact: fullName(mu), emergency_relation: 'مادر', emergency_phone: mu.phone });
          Store.insert('child_health', { patient_id: bp.id, mother_id: p.id, birth_weight_gm: s.birth_weight ?? null, birth_height_cm: null, birth_place: s.delivery_place || null, is_breastfed: true, delivery_complications: null }); babyId = bp.id; }
        Store.update('maternal_health', mid, { status: s.status, delivery_date: s.delivery_date, delivery_type: s.status === 'delivered' ? s.delivery_type : null, delivery_place: s.delivery_place || null, baby_id: babyId });
      });
      return s.status === 'delivered' ? 'ولادت ثبت شد' + (s.register_baby ? ' و پرونده نوزاد ساخته شد.' : '.') : 'نتیجه ثبت شد.'; } });
}
function growthForm(pid) {
  const p = Store.get('patients', pid); const u = patUser(p);
  openModal({ title: 'اندازه‌گیری رشد', sub: esc(patName(p)) + ' · ' + ageText(u.date_of_birth), state: {}, saveLabel: 'ثبت',
    parts: { cls: s => s.muac_cm ? pill(L.nut, muacClass(s.muac_cm)) + (s.oedema ? ' <span class="pill crit">ادیم دوطرفه = SAM</span>' : '') : '' },
    view: s => `<div class="grid-f">${field('وزن kg', inp('weight_kg', s.weight_kg, { num: 1 }), { req: 1, for: 'f-weight_kg' })}${field('قد cm', inp('height_cm', s.height_cm, { num: 1 }), { for: 'f-height_cm' })}${field('MUAC cm', inp('muac_cm', s.muac_cm, { num: 1, parts: 'cls' }), { req: 1, for: 'f-muac_cm', hint: 'کمتر از ۱۱٫۵ = SAM؛ ۱۱٫۵ تا ۱۲٫۵ = MAM' })}<div class="full"><label class="chk"><input type="checkbox" data-bind="oedema" data-parts="cls">ادیم دوطرفه پا</label></div><div class="full" data-part="cls"></div></div>`,
    save: s => { need(s.weight_kg, 'وزن'); need(s.muac_cm, 'MUAC'); if (s.muac_cm < 6 || s.muac_cm > 25) throw new DbErr('MUAC خارج از محدوده ممکن است.');
      const status = s.oedema ? 'SAM' : muacClass(s.muac_cm);
      Store.tx(() => { let ch = Store.by('child_health', 'patient_id', pid)[0]; if (!ch) ch = Store.insert('child_health', { patient_id: pid, mother_id: null, birth_weight_gm: null, birth_height_cm: null, birth_place: null, is_breastfed: null, delivery_complications: null });
        Store.insert('growth_monitoring', { child_id: ch.id, measurement_date: TODAY(), age_months: Math.floor(ageDays(u.date_of_birth) / 30.44), weight_kg: s.weight_kg, height_cm: s.height_cm ?? null, muac_cm: s.muac_cm, nutritional_status: status, oedema: !!s.oedema, recorded_by: actorUser(), notes: null });
        if (status === 'SAM') Store.insert('clinical_alerts', { alert_type: 'malnutrition', patient_id: pid, doctor_id: null, record_id: null, priority: 'critical', message: `MUAC = ${nf(s.muac_cm, 1)} سانتی‌متر${s.oedema ? ' با ادیم' : ''} — سوء تغذیه حاد شدید؛ معرفی به OTP/TFC`, is_acknowledged: false }); });
      return 'اندازه‌گیری ثبت شد: ' + L.nut[status][0]; } });
}
function survForm() {
  const sv = survData();
  openModal({ title: 'گزارش هفتگی IDSR', state: { year: new Date().getFullYear(), week_number: epiWeek(TODAY()), district: 'هرات', new_cases: null, deaths: 0, hospitalized: 0 }, saveLabel: 'ثبت گزارش',
    view: s => `<div class="grid-f">${field('بیماری', `<input class="in" id="f-disease_name" data-bind="disease_name" list="dl-dis" value="${esc(s.disease_name || '')}"><datalist id="dl-dis">${sv.diseases.map(d => `<option value="${esc(d)}">`).join('')}</datalist>`, { req: 1, cls: 'span2', for: 'f-disease_name' })}
      ${field('ولسوالی', sel('district', s.district, districtOpts(), { blank: false }), { for: 'f-district' })}${field('هفته اپیدمیولوژیک', inp('week_number', s.week_number, { num: 1 }), { req: 1, for: 'f-week_number' })}${field('سال', inp('year', s.year, { num: 1 }), { for: 'f-year' })}
      ${field('موارد جدید', inp('new_cases', s.new_cases, { num: 1 }), { req: 1, for: 'f-new_cases' })}${field('بستری', inp('hospitalized', s.hospitalized, { num: 1 }), { for: 'f-hospitalized' })}${field('مرگ', inp('deaths', s.deaths, { num: 1 }), { for: 'f-deaths' })}</div>`,
    save: s => { need(s.disease_name, 'بیماری'); need(s.new_cases, 'موارد جدید'); if (!(s.week_number >= 1 && s.week_number <= 53)) throw new DbErr('هفته باید بین ۱ و ۵۳ باشد.'); if (s.deaths > s.new_cases || s.hospitalized > s.new_cases) throw new DbErr('تعداد مرگ یا بستری نمی‌تواند بیشتر از موارد باشد.');
      const dup = Store.all('disease_surveillance').find(r => r.disease_name === s.disease_name.trim() && r.district === s.district && r.week_number === s.week_number && r.year === s.year);
      const data = { disease_name: s.disease_name.trim(), district: s.district, week_number: s.week_number, year: s.year, total_cases: s.new_cases, new_cases: s.new_cases, deaths: s.deaths || 0, hospitalized: s.hospitalized || 0, recovered: null, hospital_id: null, icd_code: null, age_group: 'all', gender: 'both', report_date: TODAY(), reported_by: actorUser(), verified: false };
      if (dup) Store.update('disease_surveillance', dup.id, data); else Store.insert('disease_surveillance', data);
      return dup ? 'گزارش همین هفته و ولسوالی به‌روز شد.' : 'گزارش هفتگی ثبت شد.'; } });
}
function alertForm(disease, n) {
  const sv = survData(); const top = Object.entries(sv.byDist[disease] || {}).sort((a, b) => b[1] - a[1])[0];
  openModal({ title: 'صدور هشدار اپیدمی', sub: esc(disease), state: { severity: 'warning', district: top ? top[0] : '', description: `${fa(n)} مورد جدید در هفته ${fa(sv.last)}؛ بالاتر از آستانه شیوع`, recommended_actions: '' }, saveLabel: 'صدور هشدار',
    view: s => `<div class="grid-f">${field('شدت', sel('severity', s.severity, Object.entries(L.epi).map(([k, v]) => [k, v[0]]), { blank: false }), { for: 'f-severity' })}${field('ولسوالی اصلی', sel('district', s.district, districtOpts()), { for: 'f-district' })}${field('شرح', txt('description', s.description), { cls: 'full', for: 'f-description' })}${field('اقدامات پیشنهادی', txt('recommended_actions', s.recommended_actions, { ph: 'مثلاً تیم واکنش سریع، کلورین‌کاری آب، آگاهی‌دهی' }), { cls: 'full', for: 'f-recommended_actions' })}</div>`,
    save: s => { Store.insert('epidemic_alerts', { disease_name: disease, district: s.district || null, severity: s.severity, cases_count: n, description: s.description, recommended_actions: s.recommended_actions || null, reported_by: actorUser(), alert_date: nowISO(), is_resolved: false, resolved_at: null }); return 'هشدار اپیدمی صادر شد.'; } });
}
function callForm() {
  openModal({ title: 'تماس عاجل جدید', state: { triage: 'yellow', district: 'هرات' }, saveLabel: 'ثبت تماس',
    view: s => `<div class="grid-f">${field('شماره تماس‌گیرنده', inp('caller_phone', s.caller_phone, { dir: 'ltr', attrs: 'inputmode="tel"' }), { req: 1, for: 'f-caller_phone' })}${field('نام تماس‌گیرنده', inp('caller_name', s.caller_name), { for: 'f-caller_name' })}
      ${field('ولسوالی', sel('district', s.district, districtOpts(), { blank: false }), { for: 'f-district' })}${field('آدرس / نشانی', inp('location_text', s.location_text), { for: 'f-location_text' })}
      ${field('شرح وضعیت', txt('situation', s.situation, { ph: 'سن، جنس، علائم اصلی، هوشیاری' }), { req: 1, cls: 'full', for: 'f-situation' })}
      <div class="full f"><span class="lb req">تریاژ</span><div class="seg">${[['red', 'سرخ — تهدید حیات'], ['yellow', 'زرد — عاجل'], ['green', 'سبز — قابل انتظار']].map(([k, l]) => `<button type="button" data-act="seg" data-k="triage" data-v="${k}" aria-pressed="${s.triage === k}"><span class="tri ${k}"></span> ${l}</button>`).join('')}</div></div></div>`,
    save: s => { need(s.caller_phone, 'شماره تماس‌گیرنده'); need(s.situation, 'شرح وضعیت'); const d = DISTRICTS.find(x => x[0] === s.district);
      Store.insert('emergency_calls', { patient_id: null, caller_phone: toLatin(s.caller_phone), caller_name: s.caller_name || null, location_text: s.location_text || null, district: s.district, gps_lat: d ? d[1] : null, gps_lng: d ? d[2] : null, situation: s.situation, triage: s.triage, ambulance_id: null, hospital_id: null, status: 'received', received_at: nowISO(), dispatched_at: null, arrived_at: null, resolved_at: null, operator_id: actorUser() });
      return 'تماس ثبت شد؛ امبولانس را اعزام کنید.'; } });
}
function dispatchForm(id) {
  const c = Store.get('emergency_calls', id); const d = DISTRICTS.find(x => x[0] === c.district) || DISTRICTS[0]; const lat = c.gps_lat ?? d[1], lng = c.gps_lng ?? d[2];
  const ambs = Store.all('ambulances').filter(a => a.status === 'available').map(a => ({ a, km: haversine(lat, lng, a.current_lat, a.current_lng) })).sort((x, y) => x.km - y.km);
  const hs = Store.all('hospitals').filter(h => h.is_emergency).map(h => ({ h, km: haversine(lat, lng, h.gps_lat, h.gps_lng) })).sort((x, y) => x.km - y.km);
  openModal({ title: 'اعزام امبولانس', sub: esc(c.situation), state: { ambulance_id: ambs[0] ? ambs[0].a.id : '', hospital_id: hs[0] ? hs[0].h.id : '' }, saveLabel: 'اعزام',
    view: s => `${ambs.length ? '' : note('امبولانس آماده‌ای وجود ندارد.', 'crit')}<div class="fs-h">امبولانس‌های آماده (نزدیک‌ترین اول)</div><div class="stack" style="gap:6px;margin-bottom:16px">${ambs.map(({ a, km }) => `<label class="chk" style="border:1px solid var(--line);border-radius:10px;padding:8px 12px"><input type="radio" name="amb" data-bind="ambulance_id" value="${a.id}" ${s.ambulance_id === a.id ? 'checked' : ''}><b class="mono">${esc(a.vehicle_number)}</b> · ${L.ambType[a.type]} · ${esc(hospName(a.hospital_id))}<span style="margin-inline-start:auto" class="faint">~${nf(km, 1)} کیلومتر · ~${fa(Math.max(3, Math.round(km / 40 * 60)))} دقیقه</span></label>`).join('')}</div>
      ${field('شفاخانه مقصد (پیش‌آگاهی ورود بیمار)', sel('hospital_id', s.hospital_id, hs.map(({ h, km }) => [h.id, `${h.name} · ~${nf(km, 1)} کیلومتر`]), { blank: false }), { for: 'f-hospital_id' })}`,
    save: s => { need(s.ambulance_id, 'امبولانس'); const a = Store.get('ambulances', s.ambulance_id); if (a.status !== 'available') throw new DbErr('این امبولانس دیگر آماده نیست.');
      Store.tx(() => { Store.update('ambulances', a.id, { status: 'on_call' }); Store.update('emergency_calls', id, { status: 'dispatched', ambulance_id: a.id, hospital_id: s.hospital_id || null, dispatched_at: nowISO() }); });
      return `امبولانس ${a.vehicle_number} اعزام شد.`; } });
}
function bedForm(bid) {
  const b = Store.get('bed_management', bid); const p = Store.get('patients', b.patient_id);
  openModal({ title: `تخت ${esc(b.bed_number)}`, sub: esc(hospName(b.hospital_id)) + ' · ' + (L.bedType[b.bed_type] || ''), state: { pq: '', status: b.status }, saveLabel: b.status === 'occupied' ? 'ترخیص بیمار' : 'بستری کردن',
    parts: { ppres: s => ppres(s), pres: s => patientPicker(s) },
    view: s => b.status === 'occupied' ? `${who(patName(p), mono(p.mrn) + ' · بستری از ' + fmtDate(b.admitted_at))}<p class="faint" style="margin-top:12px">با ترخیص، تخت آزاد و برای بیمار بعدی آماده می‌شود.</p>`
      : `<div class="stack"><div class="seg">${['available', 'reserved', 'maintenance'].map(k => `<button type="button" data-act="seg" data-k="status" data-v="${k}" aria-pressed="${s.status === k}">${L.bed[k][0]}</button>`).join('')}</div><div data-part="pres">${patientPicker(s)}</div><p class="faint" style="font-size:12px">برای بستری کردن بیمار را انتخاب کنید؛ یا فقط وضعیت تخت را تغییر دهید.</p></div>`,
    save: s => { if (b.status === 'occupied') { Store.update('bed_management', bid, { status: 'available', patient_id: null, admitted_at: null }); return 'بیمار ترخیص شد.'; }
      if (s.patient_id) { Store.update('bed_management', bid, { status: 'occupied', patient_id: s.patient_id, admitted_at: nowISO() }); return 'بیمار بستری شد.'; }
      Store.update('bed_management', bid, { status: s.status }); return 'وضعیت تخت به‌روز شد.'; } });
}
function bedNewForm(hid) {
  openModal({ title: 'افزودن تخت', sub: esc(hospName(hid)), state: { bed_type: 'general' }, saveLabel: 'افزودن',
    view: s => `<div class="grid-f">${field('نمبر تخت', inp('bed_number', s.bed_number, { dir: 'ltr' }), { req: 1, for: 'f-bed_number' })}${field('بخش', sel('department_id', s.department_id, Store.by('departments', 'hospital_id', hid).map(d => [d.id, d.name])), { req: 1, for: 'f-department_id' })}${field('نوع', sel('bed_type', s.bed_type, Object.entries(L.bedType), { blank: false }), { for: 'f-bed_type' })}</div>`,
    save: s => { need(s.bed_number, 'نمبر تخت'); need(s.department_id, 'بخش'); if (Store.by('bed_management', 'hospital_id', hid).some(x => normKey(x.bed_number) === normKey(s.bed_number))) throw new DbErr('این نمبر تخت در همین شفاخانه وجود دارد.');
      Store.insert('bed_management', { hospital_id: hid, department_id: s.department_id, bed_number: s.bed_number.trim(), bed_type: s.bed_type, status: 'available', patient_id: null, admitted_at: null }); return 'تخت اضافه شد.'; } });
}
function confirmModal(title, msg, onOk, okLabel = 'تأیید', danger = true) {
  openModal({ title, state: {}, view: () => `<p>${msg}</p>`, footer: () => `<button class="btn ${danger ? 'dan' : 'pri'}" data-act="m-save">${okLabel}</button><button class="btn" data-act="m-close">انصراف</button>`, save: onOk });
}

/* ================= events ================= */
const run = fn => { try { const m = fn(); if (typeof m === 'string') toast(m); } catch (e) { if (!(e instanceof DbErr)) console.error(e); toast(e.message, 'err'); } };
const ACT = {
  go: el => go(el.dataset.v), menu: () => { const s = document.getElementById('side'); s.classList.toggle('open'); if (s.classList.contains('open')) { const sc = document.createElement('div'); sc.className = 'side-scrim'; sc.onclick = closeSide; document.body.appendChild(sc); } else closeSide(); },
  'open-patient': el => go('patient', el.dataset.id), 'open-hospital': el => go('hospital', el.dataset.id),
  tab: el => { S.tab[el.dataset.k] = el.dataset.v; renderMain(false); },
  day: el => { S.day = el.dataset.v; renderMain(false); },
  book: el => bookForm({ patient: el.dataset.patient, doctor: el.dataset.doctor }),
  'patient-new': () => patientForm(), 'patient-edit': el => patientForm(el.dataset.id),
  'patient-del': el => { const id = el.dataset.id; const deps = Store.dependents('patients', id); confirmModal('حذف پرونده بیمار', deps.length ? `این پرونده رکوردهای وابسته دارد (${deps.map(d => `${SCHEMA[d.table].label}: ${fa(d.n)}`).join('، ')}). پایگاه داده حذف پرونده‌ای را که سوابق طبی دارد، اجازه نمی‌دهد.` : 'این پرونده برای همیشه حذف می‌شود.', () => { Store.tx(() => { const p = Store.get('patients', id); Store.remove('patients', id); Store.remove('users', p.user_id); }); setTimeout(() => go('patients')); return 'پرونده حذف شد.'; }, 'حذف'); },
  'vitals-new': el => vitalsForm(el.dataset.id), 'doctor-open': el => doctorModal(el.dataset.id), 'doctor-new': () => doctorNewForm(),
  'appt-set': el => run(() => { Store.update('appointments', el.dataset.id, { status: el.dataset.s }); return 'وضعیت نوبت: ' + L.appt[el.dataset.s][0]; }),
  'appt-cancel': el => cancelForm(el.dataset.id), visit: el => visitForm(el.dataset.id),
  ack: el => run(() => { Store.update('clinical_alerts', el.dataset.id, { is_acknowledged: true, acknowledged_by: actorUser() }); return 'هشدار بررسی شد.'; }),
  dispense: el => dispenseForm(el.dataset.id), 'rx-cancel': el => confirmModal('لغو نسخه', 'نسخه لغو می‌شود و قابل تحویل نخواهد بود.', () => { Store.update('prescriptions', el.dataset.id, { status: 'cancelled' }); return 'نسخه لغو شد.'; }, 'لغو نسخه'),
  'stock-new': el => stockForm(el.dataset.id),
  'lab-collect': el => run(() => { Store.update('lab_orders', el.dataset.id, { status: 'sample_collected', sample_collected_at: nowISO() }); return 'نمونه ثبت شد.'; }),
  'lab-result': el => labResultForm(el.dataset.id),
  'lab-review': el => run(() => { const o = Store.get('lab_orders', el.dataset.id); Store.update('lab_orders', o.id, { status: 'reviewed', reviewed_by: o.doctor_id }); return 'نتیجه بررسی شد.'; }),
  'vacc-give': el => confirmModal('ثبت تطبیق واکسین', `${esc(el.dataset.name)} امروز (${fmtDate(TODAY())}) برای ${esc(patName(Store.get('patients', el.dataset.id)))} ثبت شود؟`, () => { Store.insert('vaccinations', { patient_id: el.dataset.id, vaccine_name: el.dataset.name, vaccine_code: el.dataset.code, dose_number: Number(el.dataset.dose), batch_number: null, date_given: TODAY(), next_dose_date: null, given_by: actorUser(), hospital_id: null, site: null, adverse_reaction: null, notes: null }); return 'واکسین ثبت شد.'; }, 'ثبت', false),
  'preg-new': () => pregForm(), 'anc-new': el => ancForm(el.dataset.id), 'preg-close': el => pregCloseForm(el.dataset.id), 'growth-new': el => growthForm(el.dataset.id),
  'surv-new': () => survForm(), 'alert-new': el => alertForm(el.dataset.d, Number(el.dataset.n)),
  'alert-resolve': el => run(() => { Store.update('epidemic_alerts', el.dataset.id, { is_resolved: true, resolved_at: nowISO() }); return 'هشدار بسته شد.'; }),
  'call-new': () => callForm(),
  'call-next': el => { const id = el.dataset.id, s = el.dataset.s; if (s === 'dispatch') return dispatchForm(id); run(() => { const c = Store.get('emergency_calls', id); Store.tx(() => { const patch = { status: s }; if (s === 'arrived') patch.arrived_at = nowISO(); if (s === 'resolved' || s === 'cancelled') { patch.resolved_at = nowISO(); if (c.ambulance_id) Store.update('ambulances', c.ambulance_id, { status: 'available' }); } Store.update('emergency_calls', id, patch); }); return 'وضعیت: ' + L.call[s][0]; }); },
  blood: el => run(() => { const b = Store.get('blood_bank', el.dataset.id); Store.update('blood_bank', b.id, { units_available: (b.units_available || 0) + Number(el.dataset.d), updated_at: nowISO() }); }),
  'bed-open': el => { if (can('bed') || S.role === 'admin') bedForm(el.dataset.id); }, 'bed-new': el => bedNewForm(el.dataset.id),
  copy: el => { const v = el.dataset.v; const ok = () => toast('کاپی شد: ' + v); try { navigator.clipboard.writeText(v).then(ok, () => toast(v)); } catch (_) { toast(v); } },
  gsearch: () => { const g = document.getElementById('gs'); g.classList.toggle('open'); if (g.classList.contains('open')) document.getElementById('gq').focus(); },
  'reset-data': () => confirmModal('بازگردانی داده نمونه', 'همه تغییرات ذخیره‌شده در این مرورگر پاک و داده نمونه دوباره بارگذاری می‌شود.', () => { Sync.resetDevice(); }, 'بازگردانی'),
  'm-close': () => closeModal(), 'm-save': () => modalSave(),
  seg: el => { M.state[el.dataset.k] = el.dataset.v; renderModal(); },
  'pp-pick': el => { M.state.patient_id = el.dataset.id; M.state.pq = ''; renderParts(['pres']); },
  'pp-clear': () => { M.state.patient_id = null; renderParts(['pres']); const i = document.getElementById('f-pq'); i && i.focus(); },
  'bk-day': el => { M.state.date = el.dataset.v; M.state.time = ''; renderParts(['days', 'slots']); },
  'bk-slot': el => { M.state.time = el.dataset.v; renderParts(['slots']); },
  'dx-add': el => { if (M.state.dx.some(d => d.name === el.dataset.n)) return; M.state.dx.push({ code: el.dataset.c, name: el.dataset.n, type: M.state.dx.length ? 'secondary' : 'primary' }); M.state.dxq = ''; const i = document.getElementById('f-dxq'); i.value = ''; renderParts(['dxl', 'dxres']); i.focus(); },
  'dx-rm': el => { M.state.dx.splice(Number(el.dataset.i), 1); renderParts(['dxl']); },
  'rx-add': el => { const m = Store.get('medicines', el.dataset.id); const form = (m.dosage_forms || [])[0] || ''; M.state.rx.push({ medicine_id: m.id, dosage: (m.strengths || [])[0] || '', frequency: '', duration_days: '', quantity: '', route: form === 'injection' ? 'injection' : form === 'inhaler' ? 'inhaler' : 'oral' }); M.state.mq = ''; const i = document.getElementById('f-mq'); i.value = ''; renderParts(['rxl', 'rxw', 'mres']); },
  'rx-rm': el => { M.state.rx.splice(Number(el.dataset.i), 1); renderParts(['rxl', 'rxw']); },
};
function closeSide() { const s = document.getElementById('side'); s && s.classList.remove('open'); document.querySelectorAll('.side-scrim').forEach(x => x.remove()); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) { if (!e.target.closest('#gs')) hideG(); return; }
  if (el.tagName === 'A') e.preventDefault();
  const fn = ACT[el.dataset.act]; if (fn) { e.stopPropagation(); fn(el, e); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (M) closeModal(); else { closeSide(); hideG(); } }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][data-act]')) { e.preventDefault(); e.target.click(); }
});
let fTimer;
function onInput(e) {
  const el = e.target;
  if (M && M.root.contains(el)) {
    if (el.dataset.vit) { M.state.v[el.dataset.vit] = el.value === '' ? null : Number(toLatin(el.value).replace('٫', '.')); renderParts(['vit']); return; }
    if (el.dataset.rx != null) { M.state.rx[Number(el.dataset.rx)][el.dataset.k] = el.value; return; }
    if (el.dataset.test) { M.state.tests[el.dataset.test] = el.checked; return; }
    if (el.dataset.dx != null) { M.state.dx[Number(el.dataset.dx)].type = el.value; return; }
    if (!el.dataset.bind) return;
    const k = el.dataset.bind; let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.num != null) v = v === '' ? null : Number(toLatin(v).replace('٫', '.'));
    if (el.type === 'radio' && !el.checked) return;
    M.state[k] = v;
    if (e.type === 'change' && el.dataset.rerender != null) { renderModal(); const n = M.root.querySelector(`[data-bind="${k}"]`); n && n.focus(); return; }
    if (el.dataset.parts) renderParts(el.dataset.parts.split(','));
    return;
  }
  if (el.dataset.f) { S.f[el.dataset.f] = el.value; if (el.dataset.f === 'ah') S.f.ad = ''; clearTimeout(fTimer); fTimer = setTimeout(() => renderMain(false), el.tagName === 'INPUT' ? 90 : 0); return; }
  if (el.id === 'gq') { renderG(el.value); return; }
  if (el.id === 'role' && e.type === 'change') { S.role = el.value; Store.actor = { role: S.role, user_id: actorUser() }; saveUI(); go(canView(S.view) ? S.view : 'dashboard', S.param); toast('نقش فعال: ' + ROLE_UI[S.role].label); }
}
document.addEventListener('input', onInput); document.addEventListener('change', e => { const el = e.target; if (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT' || el.type === 'date' || el.type === 'time') onInput(e); });
function renderG(v) {
  const box = document.getElementById('gres'); const q = normKey(v); if (!q) { box.hidden = true; return; }
  const res = Store.all('patients').filter(p => patientMatches(p, q)).slice(0, 8);
  box.innerHTML = res.length ? res.map(p => `<button data-act="open-patient" data-id="${p.id}">${avatar(patName(p))}<span><b style="font-weight:600">${esc(patName(p))}</b><br><span class="mono faint">${esc(p.mrn)}</span></span></button>`).join('') : '<div class="faint" style="padding:10px">بیماری پیدا نشد.</div>';
  box.hidden = false;
}
function hideG() { const b = document.getElementById('gres'); if (b) b.hidden = true; const g = document.getElementById('gs'); if (g) g.classList.remove('open'); }
/* tooltips for charts / heat cells */
document.addEventListener('mouseover', e => { const t = e.target.closest && e.target.closest('[data-tip]'); const tip = document.getElementById('tip'); if (!tip) return; if (!t) { tip.classList.remove('on'); return; } tip.textContent = t.dataset.tip; tip.style.whiteSpace = 'pre-line'; tip.classList.add('on'); });
document.addEventListener('mousemove', e => { const tip = document.getElementById('tip'); if (!tip || !tip.classList.contains('on')) return; const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 14, y = e.clientY - h - 12; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y < 8) y = e.clientY + 16; tip.style.left = x + 'px'; tip.style.top = y + 'px'; });

/* ================= boot ================= */
Store.init();
renderShell(); renderNav(); renderMain(true);
Store.on(scheduleRender);
Sync.listeners.add(() => { const el = document.getElementById('sync'); if (el) renderNav(); });
Sync.connect(mode => {
  S.mode = mode; Store.actor = { role: S.role, user_id: actorUser() };
  const init = (location.hash || '').replace('#', ''); if (init && NAV.some(n => n[0] === init)) S.view = init;
  if (!canView(S.view)) S.view = 'dashboard';
  renderMain(true); renderNav();
  if (mode === 'local') toast('پایگاه داده در دسترس نیست؛ صفحه در حالت محلی کار می‌کند و تغییرات ذخیره نمی‌شود.', 'err');
});
