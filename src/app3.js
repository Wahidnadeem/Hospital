/* ---------- pharmacy ---------- */
VIEWS.pharmacy = () => {
  const tab = tabOf('ph', 'queue'); const t = TODAY();
  const queue = Store.all('prescriptions').filter(r => ['pending', 'partially_dispensed'].includes(r.status)).sort((a, b) => a.prescription_date.localeCompare(b.prescription_date));
  const phs = Store.all('pharmacies'); const phId = S.f.ph || (phs[0] || {}).id;
  const inv = Store.by('pharmacy_inventory', 'pharmacy_id', phId);
  const perMed = {}; for (const i of inv) if (i.expiry_date >= t) perMed[i.medicine_id] = (perMed[i.medicine_id] || 0) + i.quantity;
  const low = inv.filter(i => (perMed[i.medicine_id] || 0) < (i.min_stock_level || 0));
  const soon = inv.filter(i => diffDays(i.expiry_date, t) <= 90);
  let body = '';
  if (tab === 'queue') body = queue.length ? `<div class="stack">${queue.map(r => rxCard(r, true)).join('')}</div>` : `<div class="card">${empty('نسخه‌ای در انتظار تحویل نیست.', I.check)}</div>`;
  else if (tab === 'stock') body = `<div class="fbar">${fsel('ph', phId, phs.map(p => [p.id, p.name]), 'انتخاب دواخانه')}<span class="pill ${low.length ? 'crit' : 'ok'}"><i></i>${fa(new Set(low.map(i => i.medicine_id)).size)} قلم کمبود</span><span class="pill ${soon.length ? 'warn' : 'ok'}"><i></i>${fa(soon.length)} بچ نزدیک انقضا (۹۰ روز)</span><span style="flex:1"></span>${can('stock') ? `<button class="btn pri" data-act="stock-new" data-id="${phId}">${I.plus}ورود موجودی</button>` : ''}</div>
    <div class="card"><div class="tw"><table class="t"><thead><tr><th>دوا</th><th>نمبر بچ</th><th class="n">موجودی</th><th class="n">مجموع قلم</th><th class="n">حداقل</th><th>انقضا</th><th class="n">قیمت فروش</th><th>وضعیت</th></tr></thead><tbody>
    ${inv.sort((a, b) => medName(a.medicine_id).localeCompare(medName(b.medicine_id)) || a.expiry_date.localeCompare(b.expiry_date)).map(i => { const dd = diffDays(i.expiry_date, t); const m = Store.get('medicines', i.medicine_id) || {}; const lowM = (perMed[i.medicine_id] || 0) < (i.min_stock_level || 0);
      return `<tr><td><b style="font-weight:600;direction:ltr;unicode-bidi:isolate">${esc(m.generic_name)}</b>${m.is_controlled ? ' <span class="pill crit">مخدر</span>' : ''}<div class="faint" style="font-size:12px;direction:ltr;text-align:end">${esc((m.strengths || []).join(' · '))}</div></td><td>${mono(i.batch_number || '—')}</td><td class="n"><b>${nf(i.quantity)}</b></td><td class="n">${nf(perMed[i.medicine_id] || 0)}</td><td class="n">${nf(i.min_stock_level)}</td><td>${fmtShort(i.expiry_date)}</td><td class="n">${afn(i.selling_price)}</td>
      <td>${dd < 0 ? '<span class="pill crit"><i></i>منقضی</span>' : dd <= 90 ? `<span class="pill warn"><i></i>${fa(dd)} روز مانده</span>` : ''} ${lowM ? '<span class="pill crit"><i></i>کمبود</span>' : ''}${dd > 90 && !lowM ? '<span class="pill ok"><i></i>کافی</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div></div>`;
  else body = `<div class="g g-21"><div class="card"><div class="card-h"><h3>دارونامه</h3><small class="faint">${fa(Store.count('medicines'))} قلم · فهرست دواهای اساسی</small></div><div class="tw"><table class="t"><thead><tr><th>نام علمی</th><th>نام تجارتی</th><th>گروه</th><th>شکل و قوت</th><th></th></tr></thead><tbody>${Store.all('medicines').sort((a, b) => a.generic_name.localeCompare(b.generic_name)).map(m => `<tr><td style="direction:ltr;text-align:end"><b style="font-weight:600">${esc(m.generic_name)}</b></td><td style="direction:ltr;text-align:end" class="faint">${esc((m.brand_names || []).join(', '))}</td><td class="mono" style="font-size:12px">${esc(m.drug_class || '')}</td><td style="direction:ltr;text-align:end;font-size:12.5px">${esc((m.strengths || []).join(' · '))}</td><td>${m.is_controlled ? '<span class="pill crit">مخدر</span>' : ''}${m.is_essential ? '<span class="pill acc">اساسی WHO</span>' : ''}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="card-h"><h3>تداخلات دارویی</h3><small class="faint">${fa(Store.count('drug_interactions'))}</small></div><div class="lst">${Store.all('drug_interactions').sort((a, b) => ['contraindicated', 'major', 'moderate', 'minor'].indexOf(a.severity) - ['contraindicated', 'major', 'moderate', 'minor'].indexOf(b.severity)).map(d => `<div class="li" style="align-items:flex-start"><div class="grow"><div class="row" style="gap:6px">${pill(L.di, d.severity)}<b style="direction:ltr;unicode-bidi:isolate;font-weight:600">${esc(medName(d.drug1_id))} + ${esc(medName(d.drug2_id))}</b></div><div class="muted" style="font-size:12.5px;margin-top:4px">${esc(d.description)}</div>${d.management ? `<div class="faint" style="font-size:12px">اقدام: ${esc(d.management)}</div>` : ''}</div></div>`).join('')}</div></div></div>`;
  return `${ph('تشخیص و دوا', 'دواخانه', 'نسخه الکترونیک، تحویل دوا به روش «اول‌منقضی، اول‌خارج» (FEFO) و کنترل موجودی.')}
  ${tabs('ph', [['queue', 'نسخه‌های در انتظار', queue.length], ['stock', 'موجودی'], ['formulary', 'دارونامه و تداخلات']], 'queue')}${body}`;
};

/* ---------- lab ---------- */
VIEWS.lab = () => {
  const tab = tabOf('lab', 'open');
  const groups = { open: ['ordered', 'sample_collected', 'processing'], ready: ['resulted'], done: ['reviewed', 'cancelled'] };
  const pr = { emergency: 0, urgent: 1, routine: 2 };
  const list = Store.all('lab_orders').filter(o => groups[tab].includes(o.status)).sort((a, b) => (pr[a.priority] - pr[b.priority]) || (b.order_date || '').localeCompare(a.order_date || ''));
  const c = k => Store.all('lab_orders').filter(o => groups[k].includes(o.status)).length;
  return `${ph('تشخیص و دوا', 'لابراتوار', 'درخواست‌های آزمایش با محدوده نورمال بر اساس سن و جنس؛ نتایج بحرانی خودکار برای داکتر هشدار ایجاد می‌کنند.')}
  ${tabs('lab', [['open', 'در جریان', c('open')], ['ready', 'نتایج آماده', c('ready')], ['done', 'بررسی‌شده', c('done')]], 'open')}
  ${list.length ? `<div class="stack">${list.map(o => labCard(o, true)).join('')}</div>` : `<div class="card">${empty('درخواستی در این بخش نیست.', I.flask)}</div>`}`;
};

/* ---------- maternal & child ---------- */
VIEWS.mch = () => {
  const tab = tabOf('mch', 'preg'); const t = TODAY();
  const pregs = Store.all('maternal_health').filter(m => m.status === 'active').sort((a, b) => (a.edd_date || '').localeCompare(b.edd_date || ''));
  const kids = Store.all('patients').filter(isChild);
  let body = '';
  if (tab === 'preg') {
    body = `<div class="card"><div class="card-h"><h3>حاملگی‌های فعال</h3>${can('mch') ? `<button class="btn sm pri" data-act="preg-new">${I.plus}ثبت حاملگی</button>` : ''}</div>${pregs.length ? `<div class="tw"><table class="t cards"><thead><tr><th>مادر</th><th>هفته</th><th>تاریخ تخمینی ولادت</th><th>G/P</th><th>خطر</th><th>ANC</th><th>آخرین فشار</th><th>ویزیت بعدی</th><th></th></tr></thead><tbody>${pregs.map(m => {
      const p = Store.get('patients', m.patient_id); const anc = Store.by('anc_visits', 'maternal_id', m.id).sort((a, b) => a.visit_date.localeCompare(b.visit_date)); const last = anc[anc.length - 1]; const ga = gaWeeks(m.lmp_date);
      const bpHigh = last && (last.bp_systolic >= 140 || last.bp_diastolic >= 90); const next = last && last.next_visit_date; const overdue = next && next < t;
      return `<tr><td>${who(patName(p), mono(p ? p.mrn : ''), 'b')}</td><td data-h="هفته"><b>${fa(ga)}</b> <span class="faint">(${ga < 14 ? 'سه‌ماهه اول' : ga < 28 ? 'سه‌ماهه دوم' : 'سه‌ماهه سوم'})</span></td><td data-h="ولادت">${fmtDate(m.edd_date || eddOf(m.lmp_date))}</td><td class="hide-m num">G${fa(m.gravida || 0)} P${fa(m.para || 0)}</td><td>${pill(L.risk, m.risk_level)}</td><td data-h="ANC" class="num">${fa(anc.length)} از ۸</td>
      <td data-h="فشار">${last && last.bp_systolic ? `<span class="${bpHigh ? 'pill crit' : ''}">${fa(last.bp_systolic + '/' + last.bp_diastolic)}</span>` : '—'}</td><td data-h="بعدی">${next ? `<span class="${overdue ? 'pill crit' : ''}">${fmtShort(next)}${overdue ? ' · معوقه' : ''}</span>` : '—'}</td>
      <td>${can('mch') ? `<div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-act="anc-new" data-id="${m.id}">ثبت ANC</button><button class="btn sm ghost" data-act="preg-close" data-id="${m.id}">ولادت</button></div>` : ''}</td></tr>`; }).join('')}</tbody></table></div>` : empty('حاملگی فعالی ثبت نشده.')}</div>
      ${pregs.some(m => { const a = Store.by('anc_visits', 'maternal_id', m.id).sort((x, y) => x.visit_date.localeCompare(y.visit_date)).pop(); return a && gaWeeks(m.lmp_date) >= 20 && (a.bp_systolic >= 140 || a.bp_diastolic >= 90); }) ? `<div style="margin-top:14px">${note('فشار خون ≥ ۱۴۰/۹۰ بعد از هفته ۲۰ حاملگی: برای پره‌اکلامپسی (پروتین ادرار و علائم) ارزیابی شود.', 'crit')}</div>` : ''}`;
  } else if (tab === 'child') {
    const rows = kids.map(p => { const ch = Store.by('child_health', 'patient_id', p.id)[0]; const g = ch ? Store.by('growth_monitoring', 'child_id', ch.id).sort((a, b) => a.measurement_date.localeCompare(b.measurement_date)) : []; return { p, ch, g, last: g[g.length - 1] }; });
    const cnt = s => rows.filter(r => r.last && r.last.nutritional_status === s).length;
    body = `<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="card kpi"><div class="l">سوء تغذیه شدید (SAM)</div><div class="v num" style="color:var(--crit)">${fa(cnt('SAM'))}</div><div class="s">MUAC کمتر از ۱۱٫۵ سانتی‌متر</div></div><div class="card kpi"><div class="l">سوء تغذیه متوسط (MAM)</div><div class="v num" style="color:var(--warn)">${fa(cnt('MAM'))}</div><div class="s">MUAC ۱۱٫۵ تا ۱۲٫۵</div></div><div class="card kpi"><div class="l">نورمال</div><div class="v num" style="color:var(--ok)">${fa(cnt('normal'))}</div><div class="s">از ${fa(rows.length)} طفل زیر ۵ سال</div></div></div>
    <div class="card"><div class="card-h"><h3>اطفال زیر ۵ سال</h3></div>${rows.length ? `<div class="lst">${rows.map(({ p, ch, g, last }) => `<div class="li"><div class="grow" data-act="open-patient" data-id="${p.id}" style="cursor:pointer">${who(patName(p), ageText((patUser(p) || {}).date_of_birth) + ' · ' + esc(p.district || ''), (patUser(p) || {}).gender === 'female' ? 'b' : '')}</div>
      ${g.length > 1 ? `<span class="hide-m">${sparkline(g.map(x => x.muac_cm), { w: 90, h: 28, color: last.nutritional_status === 'normal' ? 'var(--ok)' : 'var(--crit)' })}</span>` : ''}
      <div style="text-align:end;font-size:12.5px">${last ? `MUAC <b>${nf(last.muac_cm, 1)}</b> · ${nf(last.weight_kg, 1)} kg<div class="faint">${fmtShort(last.measurement_date)}</div>` : '<span class="faint">بدون اندازه‌گیری</span>'}</div>
      ${last ? pill(L.nut, last.nutritional_status) : ''}${can('mch') ? `<button class="btn sm" data-act="growth-new" data-id="${p.id}">اندازه‌گیری</button>` : ''}</div>`).join('')}</div>` : empty('طفل زیر ۵ سال ثبت نشده.')}</div>`;
  } else {
    const rows = kids.map(p => ({ p, epi: epiFor(p) }));
    const upToDate = rows.filter(r => !r.epi.some(e => e.st === 'overdue')).length;
    body = `<div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="card kpi"><div class="l">پوشش به‌موقع</div><div class="v num">${fa(rows.length ? Math.round(upToDate / rows.length * 100) : 0)}<small>٪</small></div><div class="bar"><i style="width:${rows.length ? upToDate / rows.length * 100 : 0}%"></i></div></div><div class="card kpi"><div class="l">دوزهای معوقه</div><div class="v num" style="color:var(--crit)">${fa(rows.reduce((n, r) => n + r.epi.filter(e => e.st === 'overdue').length, 0))}</div><div class="s">بیش از ۴ هفته از موعد</div></div><div class="card kpi"><div class="l">موعد این ماه</div><div class="v num">${fa(rows.reduce((n, r) => n + r.epi.filter(e => e.st === 'due').length, 0))}</div></div></div>
    <div class="card"><div class="card-h"><h3>برنامه واکسیناسیون اطفال (EPI)</h3></div><div class="lst">${rows.map(({ p, epi }) => { const pend = epi.filter(e => e.st === 'overdue' || e.st === 'due'); const nextUp = epi.find(e => e.st === 'upcoming');
      return `<div class="li" style="align-items:flex-start"><div style="min-width:190px;cursor:pointer" data-act="open-patient" data-id="${p.id}">${who(patName(p), ageText((patUser(p) || {}).date_of_birth), (patUser(p) || {}).gender === 'female' ? 'b' : '')}</div><div class="grow"><div class="chips">${pend.length ? pend.map(e => `<span class="pill ${e.st === 'overdue' ? 'crit' : 'warn'}">${esc(e.name)}${can('vacc') ? ` <button class="ib" style="width:20px;height:20px" title="ثبت تطبیق امروز" data-act="vacc-give" data-id="${p.id}" data-code="${e.code}" data-dose="${e.dose}" data-name="${esc(e.name)}">${I.check}</button>` : ''}</span>`).join('') : '<span class="pill ok"><i></i>به‌روز</span>'}</div>${nextUp ? `<div class="faint" style="font-size:12px;margin-top:4px">بعدی: ${esc(nextUp.name)} · ${fmtShort(nextUp.due)}</div>` : ''}</div><span class="faint num" style="font-size:12px">${fa(epi.filter(e => e.done).length)}/${fa(EPI.length)}</span></div>`; }).join('') || empty('طفل زیر ۵ سال ثبت نشده.')}</div></div>`;
  }
  return `${ph('صحت عامه', 'صحت مادر و طفل', 'مراقبت‌های قبل از ولادت (ANC)، پایش رشد و سوء تغذیه با MUAC، و برنامه ملی واکسیناسیون اطفال.')}
  ${tabs('mch', [['preg', 'حاملگی‌ها', pregs.length], ['child', 'رشد و تغذیه', kids.length], ['epi', 'واکسیناسیون']], 'preg')}${body}`;
};

/* ---------- surveillance ---------- */
const epiWeek = (s) => { const d = parseISO(s); const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); };
function survData() {
  const rows = Store.all('disease_surveillance');
  const year = rows.length ? Math.max(...rows.map(r => r.year)) : new Date().getFullYear();
  const yr = rows.filter(r => r.year === year);
  const weeksAll = [...new Set(yr.map(r => r.week_number))].sort((a, b) => a - b).slice(-8);
  const sum = {}, deaths = {}, byDist = {};
  for (const r of yr) { if (!weeksAll.includes(r.week_number)) continue; (sum[r.disease_name] = sum[r.disease_name] || {})[r.week_number] = (sum[r.disease_name][r.week_number] || 0) + (r.new_cases || 0); (deaths[r.disease_name] = deaths[r.disease_name] || {})[r.week_number] = (deaths[r.disease_name][r.week_number] || 0) + (r.deaths || 0); }
  const last = weeksAll[weeksAll.length - 1];
  for (const r of yr) if (r.week_number === last) ((byDist[r.disease_name] = byDist[r.disease_name] || {})[r.district] = (byDist[r.disease_name][r.district] || 0) + (r.new_cases || 0));
  const diseases = Object.keys(sum).sort((a, b) => Object.values(sum[b]).reduce((x, y) => x + y, 0) - Object.values(sum[a]).reduce((x, y) => x + y, 0));
  return { year, weeks: weeksAll, sum, deaths, byDist, diseases, last };
}
VIEWS.surveillance = () => {
  const sv = survData(); const { weeks, sum, last } = sv; const prev = weeks[weeks.length - 2];
  const tot = w => sv.diseases.reduce((n, d) => n + (sum[d][w] || 0), 0);
  const dth = sv.diseases.reduce((n, d) => n + ((sv.deaths[d] || {})[last] || 0), 0);
  const signals = sv.diseases.map(d => { const base = weeks.slice(-5, -1).map(w => sum[d][w] || 0); const avg = base.reduce((a, b) => a + b, 0) / Math.max(1, base.length); const cur = sum[d][last] || 0; return { d, cur, avg, ratio: avg ? cur / avg : (cur ? 9 : 0) }; }).filter(s => s.cur >= 5 && s.ratio >= 1.8);
  const active = Store.all('epidemic_alerts').filter(a => !a.is_resolved);
  const colors = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
  const top = sv.diseases.slice(0, 4); const selD = S.f.sd && sum[S.f.sd] ? S.f.sd : sv.diseases[0];
  const maxCell = Math.max(1, ...sv.diseases.flatMap(d => weeks.map(w => sum[d][w] || 0)));
  const shade = v => { const k = Math.min(5, Math.floor(v / maxCell * 5.999)); return `background:var(--seq-${k});color:var(--seq-ink-${k})`; };
  const dist = Object.entries((sv.byDist[selD] || {})).sort((a, b) => b[1] - a[1]);
  return `${ph(`صحت عامه · هفته اپیدمیولوژیک ${fa(last || '—')} سال ${fa(sv.year)}`, 'نظارت بیماری‌ها (IDSR)', 'گزارش هفتگی بیماری‌های اولویت‌دار به تفکیک ولسوالی، با تشخیص خودکار شیوع (موارد هفته جاری ≥ ۱٫۸ برابر میانگین ۴ هفته قبل).', can('surv') ? `<button class="btn pri" data-act="surv-new">${I.plus}گزارش هفتگی</button>` : '')}
  <div class="kpis"><div class="card kpi"><div class="l">موارد جدید این هفته</div><div class="v num">${nf(tot(last))}</div><div class="s">${prev ? (tot(last) >= tot(prev) ? '▲ ' : '▼ ') + fa(Math.abs(Math.round((tot(last) - tot(prev)) / Math.max(1, tot(prev)) * 100))) + '٪ نسبت به هفته قبل' : ''}</div></div>
    <div class="card kpi ${dth ? 'alert' : ''}"><div class="l">مرگ گزارش‌شده</div><div class="v num">${fa(dth)}</div><div class="s">هفته ${fa(last || '—')}</div></div>
    <div class="card kpi ${signals.length ? 'alert' : ''}"><div class="l">سیگنال شیوع</div><div class="v num">${fa(signals.length)}</div><div class="s">بیماری بالاتر از آستانه</div></div>
    <div class="card kpi ${active.length ? 'alert' : ''}"><div class="l">هشدارهای فعال</div><div class="v num">${fa(active.length)}</div><div class="s">ارسال‌شده به وزارت صحت عامه</div></div></div>
  ${signals.length || active.length ? `<div class="g g2" style="margin-bottom:18px">
    <div class="card"><div class="card-h"><h3>${I.alert}سیگنال‌های شیوع</h3></div><div class="lst">${signals.length ? signals.map(s => { const has = active.find(a => a.disease_name === s.d); return `<div class="li"><div class="grow"><b style="font-weight:600">${esc(s.d)}</b><div class="faint" style="font-size:12.5px">${fa(s.cur)} مورد در هفته ${fa(last)} · میانگین ۴ هفته قبل ${nf(s.avg, 1)} · ${nf(s.ratio, 1)} برابر</div></div>${has ? '<span class="pill crit"><i></i>هشدار صادر شده</span>' : can('alert') ? `<button class="btn sm pri" data-act="alert-new" data-d="${esc(s.d)}" data-n="${s.cur}">صدور هشدار</button>` : ''}</div>`; }).join('') : empty('سیگنالی بالاتر از آستانه نیست.', I.check)}</div></div>
    <div class="card"><div class="card-h"><h3>هشدارهای اپیدمی فعال</h3></div><div class="lst">${active.length ? active.map(a => `<div class="li" style="align-items:flex-start"><div class="grow"><div class="row" style="gap:6px">${pill(L.epi, a.severity)}<b style="font-weight:600">${esc(a.disease_name)}</b><span class="faint">${esc(a.district || '')}</span></div><div class="muted" style="font-size:12.5px;margin-top:4px">${esc(a.description || '')}</div>${a.recommended_actions ? `<div class="faint" style="font-size:12px">اقدام: ${esc(a.recommended_actions)}</div>` : ''}</div>${can('alert') ? `<button class="btn sm" data-act="alert-resolve" data-id="${a.id}">رفع شد</button>` : ''}</div>`).join('') : empty('هشدار فعالی نیست.', I.check)}</div></div></div>` : ''}
  <div class="g g-21" style="margin-bottom:18px">
    <div class="card"><div class="card-h"><h3>روند ۸ هفته اخیر <small>موارد جدید، ۴ بیماری پرتکرار</small></h3></div><div class="card-b">${top.length ? lineChart(top.map((d, i) => ({ name: d, short: '', color: colors[i], values: weeks.map(w => sum[d][w] || 0) })), weeks.map(w => 'هفته ' + fa(w)), { h: 240, aria: 'روند بیماری‌ها' }) + `<div class="legend" style="margin-top:8px">${top.map((d, i) => `<span><i style="background:${colors[i]}"></i>${esc(d)}</span>`).join('')}</div>` : empty('گزارشی ثبت نشده.')}</div></div>
    <div class="card"><div class="card-h"><h3>توزیع ولسوالی‌ها <small>هفته ${fa(last || '—')}</small></h3></div><div class="card-b"><div class="fbar" style="margin-bottom:10px">${fsel('sd', selD, sv.diseases.map(d => [d, d]), 'انتخاب بیماری')}</div>${dist.length ? `<div class="stack" style="gap:8px">${dist.map(([k, v]) => `<div><div class="row between" style="font-size:13px"><span>${esc(k)}</span><b class="num">${fa(v)}</b></div><div class="occ"><i style="width:${v / dist[0][1] * 100}%;background:var(--accent)"></i></div></div>`).join('')}</div>` : empty('داده‌ای نیست.')}</div></div>
  </div>
  <div class="card"><div class="card-h"><h3>جدول هفتگی موارد جدید</h3><small class="faint">رنگ تیره‌تر = موارد بیشتر</small></div><div class="card-b tw"><table class="heat"><thead><tr><th></th>${weeks.slice().reverse().map(w => `<th>هفته ${fa(w)}</th>`).join('')}<th>مجموع</th></tr></thead><tbody>${sv.diseases.map(d => `<tr><th class="dn">${esc(d)}</th>${weeks.slice().reverse().map(w => `<td style="${shade(sum[d][w] || 0)}" data-tip="${esc(d)}&#10;هفته ${fa(w)}: ${fa(sum[d][w] || 0)} مورد">${fa(sum[d][w] || 0)}</td>`).join('')}<td><b>${fa(weeks.reduce((n, w) => n + (sum[d][w] || 0), 0))}</b></td></tr>`).join('')}</tbody></table></div></div>`;
};

/* ---------- emergency & blood ---------- */
const minsSince = ts => ts ? Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000)) : null;
const minsBetween = (a, b) => (a && b) ? Math.round((new Date(b) - new Date(a)) / 60000) : null;
const ago = m => m == null ? '' : m < 60 ? fa(m) + ' دقیقه پیش' : m < 1440 ? fa(Math.floor(m / 60)) + ' ساعت پیش' : fa(Math.floor(m / 1440)) + ' روز پیش';
VIEWS.emergency = () => {
  const calls = Store.all('emergency_calls'); const cols = ['received', 'dispatched', 'arrived', 'transported'];
  const tr = { red: 0, yellow: 1, green: 2 };
  const resolved = calls.filter(c => c.arrived_at && c.received_at); const avgResp = resolved.length ? Math.round(resolved.reduce((n, c) => n + minsBetween(c.received_at, c.arrived_at), 0) / resolved.length) : null;
  const ambs = Store.all('ambulances');
  const next = { received: 'dispatch', dispatched: 'arrived', arrived: 'transported', transported: 'resolved' };
  const nextL = { dispatch: 'اعزام امبولانس', arrived: 'رسید به محل', transported: 'انتقال به شفاخانه', resolved: 'بستن پرونده' };
  const hs = Store.all('hospitals').filter(h => Store.countBy('blood_bank', 'hospital_id', h.id));
  return `${ph('صحت عامه', 'عاجل، امبولانس و بانک خون', 'تریاژ دیجیتال (سرخ، زرد، سبز)، اعزام نزدیک‌ترین امبولانس آماده و موجودی خون شفاخانه‌ها.', can('call') ? `<button class="btn pri" data-act="call-new">${I.siren}تماس عاجل جدید</button>` : '')}
  <div class="kpis"><div class="card kpi ${calls.some(c => c.triage === 'red' && cols.includes(c.status)) ? 'alert' : ''}"><div class="l">تماس‌های فعال</div><div class="v num">${fa(calls.filter(c => cols.includes(c.status)).length)}</div><div class="s">${fa(calls.filter(c => c.triage === 'red' && cols.includes(c.status)).length)} مورد سرخ</div></div>
    <div class="card kpi"><div class="l">میانگین زمان رسیدن</div><div class="v num">${avgResp != null ? fa(avgResp) : '—'}<small>دقیقه</small></div><div class="s">هدف: کمتر از ۱۵ دقیقه در شهر</div><div class="bar"><i style="width:${avgResp ? Math.min(100, avgResp / 30 * 100) : 0}%;background:${avgResp > 15 ? 'var(--warn)' : 'var(--ok)'}"></i></div></div>
    <div class="card kpi"><div class="l">امبولانس آماده</div><div class="v num">${fa(ambs.filter(a => a.status === 'available').length)}<small>از ${fa(ambs.length)}</small></div></div>
    <div class="card kpi"><div class="l">گروه‌های خون در کمبود</div><div class="v num">${fa(Store.all('blood_bank').filter(b => b.units_available < 5).length)}</div><div class="s">کمتر از ۵ واحد در یک شفاخانه</div></div></div>
  <div class="kan" style="margin-bottom:18px">${cols.map(s => { const cs = calls.filter(c => c.status === s).sort((a, b) => tr[a.triage] - tr[b.triage] || (a.received_at || '').localeCompare(b.received_at || '')); return `<div class="kcol"><h4><span>${L.call[s][0]}</span><span class="num">${fa(cs.length)}</span></h4>${cs.map(c => { const am = Store.get('ambulances', c.ambulance_id); return `<div class="kc ${c.triage || ''}"><div class="row between"><span class="row" style="gap:6px"><span class="tri ${c.triage}"></span><b style="font-size:12.5px">${{ red: 'سرخ — فوری', yellow: 'زرد — عاجل', green: 'سبز — قابل انتظار' }[c.triage] || 'بدون تریاژ'}</b></span><span class="faint" style="font-size:11.5px">${ago(minsSince(c.received_at))}</span></div><div style="font-size:13.5px">${esc(c.situation)}</div><div class="faint" style="font-size:12px">${esc(c.location_text || '')}${c.district ? ' · ' + esc(c.district) : ''}</div>${am ? `<div class="faint" style="font-size:12px">${I.amb.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"')} ${mono(am.vehicle_number)}${c.hospital_id ? ' ← ' + esc(hospName(c.hospital_id)) : ''}</div>` : ''}<div class="copy faint" style="font-size:12px">${esc(c.caller_phone)}</div>${can('call') ? `<div class="row"><button class="btn sm pri" data-act="call-next" data-id="${c.id}" data-s="${next[s]}">${nextL[next[s]]}</button>${s === 'received' ? `<button class="btn sm ghost" data-act="call-next" data-id="${c.id}" data-s="cancelled">لغو</button>` : ''}</div>` : ''}</div>`; }).join('') || '<div class="faint" style="font-size:12.5px;text-align:center;padding:12px">خالی</div>'}</div>`; }).join('')}</div>
  <div class="g g-12">
    <div class="card"><div class="card-h"><h3>${I.amb}امبولانس‌ها</h3></div><div class="lst">${ambs.map(a => `<div class="li"><div class="grow"><b class="mono">${esc(a.vehicle_number)}</b><div class="faint" style="font-size:12px">${L.ambType[a.type] || ''} · ${esc(hospName(a.hospital_id))}</div></div>${pill(L.amb, a.status)}</div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>${I.drop}بانک خون <small>واحد خون کامل</small></h3></div><div class="card-b stack">${hs.map(h => `<div><div class="fs-h">${esc(h.name)}</div><div class="bgrid">${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => { const b = Store.by('blood_bank', 'hospital_id', h.id).find(x => x.blood_type === t); const u = b ? b.units_available : 0; return `<div class="bcell ${u === 0 ? 'out' : u < 5 ? 'low' : ''}"><div class="ty">${t}</div><div class="u num">${fa(u)}</div>${b && can('blood') ? `<div class="adj"><button data-act="blood" data-id="${b.id}" data-d="-1" aria-label="کم کردن یک واحد ${t}">−</button><button data-act="blood" data-id="${b.id}" data-d="1" aria-label="افزودن یک واحد ${t}">+</button></div>` : ''}</div>`; }).join('')}</div></div>`).join('') || empty('بانک خونی ثبت نشده.')}</div></div>
  </div>`;
};

/* ---------- system: audit + schema ---------- */
VIEWS.system = () => {
  const tab = tabOf('sys', 'audit');
  let body;
  if (tab === 'audit') {
    const logs = Store.all('audit_logs').sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 200);
    body = `<div class="card">${logs.length ? `<div class="tw"><table class="t"><thead><tr><th>زمان</th><th>نقش</th><th>عملیات</th><th>جدول</th><th>رکورد</th><th>فیلدهای تغییرکرده</th></tr></thead><tbody>${logs.map(l => `<tr><td class="num">${fmtDT(l.created_at)}</td><td>${esc((ROLE_UI[l.role] || {}).label || l.role || '—')}</td><td>${pill(L.action, l.action)}</td><td>${esc((SCHEMA[l.table_name] || {}).label || l.table_name)}</td><td>${esc(l.label || '')}</td><td class="faint" style="font-size:12px">${l.changes ? Object.keys(l.changes).map(k => esc(FIELD_FA[k] || k)).join('، ') : ''}</td></tr>`).join('')}</tbody></table></div>` : empty('هنوز تغییری ثبت نشده است. هر ایجاد، ویرایش یا حذف اینجا با نقش کاربر ثبت می‌شود.', I.list)}</div>`;
  } else {
    body = `<div class="card"><div class="card-h"><h3>جدول‌ها و رابطه‌ها</h3><small class="faint">${fa(Object.keys(SCHEMA).length)} جدول · ${nf(Object.keys(SCHEMA).reduce((n, t) => n + Store.count(t), 0))} رکورد</small></div><div class="tw"><table class="t"><thead><tr><th>جدول</th><th class="n">رکورد</th><th>کلید خارجی (رابطه به)</th><th>جدول‌های وابسته</th><th>یکتا</th></tr></thead><tbody>${Object.entries(SCHEMA).map(([t, d]) => `<tr><td><b style="font-weight:600">${esc(d.label)}</b><div class="mono faint">${t}</div></td><td class="n">${nf(Store.count(t))}</td><td style="font-size:12.5px">${Object.entries(d.fk || {}).map(([c, [p, m]]) => `<div><span class="mono">${c}</span> → ${esc(SCHEMA[p].label)} <span class="faint">(${{ r: 'محدود', c: 'حذف آبشاری', n: 'خالی‌سازی' }[m]})</span></div>`).join('') || '<span class="faint">—</span>'}</td><td style="font-size:12.5px">${Store.refs[t].map(r => esc(SCHEMA[r.table].label)).join('، ') || '<span class="faint">—</span>'}</td><td>${(d.uniq || []).map(u => `<span class="mono">${u}</span>`).join(' ') || '<span class="faint">—</span>'}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
  return `${ph('سیستم', 'داده و تغییرات', `موتور رابطه‌ای با شاخص روی همه کلیدهای خارجی؛ خواندن فوری از حافظه و نوشتن غیرهمزمان در پایگاه داده ${Sync.state === 'local' ? '(اکنون در حالت محلی)' : Sync.device ? '(اکنون روی همین دستگاه)' : 'همگام بین کاربران'}.`)}
  ${Sync.device ? `<div class="banner">${I.info}<span style="flex:1">نسخه آفلاین: داده‌ها در حافظه همین مرورگر ذخیره می‌شوند.</span><button class="btn sm" data-act="reset-data">بازگردانی داده نمونه</button></div>` : ''}${tabs('sys', [['audit', 'گزارش تغییرات', Store.count('audit_logs')], ['schema', 'ساختار داده']], 'audit')}${body}`;
};

/* ================= modal system ================= */
let M = null;
function openModal(cfg) {
  closeModal();
  M = Object.assign({ state: {}, error: null, parts: {}, saveLabel: 'ثبت' }, cfg);
  const root = document.createElement('div'); root.className = 'scrim';
  root.innerHTML = `<div class="modal ${cfg.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="mh"><div><h2 id="mt">${cfg.title}</h2>${cfg.sub ? `<div class="sub">${cfg.sub}</div>` : ''}</div><button class="ib" data-act="m-close" aria-label="بستن">${I.x}</button></div><div class="mb"></div>${cfg.save === false && !cfg.footer ? '' : '<div class="mf"></div>'}</div>`;
  document.body.appendChild(root); M.root = root;
  root.addEventListener('mousedown', e => { if (e.target === root) closeModal(); });
  renderModal();
  setTimeout(() => { if (!M || matchMedia('(max-width:640px)').matches) return; const f = root.querySelector('.mb input:not([type=checkbox]),.mb select,.mb textarea'); f && f.focus(); }, 40);
}
function renderModal() {
  if (!M) return;
  M.root.querySelector('.mb').innerHTML = (M.error ? `<div class="form-err">${note(esc(M.error), 'crit')}</div>` : '') + M.view(M.state, M);
  const mf = M.root.querySelector('.mf');
  if (mf) mf.innerHTML = M.footer ? M.footer(M.state, M) : `<button class="btn pri" data-act="m-save">${I.check}${M.saveLabel}</button><button class="btn" data-act="m-close">انصراف</button>`;
}
function renderParts(names) { for (const n of names) { const el = M && M.root.querySelector(`[data-part="${n}"]`); if (el && M.parts[n]) el.innerHTML = M.parts[n](M.state, M); } }
function closeModal() { if (M && M.root) M.root.remove(); M = null; }
function modalSave() {
  if (!M) return;
  try { const msg = M.save(M.state, M); closeModal(); if (msg) toast(msg); }
  catch (e) { if (!(e instanceof DbErr)) console.error(e); M.error = e.message; renderModal(); M.root.querySelector('.mb').scrollTop = 0; }
}
function toast(msg, kind = '') { const el = document.createElement('div'); el.className = 'toast ' + kind; el.innerHTML = (kind === 'err' ? I.alert : I.check) + `<span>${esc(msg)}</span>`; document.getElementById('toasts').appendChild(el); setTimeout(() => el.remove(), kind === 'err' ? 6000 : 3200); }
const need = (v, label) => { if (v == null || v === '' || (typeof v === 'number' && isNaN(v))) throw new DbErr(`«${label}» را وارد کنید.`); return v; };
const numOrNull = v => v == null || v === '' ? null : Number(v);
const actorUser = () => { const r = Store.all('roles').find(x => x.name === S.role); const u = r && Store.by('users', 'role_id', r.id)[0]; return u ? u.id : null; };

/* ---------- patient form ---------- */
function patientForm(id) {
  const p = id ? Store.get('patients', id) : null; const u = p ? patUser(p) : null;
  const st = p ? { first_name: u.first_name, last_name: u.last_name, first_name_en: u.first_name_en, last_name_en: u.last_name_en, national_id: u.national_id, phone: u.phone, gender: u.gender, date_of_birth: u.date_of_birth, blood_type: u.blood_type, district: p.district, village: p.village, address: p.address, marital_status: p.marital_status, occupation: p.occupation, emergency_contact: p.emergency_contact, emergency_phone: p.emergency_phone, emergency_relation: p.emergency_relation, allergies: (p.allergies || []).map(a => a.drug + (a.reaction ? ' : ' + a.reaction : '')).join('\n'), chronic: (p.chronic_conditions || []).join('\n') } : { gender: '', blood_type: 'Unknown', district: 'هرات' };
  openModal({
    title: p ? 'ویرایش پرونده بیمار' : 'ثبت بیمار جدید', sub: p ? mono(p.mrn) : 'نمبر پرونده (MRN) خودکار ساخته می‌شود', wide: true, state: st, saveLabel: p ? 'ذخیره تغییرات' : 'ثبت بیمار', parts: { dobh: s => dateHint(s.date_of_birth) },
    view: s => `<fieldset class="fs"><legend>هویت</legend><div class="grid-f">
      ${field('نام', inp('first_name', s.first_name), { req: 1, for: 'f-first_name' })}${field('تخلص', inp('last_name', s.last_name), { req: 1, for: 'f-last_name' })}
      ${field('نام به انگلیسی', inp('first_name_en', s.first_name_en, { dir: 'ltr' }), { for: 'f-first_name_en' })}${field('تخلص به انگلیسی', inp('last_name_en', s.last_name_en, { dir: 'ltr' }), { for: 'f-last_name_en' })}
      ${field('نمبر تذکره', inp('national_id', s.national_id, { dir: 'ltr', ph: '1400-0101-12345' }), { for: 'f-national_id', hint: 'یکتا؛ از ثبت تکراری جلوگیری می‌شود' })}${field('شماره موبایل', inp('phone', s.phone, { dir: 'ltr', ph: '07XXXXXXXX', attrs: 'inputmode="tel"' }), { req: 1, for: 'f-phone', hint: 'برای یادآوری نوبت با SMS' })}
      ${field('جنس', sel('gender', s.gender, [['male', 'مرد'], ['female', 'زن']]), { req: 1, for: 'f-gender' })}${field('تاریخ تولد', inp('date_of_birth', s.date_of_birth, { type: 'date', parts: 'dobh' }), { req: 1, for: 'f-date_of_birth' }).replace('</div>', `<span class="hint" data-part="dobh">${dateHint(s.date_of_birth)}</span></div>`)}
      ${field('گروه خون', sel('blood_type', s.blood_type, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(x => [x, x]).concat([['Unknown', 'نامعلوم']]), { blank: false }), { for: 'f-blood_type' })}${field('حالت مدنی', sel('marital_status', s.marital_status, Object.entries(L.marital)), { for: 'f-marital_status' })}
    </div></fieldset>
    <fieldset class="fs"><legend>آدرس و تماس اضطراری</legend><div class="grid-f">
      ${field('ولسوالی', sel('district', s.district, districtOpts()), { req: 1, for: 'f-district' })}${field('قریه / ناحیه', inp('village', s.village), { for: 'f-village' })}${field('شغل', inp('occupation', s.occupation), { for: 'f-occupation' })}
      ${field('نام تماس اضطراری', inp('emergency_contact', s.emergency_contact), { for: 'f-emergency_contact' })}${field('نسبت', inp('emergency_relation', s.emergency_relation, { ph: 'مثلاً پدر، همسر' }), { for: 'f-emergency_relation' })}${field('شماره تماس اضطراری', inp('emergency_phone', s.emergency_phone, { dir: 'ltr' }), { for: 'f-emergency_phone' })}
    </div></fieldset>
    <fieldset class="fs"><legend>سوابق طبی مهم</legend><div class="grid-f">
      ${field('حساسیت‌های دارویی و غذایی', txt('allergies', s.allergies, { ph: 'هر سطر یک مورد، مثلاً:\nPenicillin : کهیر' }), { for: 'f-allergies', hint: 'با نسخه‌نویسی خودکار مقایسه می‌شود (نام دوا یا گروه دوایی)' })}
      ${field('بیماری‌های مزمن', txt('chronic', s.chronic, { ph: 'هر سطر یک مورد' }), { for: 'f-chronic' })}
    </div></fieldset>`,
    save: s => {
      need(s.first_name, 'نام'); need(s.last_name, 'تخلص'); need(s.gender, 'جنس'); need(s.date_of_birth, 'تاریخ تولد'); need(s.phone, 'شماره موبایل');
      if (s.date_of_birth > TODAY()) throw new DbErr('تاریخ تولد نمی‌تواند در آینده باشد.');
      const phone = toLatin(s.phone).replace(/[\s-]/g, ''); if (!/^(\+93|0093|0)?7\d{8}$/.test(phone)) throw new DbErr('شماره موبایل معتبر نیست؛ مثال درست: 0799123456');
      const allergies = String(s.allergies || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => { const [drug, reaction] = x.split(/[:：]/); return { drug: drug.trim(), reaction: (reaction || '').trim() || null }; });
      const chronic = String(s.chronic || '').split('\n').map(x => x.trim()).filter(Boolean);
      const uData = { first_name: s.first_name.trim(), last_name: s.last_name.trim(), first_name_en: s.first_name_en || null, last_name_en: s.last_name_en || null, national_id: s.national_id ? toLatin(s.national_id).trim() : null, phone, gender: s.gender, date_of_birth: s.date_of_birth, blood_type: s.blood_type || 'Unknown' };
      const pData = { district: s.district, village: s.village || null, marital_status: s.marital_status || null, occupation: s.occupation || null, emergency_contact: s.emergency_contact || null, emergency_phone: s.emergency_phone || null, emergency_relation: s.emergency_relation || null, allergies, chronic_conditions: chronic, province: 'هرات' };
      if (p) { Store.tx(() => { Store.update('users', u.id, uData); Store.update('patients', p.id, pData); }); return 'پرونده بیمار به‌روز شد.'; }
      const newP = Store.tx(() => { const nu = Store.insert('users', Object.assign(uData, { role_id: 'role-patient', status: 'active', language: 'dari', is_verified: false, email: null })); return Store.insert('patients', Object.assign(pData, { user_id: nu.id, mrn: genMRN(), registered_at: nowISO() })); });
      setTimeout(() => go('patient', newP.id)); return `بیمار با نمبر پرونده ${newP.mrn} ثبت شد.`;
    },
  });
}

/* ---------- booking ---------- */
function slotsFor(docId, date) {
  const dow = parseISO(date).getDay();
  const av = Store.by('doctor_availability', 'doctor_id', docId).filter(a => a.is_active !== false && Number(a.day_of_week) === dow);
  const taken = new Set(Store.by('appointments', 'doctor_id', docId).filter(a => a.appointment_date === date && !['cancelled', 'no_show'].includes(a.status)).map(a => a.appointment_time));
  const out = []; const now = new Date(); const isToday = date === TODAY();
  for (const a of av) { let [h, m] = a.start_time.split(':').map(Number); const [eh, em] = a.end_time.split(':').map(Number); const step = a.slot_duration || 15;
    while (h * 60 + m + step <= eh * 60 + em) { const t = pad2(h) + ':' + pad2(m); const past = isToday && (h * 60 + m) <= now.getHours() * 60 + now.getMinutes(); out.push({ t, taken: taken.has(t), past }); m += step; h += Math.floor(m / 60); m %= 60; } }
  return out;
}
function bookForm(o = {}) {
  const st = { patient_id: o.patient || null, pq: '', hospital_id: o.hospital || '', doctor_id: o.doctor || '', date: o.date || TODAY(), time: '', type: 'in_person', priority: 'normal', reason: '', amount: null, method: 'cash' };
  if (st.doctor_id) st.hospital_id = (Store.get('doctors', st.doctor_id) || {}).hospital_id;
  openModal({
    title: 'نوبت جدید', sub: 'زمان‌های پُرشده به‌صورت زنده غیرفعال می‌شوند', wide: true, state: st, saveLabel: 'ثبت نوبت',
    parts: {
      pres: s => patientPicker(s), ppres: s => ppres(s),
      docs: s => { const docs = Store.all('doctors').filter(d => !s.hospital_id || d.hospital_id === s.hospital_id); if (s.doctor_id && !docs.some(d => d.id === s.doctor_id)) { s.doctor_id = ''; s.time = ''; } return field('داکتر', `<select class="in" id="f-doctor_id" data-bind="doctor_id" data-parts="days,slots">${opt('', 'انتخاب داکتر…', s.doctor_id)}${docs.map(d => opt(d.id, docName(d) + ' — ' + docSpec(d), s.doctor_id)).join('')}</select>`, { req: 1, for: 'f-doctor_id' }); },
      days: s => { const t = TODAY(); let h = ''; for (let i = 0; i < 14; i++) { const d = addDays(t, i); const j = jal(d); const free = s.doctor_id ? slotsFor(s.doctor_id, d).filter(x => !x.taken && !x.past).length : null; h += `<button class="day ${i === 0 ? 'today' : ''}" data-act="bk-day" data-v="${d}" aria-pressed="${s.date === d}" ${s.doctor_id && !free ? 'disabled' : ''}><div class="w">${i === 0 ? 'امروز' : WEEKDAYS[parseISO(d).getDay()]}</div><div class="d">${fa(j.d)}</div><div class="m">${AF_MONTHS[j.m - 1]}</div><div class="c">${free == null ? '' : free ? fa(free) + ' آزاد' : 'پُر / تعطیل'}</div></button>`; } return h; },
      slots: s => { if (!s.doctor_id) return `<p class="faint">اول داکتر را انتخاب کنید.</p>`; const sl = slotsFor(s.doctor_id, s.date); if (!sl.length) return note('داکتر در این روز حضور ندارد (جمعه یا خارج از تقسیم اوقات).', 'warn'); return `<div class="slots">${sl.map(x => `<button class="slot" data-act="bk-slot" data-v="${x.t}" aria-pressed="${s.time === x.t}" ${x.taken || x.past ? 'disabled' : ''} aria-label="${x.taken ? 'گرفته شده' : 'آزاد'} ${x.t}">${x.t}</button>`).join('')}</div>`; },
    },
    view: s => `<div class="grid-f"><div class="full" data-part="pres">${patientPicker(s)}</div>
      ${field('شفاخانه', `<select class="in" id="f-hospital_id" data-bind="hospital_id" data-parts="docs,days,slots">${opt('', 'همه شفاخانه‌ها', s.hospital_id)}${hospOpts().map(([v, l]) => opt(v, l, s.hospital_id)).join('')}</select>`, { for: 'f-hospital_id' })}
      <div data-part="docs">${M.parts.docs(s)}</div>
      ${field('نوع نوبت', sel('type', s.type, Object.entries(L.apptType), { blank: false }), { for: 'f-type' })}${field('اولویت', sel('priority', s.priority, Object.entries(L.priority).map(([k, v]) => [k, v[0]]), { blank: false }), { for: 'f-priority' })}
      <div class="full f"><span class="lb req">روز</span><div class="days" data-part="days" style="margin:0">${M.parts.days(s)}</div></div>
      <div class="full f"><span class="lb req">ساعت</span><div data-part="slots">${M.parts.slots(s)}</div></div>
      ${field('دلیل مراجعه', inp('reason', s.reason, { ph: 'شکایت اصلی به زبان بیمار' }), { cls: 'span2', for: 'f-reason' })}
      ${field('فیس (افغانی)', inp('amount', s.amount, { num: 1, ph: 'اختیاری' }), { for: 'f-amount', hint: 'در صورت ورود، پرداخت مرتبط ثبت می‌شود' })}${field('روش پرداخت', sel('method', s.method, Object.entries(L.pay), { blank: false }), { for: 'f-method' })}</div>`,
    save: s => {
      need(s.patient_id, 'بیمار'); need(s.doctor_id, 'داکتر'); need(s.time, 'ساعت نوبت');
      const d = Store.get('doctors', s.doctor_id); if (d.status !== 'active') throw new DbErr('این داکتر فعلاً فعال نیست.');
      if (!slotsFor(s.doctor_id, s.date).some(x => x.t === s.time && !x.taken)) throw new DbErr('این ساعت دیگر آزاد نیست؛ ساعت دیگری انتخاب کنید.');
      const a = Store.tx(() => {
        const ap = Store.insert('appointments', { appointment_no: genNo('APT', 'appointments', 'appointment_no'), patient_id: s.patient_id, doctor_id: s.doctor_id, hospital_id: d.hospital_id, department_id: null, appointment_date: s.date, appointment_time: s.time, duration_minutes: 15, type: s.type, status: 'confirmed', priority: s.priority, reason: s.reason || null, notes: null, cancelled_by: null, cancel_reason: null, reminder_sent: false });
        if (s.amount != null && s.amount !== '') { if (!(s.amount >= 0)) throw new DbErr('مبلغ فیس معتبر نیست.'); Store.insert('payments', { payment_no: genNo('PAY', 'payments', 'payment_no'), patient_id: s.patient_id, appointment_id: ap.id, amount: Number(s.amount), currency: 'AFN', payment_method: s.method, status: s.method === 'free' ? 'completed' : 'pending', transaction_id: null, payment_date: nowISO(), notes: null }); }
        return ap;
      });
      S.day = s.date; return `نوبت ${a.appointment_no} برای ${fmtDate(s.date, true)} ساعت ${fmtTime(s.time)} ثبت شد.`;
    },
  });
}
function patientPicker(s) {
  if (s.patient_id) { const p = Store.get('patients', s.patient_id); return `<div class="f"><span class="lb req">بیمار</span><div class="row between" style="border:1px solid var(--line-2);border-radius:10px;padding:8px 12px">${who(patName(p), mono(p.mrn) + ' · ' + ageText((patUser(p) || {}).date_of_birth))}<button class="btn sm ghost" data-act="pp-clear">تغییر</button></div></div>`; }
  const q = normKey(s.pq || ''); const res = q.length >= 1 ? Store.all('patients').filter(p => patientMatches(p, q)).slice(0, 8) : [];
  return `<div class="f ac"><label class="req" for="f-pq">بیمار</label><input class="in" id="f-pq" data-bind="pq" data-parts="ppres" value="${esc(s.pq || '')}" placeholder="نام، MRN، تذکره یا شماره تماس را بنویسید" autocomplete="off"><div data-part="ppres">${ppres(s)}</div></div>`;
}
function ppres(s) { const q = normKey(s.pq || ''); if (!q) return ''; const res = Store.all('patients').filter(p => patientMatches(p, q)).slice(0, 8); return `<div class="res">${res.length ? res.map(p => `<button data-act="pp-pick" data-id="${p.id}"><span>${esc(patName(p))}</span><span class="mono faint">${esc(p.mrn)}</span></button>`).join('') : '<div class="faint" style="padding:8px 10px;font-size:13px">بیماری پیدا نشد؛ اول بیمار را ثبت کنید.</div>'}</div>`; }

/* ---------- visit (encounter) ---------- */
function visitForm(apptId) {
  const a = Store.get('appointments', apptId); const p = Store.get('patients', a.patient_id); const u = patUser(p); const adult = (ageYears(u.date_of_birth) ?? 20) >= 16;
  if (a.status === 'checked_in') Store.update('appointments', a.id, { status: 'in_progress' });
  const labs = Store.all('laboratories'); const own = labs.find(l => l.hospital_id === a.hospital_id) || labs[0];
  const st = { cc: a.reason || '', exam: '', assess: '', plan: '', fu: '', dx: [], dxq: '', rx: [], mq: '', tests: {}, lab: own ? own.id : '', lab_pri: 'routine', pharmacy: '', v: {} };
  const vitalsPart = s => { const v = s.v; const b = bmiOf(v.weight_kg, v.height_cm); const n = adult ? news2(v) : null; const crisis = v.bp_systolic >= 180 || v.bp_diastolic >= 110;
    return `<div class="row" style="gap:8px;margin-top:10px">${b ? `<span class="pill line">BMI ${nf(b, 1)} · ${bmiClass(b)}</span>` : ''}${n ? `<span class="pill ${NEWS_L[n.level][1]}">NEWS2 ${fa(n.score)} · ${NEWS_L[n.level][0]}</span>` : ''}${v.muac_cm ? pill(L.nut, muacClass(v.muac_cm)) : ''}${crisis ? '<span class="pill crit"><i></i>بحران فشار خون — پروتکل عاجل</span>' : ''}${v.oxygen_sat != null && v.oxygen_sat < 92 ? '<span class="pill crit"><i></i>هایپوکسی</span>' : ''}</div>`; };
  const rxWarn = s => { const ids = s.rx.map(r => r.medicine_id); const act = [...activeMeds(p)].filter(x => !ids.includes(x)); const al = s.rx.flatMap(r => allergyHits(p, r.medicine_id).map(x => `${medName(r.medicine_id)} ↔ حساسیت ثبت‌شده به ${x.drug}`)); const di = interactionsAmong(ids.concat(act)).filter(x => ids.includes(x.drug1_id) || ids.includes(x.drug2_id));
    const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
    return (al.length ? note('<b>هشدار حساسیت:</b> ' + esc(al.join('؛ ')), 'crit') : '') + di.map(x => note(`<b>تداخل ${L.di[x.severity][0]}:</b> ${esc(medName(x.drug1_id))} + ${esc(medName(x.drug2_id))} — ${esc(x.description)} <span class="faint">${esc(x.management || '')}</span>`, x.severity === 'major' || x.severity === 'contraindicated' ? 'crit' : 'warn')).join('') + (dup.length ? note('دوای تکراری در نسخه.', 'warn') : '') + (s.rx.some(r => (Store.get('medicines', r.medicine_id) || {}).is_controlled) ? note('نسخه شامل دوای مخدر است؛ قابل تجدید آنلاین نیست.', 'warn') : ''); };
  const rxList = s => s.rx.map((r, i) => `<div class="rxrow"><div class="f"><span class="lb">دوا</span><b style="direction:ltr;text-align:end;font-weight:600;padding:8px 0">${esc(medName(r.medicine_id))}</b></div>
      <div class="f"><span class="lb">دوز</span><input class="in" data-rx="${i}" data-k="dosage" value="${esc(r.dosage)}"></div><div class="f"><span class="lb">تکرار</span><input class="in" data-rx="${i}" data-k="frequency" value="${esc(r.frequency)}"></div>
      <div class="f"><span class="lb">روز</span><input class="in" data-rx="${i}" data-k="duration_days" inputmode="numeric" value="${esc(r.duration_days ?? '')}"></div><div class="f"><span class="lb">تعداد</span><input class="in" data-rx="${i}" data-k="quantity" inputmode="numeric" value="${esc(r.quantity ?? '')}"></div>
      <button class="ib" data-act="rx-rm" data-i="${i}" aria-label="حذف دوا">${I.trash}</button></div>`).join('');
  const medRes = s => { const q = normKey(s.mq); if (!q) return ''; const r = Store.all('medicines').filter(m => normKey(m.generic_name + ' ' + (m.brand_names || []).join(' ') + ' ' + m.drug_class).includes(q)).slice(0, 8); return `<div class="res">${r.map(m => `<button data-act="rx-add" data-id="${m.id}"><span style="direction:ltr">${esc(m.generic_name)}</span><span class="faint mono">${esc((m.strengths || [])[0] || '')}</span></button>`).join('') || '<div class="faint" style="padding:8px 10px">دوایی پیدا نشد.</div>'}</div>`; };
  const dxRes = s => { const q = normKey(s.dxq); if (!q) return ''; const r = ICD.filter(([c, n]) => normKey(c + ' ' + n).includes(q)).slice(0, 8); return `<div class="res">${r.map(([c, n]) => `<button data-act="dx-add" data-c="${c}" data-n="${esc(n)}"><span>${esc(n)}</span><span class="mono faint">${c}</span></button>`).join('')}${s.dxq.length > 2 ? `<button data-act="dx-add" data-c="" data-n="${esc(s.dxq)}"><span>افزودن «${esc(s.dxq)}» بدون کد</span></button>` : ''}</div>`; };
  openModal({
    title: 'ویزیت: ' + esc(patName(p)), sub: `${mono(p.mrn)} · ${ageText(u.date_of_birth)} · ${L.gender[u.gender] || ''} · ${esc(docName(Store.get('doctors', a.doctor_id)))}`, wide: true, state: st, saveLabel: 'ثبت و پایان ویزیت',
    parts: { fuh: s => dateHint(s.fu), vit: vitalsPart, rxw: rxWarn, rxl: rxList, mres: medRes, dxres: dxRes, dxl: s => s.dx.map((d, i) => `<span class="chip">${d.code ? mono(d.code) + '&nbsp;' : ''}${esc(d.name)}<select data-dx="${i}" style="border:0;background:transparent;font-size:12px">${Object.entries(L.dxType).map(([k, v]) => opt(k, v, d.type)).join('')}</select><button data-act="dx-rm" data-i="${i}" aria-label="حذف">${I.x.replace('<svg', '<svg width="14" height="14"')}</button></span>`).join('') },
    view: s => `${(p.allergies || []).length ? `<div class="allergy" style="margin-bottom:16px">${I.alert}<div><b>حساسیت:</b> ${p.allergies.map(x => esc(x.drug)).join('، ')}</div></div>` : ''}
      <fieldset class="fs"><legend>علائم حیاتی</legend><div class="grid-f" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">
        ${[['bp_systolic', 'سیستولیک mmHg'], ['bp_diastolic', 'دیاستولیک mmHg'], ['pulse_rate', 'نبض /دقیقه'], ['respiratory_rate', 'تنفس /دقیقه'], ['temperature', 'حرارت °C'], ['oxygen_sat', 'SpO₂ ٪'], ['weight_kg', 'وزن kg'], ['height_cm', 'قد cm'], ['blood_glucose', 'قند mg/dL'], ...(adult ? [] : [['muac_cm', 'MUAC cm']])].map(([k, l]) => field(l, `<input class="in" id="v-${k}" data-vit="${k}" inputmode="decimal" value="${esc(s.v[k] ?? '')}">`, { for: 'v-' + k })).join('')}
      </div><div data-part="vit">${vitalsPart(s)}</div></fieldset>
      <fieldset class="fs"><legend>شرح حال و معاینه</legend><div class="grid-f">${field('شکایت اصلی', txt('cc', s.cc), { req: 1, for: 'f-cc' })}${field('معاینه فزیکی', txt('exam', s.exam), { for: 'f-exam' })}${field('ارزیابی', txt('assess', s.assess), { for: 'f-assess' })}${field('طرح درمان', txt('plan', s.plan), { for: 'f-plan' })}</div></fieldset>
      <fieldset class="fs"><legend>تشخیص (ICD-10)</legend><div class="f ac"><input class="in" id="f-dxq" data-bind="dxq" data-parts="dxres" placeholder="جستجو با نام دری یا کد، مثلاً «سینه‌بغل» یا J18" value="${esc(s.dxq)}" autocomplete="off"><div data-part="dxres">${dxRes(s)}</div></div><div class="chips" data-part="dxl" style="margin-top:8px">${M ? M.parts.dxl(s) : ''}</div></fieldset>
      <fieldset class="fs"><legend>نسخه الکترونیک</legend><div class="f ac"><input class="in" id="f-mq" data-bind="mq" data-parts="mres" placeholder="نام دوا (Generic، تجارتی یا گروه)…" value="${esc(s.mq)}" autocomplete="off" dir="ltr"><div data-part="mres">${medRes(s)}</div></div>
        <div class="stack" style="gap:8px;margin-top:10px"><div data-part="rxw" class="stack" style="gap:8px">${rxWarn(s)}</div><div data-part="rxl" class="stack" style="gap:8px">${rxList(s)}</div></div>
        <div class="grid-f" style="margin-top:10px">${field('دواخانه انتخابی بیمار', sel('pharmacy', s.pharmacy, Store.all('pharmacies').map(x => [x.id, x.name]), { blank: 'بعداً انتخاب شود' }), { for: 'f-pharmacy' })}</div></fieldset>
      <fieldset class="fs"><legend>درخواست آزمایش</legend><div class="testgrid">${Store.all('lab_tests').map(t => `<label class="chk"><input type="checkbox" data-test="${t.id}" ${s.tests[t.id] ? 'checked' : ''}>${esc(t.name)} <span class="mono faint">${t.code}</span></label>`).join('')}</div>
        <div class="grid-f" style="margin-top:12px">${field('لابراتوار', sel('lab', s.lab, Store.all('laboratories').map(l => [l.id, l.name]), { blank: false }), { for: 'f-lab' })}${field('اولویت', sel('lab_pri', s.lab_pri, Object.entries(L.labPriority).map(([k, v]) => [k, v[0]]), { blank: false }), { for: 'f-lab_pri' })}</div></fieldset>
      <fieldset class="fs"><legend>پیگیری</legend><div class="grid-f">${field('تاریخ ویزیت بعدی', inp('fu', s.fu, { type: 'date', parts: 'fuh' }), { for: 'f-fu' }).replace('</div>', `<span class="hint" data-part="fuh">${dateHint(s.fu)}</span></div>`)}</div></fieldset>`,
    save: s => {
      need(s.cc, 'شکایت اصلی');
      if (!s.dx.length) throw new DbErr('حداقل یک تشخیص ثبت کنید.');
      for (const r of s.rx) { if (!(Number(toLatin(r.quantity)) > 0)) throw new DbErr(`تعداد ${medName(r.medicine_id)} را وارد کنید.`); }
      const vit = {}; let anyV = false; for (const [k, v] of Object.entries(s.v)) { if (v !== '' && v != null) { const n = Number(toLatin(v).replace('٫', '.')); if (isNaN(n)) throw new DbErr('مقدار علائم حیاتی باید عدد باشد.'); vit[k] = n; anyV = true; } }
      const tests = Object.keys(s.tests).filter(k => s.tests[k]);
      const actor = actorUser(); const ts = nowISO();
      Store.tx(() => {
        const rec = Store.insert('medical_records', { patient_id: p.id, doctor_id: a.doctor_id, appointment_id: a.id, hospital_id: a.hospital_id, visit_date: ts, visit_type: a.type.startsWith('telemedicine') ? 'telemedicine' : 'outpatient', chief_complaint: s.cc, history: null, physical_exam: s.exam || null, assessment: s.assess || null, treatment_plan: s.plan || null, follow_up: null, follow_up_date: s.fu || null, doctor_signature: 'signed', is_confidential: false });
        if (anyV) { const vs = Store.insert('vital_signs', Object.assign({ patient_id: p.id, record_id: rec.id, recorded_by: actor, recorded_at: ts, bmi: bmiOf(vit.weight_kg, vit.height_cm) }, vit));
          const n = adult ? news2(vs) : null;
          if (n && n.score >= 5) Store.insert('clinical_alerts', { alert_type: 'critical_vitals', patient_id: p.id, doctor_id: a.doctor_id, record_id: rec.id, priority: n.score >= 7 ? 'critical' : 'warning', message: `NEWS2 = ${fa(n.score)} — ${NEWS_L[n.level][0]}`, is_acknowledged: false });
          if (vit.bp_systolic >= 180 || vit.bp_diastolic >= 110) Store.insert('clinical_alerts', { alert_type: 'critical_vitals', patient_id: p.id, doctor_id: a.doctor_id, record_id: rec.id, priority: 'critical', message: `فشار خون ${fa(vit.bp_systolic + '/' + vit.bp_diastolic)} — پروتکل بحران فشار خون`, is_acknowledged: false });
          if (vit.muac_cm && muacClass(vit.muac_cm) === 'SAM') Store.insert('clinical_alerts', { alert_type: 'malnutrition', patient_id: p.id, doctor_id: a.doctor_id, record_id: rec.id, priority: 'critical', message: `MUAC = ${nf(vit.muac_cm, 1)} سانتی‌متر — سوء تغذیه حاد شدید (SAM)`, is_acknowledged: false });
        }
        s.dx.forEach((d, i) => Store.insert('diagnoses', { record_id: rec.id, icd_code: d.code || null, icd_description: d.name, diagnosis_name: d.name, type: d.type || (i ? 'secondary' : 'primary'), severity: null, notes: null }));
        if (s.rx.length) {
          const controlled = s.rx.some(r => (Store.get('medicines', r.medicine_id) || {}).is_controlled);
          const rx = Store.insert('prescriptions', { prescription_no: genNo('RX', 'prescriptions', 'prescription_no'), record_id: rec.id, doctor_id: a.doctor_id, patient_id: p.id, prescription_date: TODAY(), pharmacy_id: s.pharmacy || null, status: 'pending', notes: null, valid_until: addDays(TODAY(), 30), is_controlled: controlled, dispensed_at: null, dispensed_by: null });
          for (const r of s.rx) { Store.insert('prescription_items', { prescription_id: rx.id, medicine_id: r.medicine_id, dosage: r.dosage || null, frequency: r.frequency || null, duration_days: numOrNull(toLatin(r.duration_days)), route: r.route || 'oral', instructions: null, quantity: Number(toLatin(r.quantity)), is_dispensed: false });
            for (const al of allergyHits(p, r.medicine_id)) Store.insert('clinical_alerts', { alert_type: 'drug_allergy', patient_id: p.id, doctor_id: a.doctor_id, record_id: rec.id, priority: 'critical', message: `${medName(r.medicine_id)} با وجود حساسیت ثبت‌شده به ${al.drug} تجویز شد`, is_acknowledged: false }); }
        }
        if (tests.length) {
          const o = Store.insert('lab_orders', { order_no: genNo('LAB', 'lab_orders', 'order_no'), patient_id: p.id, doctor_id: a.doctor_id, record_id: rec.id, laboratory_id: need(s.lab, 'لابراتوار'), order_date: ts, priority: s.lab_pri, status: 'ordered', clinical_notes: s.assess || null, sample_collected_at: null, resulted_at: null, reviewed_by: null });
          for (const tid of tests) Store.insert('lab_results', { order_id: o.id, test_id: tid, result_value: null, result_unit: (Store.get('lab_tests', tid) || {}).unit, normal_range: null, flag: null, result_date: null, performed_by: null, notes: null, is_abnormal: false });
        }
        Store.update('appointments', a.id, { status: 'completed' });
      });
      return 'ویزیت ثبت شد' + (s.rx.length ? '، نسخه به دواخانه ارسال شد' : '') + (tests.length ? ' و درخواست آزمایش ثبت شد.' : '.');
    },
  });
}
