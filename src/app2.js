/* ================= state & shell ================= */
const S = { view: 'dashboard', param: null, role: 'admin', f: {}, tab: {}, day: null, mode: 'connecting', gq: '' };
try { const s = JSON.parse(localStorage.getItem('hdhs.ui') || '{}'); if (s.role && ROLE_UI[s.role]) S.role = s.role; } catch (_) {}
const saveUI = () => { try { localStorage.setItem('hdhs.ui', JSON.stringify({ role: S.role })); } catch (_) {} };

const NAV = [
  ['dashboard', 'داشبورد', I.dash, 'نمای کلی'],
  ['patients', 'بیماران', I.users, 'خدمات کلینیکی'], ['appointments', 'نوبت‌ها', I.cal, 'خدمات کلینیکی'], ['doctors', 'داکتران', I.steth, 'خدمات کلینیکی'], ['hospitals', 'شفاخانه‌ها', I.hosp, 'خدمات کلینیکی'],
  ['pharmacy', 'دواخانه', I.pill, 'تشخیص و دوا'], ['lab', 'لابراتوار', I.flask, 'تشخیص و دوا'],
  ['mch', 'مادر و طفل', I.baby, 'صحت عامه'], ['surveillance', 'نظارت بیماری‌ها', I.pulse, 'صحت عامه'], ['emergency', 'عاجل و بانک خون', I.siren, 'صحت عامه'],
  ['system', 'داده و تغییرات', I.db, 'سیستم'],
];
const PARENT = { patient: 'patients', hospital: 'hospitals' };

function renderShell() {
  document.getElementById('root').innerHTML = `
  <div class="app">
    <aside class="side" id="side" aria-label="ناوبری اصلی">
      <div class="brand"><span class="word">صحت هرات</span><span class="sub"><b>HDHS</b> سیستم دیجیتال صحی هرات</span></div>
      <nav class="nav" id="nav"></nav>
      <div class="side-foot"><div class="sync" id="sync" data-s="busy"><i></i><span>در حال اتصال…</span></div><span>داده‌های بیماران برای آزمایش سیستم، نمونه هستند.</span></div>
    </aside>
    <div class="main-wrap">
      <header class="top">
        <button class="ib menu" data-act="menu" aria-label="باز کردن فهرست">${I.menu}</button>
        <div class="date"><b id="today"></b><span id="today2"></span></div>
        <div class="gsearch" id="gs"><input id="gq" type="search" placeholder="جستجوی بیمار: نام، MRN، تذکره یا شماره تماس" aria-label="جستجوی بیمار" autocomplete="off">${I.search}<div class="res" id="gres" hidden></div></div>
        <button class="ib srch-btn" data-act="gsearch" aria-label="جستجو" style="display:none">${I.search}</button>
        <select class="role" id="role" aria-label="نقش کاربر">${Object.entries(ROLE_UI).map(([k, r]) => opt(k, r.label, S.role)).join('')}</select>
      </header>
      <main id="main" tabindex="-1"></main>
    </div>
  </div>
  <nav class="bottom" id="bottom" aria-label="ناوبری سریع"></nav>
  <div class="toasts" id="toasts" aria-live="polite"></div><div class="tip" id="tip" role="tooltip"></div>`;
  document.documentElement.style.setProperty('--girih', GIRIH);
  const t = TODAY(); document.getElementById('today').textContent = fmtDate(t, true);
  document.getElementById('today2').textContent = fa(t.split('-').reverse().join('/')) + ' میلادی';
}
function navCounts() {
  const t = TODAY();
  return {
    appointments: Store.by('appointments', 'appointment_date', t).filter(a => ['pending', 'confirmed', 'checked_in', 'in_progress'].includes(a.status)).length,
    pharmacy: Store.by('prescriptions', 'status', 'pending').length + Store.by('prescriptions', 'status', 'partially_dispensed').length,
    lab: ['ordered', 'sample_collected', 'processing'].reduce((n, s) => n + Store.countBy('lab_orders', 'status', s), 0),
    emergency: Store.all('emergency_calls').filter(c => ['received', 'dispatched', 'arrived', 'transported'].includes(c.status)).length,
    surveillance: Store.all('epidemic_alerts').filter(a => !a.is_resolved).length,
  };
}
function renderNav() {
  const c = navCounts(); const cur = PARENT[S.view] || S.view; let grp = '', h = '';
  for (const [k, l, ic, g] of NAV) {
    if (!canView(k) && !(k === 'system' && S.role === 'admin')) continue;
    if (g !== grp) { h += `<div class="grp">${g}</div>`; grp = g; }
    const hot = (k === 'emergency' || k === 'surveillance') && c[k];
    h += `<button data-act="go" data-v="${k}" ${cur === k ? 'aria-current="page"' : ''}>${ic}<span>${l}</span>${c[k] ? `<span class="cnt ${hot ? 'hot' : ''}">${fa(c[k])}</span>` : ''}</button>`;
  }
  document.getElementById('nav').innerHTML = h;
  const quick = ['dashboard', 'patients', 'appointments', S.role === 'pharmacist' ? 'pharmacy' : S.role === 'lab_tech' ? 'lab' : 'emergency'].filter(canView);
  document.getElementById('bottom').innerHTML = quick.map(k => { const n = NAV.find(x => x[0] === k); return `<button data-act="go" data-v="${k}" ${cur === k ? 'aria-current="page"' : ''}>${n[2]}<span>${{ emergency: 'عاجل', surveillance: 'نظارت' }[k] || n[1]}</span></button>`; }).join('') + `<button data-act="menu">${I.menu}<span>بیشتر</span></button>`;
  const sy = document.getElementById('sync'); const st = Sync.state;
  sy.dataset.s = st === 'local' ? 'err' : st === 'device' ? 'ok' : st;
  sy.querySelector('span').textContent = st === 'ok' ? 'همگام — ذخیره در پایگاه داده' : st === 'busy' ? `در حال ذخیره (${fa(Sync.pending())})` : st === 'device' ? 'ذخیره روی همین دستگاه (آفلاین)' : st === 'local' ? 'حالت محلی — تغییرات ذخیره نمی‌شود' : st === 'err' ? 'خطا در ذخیره؛ تلاش دوباره' : 'در حال اتصال…';
}
function go(v, param = null) {
  if (!canView(PARENT[v] || v) && !(v === 'system' && S.role === 'admin')) v = 'dashboard';
  S.view = v; S.param = param; closeSide();
  renderMain(true); renderNav();
}
let rmQueued = false;
function scheduleRender() { if (rmQueued) return; rmQueued = true; requestAnimationFrame(() => { rmQueued = false; renderMain(false); renderNav(); }); }
function renderMain(top) {
  const main = document.getElementById('main'); if (!main) return;
  const ae = document.activeElement; const fid = ae && main.contains(ae) ? ae.id : null; const ss = fid && ae.selectionStart;
  let html;
  if (S.mode === 'connecting') html = `<div class="loading"><div><span class="word">صحت هرات</span><div>در حال بارگذاری پایگاه داده…</div></div></div>`;
  else { try { html = (VIEWS[S.view] || VIEWS.dashboard)(S.param); } catch (e) { console.error(e); html = note('خطا در نمایش این صفحه: ' + esc(e.message), 'crit'); } }
  main.innerHTML = html;
  if (fid) { const el = document.getElementById(fid); if (el) { el.focus(); try { el.setSelectionRange(ss, ss); } catch (_) {} } }
  if (top) { window.scrollTo(0, 0); }
}
const ph = (eyebrow, title, desc, acts = '') => `<div class="ph"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div>${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
const tabs = (key, list, def) => { const cur = S.tab[key] || def; return `<div class="tabs" role="tablist">${list.map(([k, l, c]) => `<button role="tab" aria-selected="${cur === k}" data-act="tab" data-k="${key}" data-v="${k}">${l}${c != null ? `<span class="c">${fa(c)}</span>` : ''}</button>`).join('')}</div>`; };
const tabOf = (key, def) => S.tab[key] || def;
const fsel = (key, val, options, blank) => `<select class="in" id="flt-${key}" data-f="${key}">${opt('', blank, val)}${options.map(([v, l]) => opt(v, l, val)).join('')}</select>`;
const fsearch = (key, ph) => `<div class="search">${I.search}<input class="in" id="flt-${key}" data-f="${key}" value="${esc(S.f[key] || '')}" placeholder="${esc(ph)}" autocomplete="off"></div>`;
const statusOrder = { in_progress: 0, checked_in: 1, confirmed: 2, pending: 3, completed: 4, no_show: 5, cancelled: 6 };
const prioOrder = { emergency: 0, urgent: 1, normal: 2 };
const byQueue = (a, b) => (statusOrder[a.status] - statusOrder[b.status]) || (prioOrder[a.priority] - prioOrder[b.priority]) || (a.appointment_time < b.appointment_time ? -1 : 1);
const hospOpts = () => Store.all('hospitals').map(h => [h.id, h.name]);
const specOpts = () => Store.all('specializations').map(s => [s.id, s.name]);
const districtOpts = () => DISTRICTS.map(d => [d[0], d[0]]);

/* ================= views ================= */
const VIEWS = {};

VIEWS.dashboard = () => {
  const t = TODAY();
  const appts = Store.by('appointments', 'appointment_date', t).filter(a => a.status !== 'cancelled');
  const done = appts.filter(a => a.status === 'completed').length;
  const pats = Store.all('patients'); const newWeek = pats.filter(p => p.registered_at && diffDays(t, p.registered_at.slice(0, 10)) <= 30).length;
  const beds = Store.all('bed_management'); const occ = beds.filter(b => b.status === 'occupied').length; const occPct = beds.length ? Math.round(occ / beds.length * 100) : 0;
  const cal = Store.all('clinical_alerts').filter(a => !a.is_acknowledged).sort((a, b) => (a.priority === 'critical' ? -1 : 1) - (b.priority === 'critical' ? -1 : 1));
  const epi = Store.all('epidemic_alerts').filter(a => !a.is_resolved);
  const days = []; for (let i = -6; i <= 7; i++) { const d = addDays(t, i); const n = Store.by('appointments', 'appointment_date', d).filter(a => a.status !== 'cancelled').length; days.push({ label: fa(jal(d).d), v: n, hl: i === 0, dim: i > 0, tip: `${fmtDate(d, true)}\n${fa(n)} نوبت` }); }
  const queue = appts.filter(a => ['checked_in', 'in_progress', 'confirmed'].includes(a.status)).sort(byQueue).slice(0, 7);
  const blood = {}; for (const b of Store.all('blood_bank')) blood[b.blood_type] = (blood[b.blood_type] || 0) + (b.units_available || 0);
  const sv = survData();
  const top = sv.diseases.slice(0, 4);
  const colors = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)'];
  return `
  <div class="banner">${I.info}<span>بیماران و سوابق کلینیکی در این نسخه، داده نمونه برای آزمایش سیستم هستند. شفاخانه‌ها و داکتران از سند HDHS گرفته شده‌اند.</span></div>
  ${ph('نمای کلی · ' + fmtDate(t, true), 'داشبورد صحت هرات', 'خلاصه زنده از فعالیت شفاخانه‌ها، داکتران و خدمات صحت عامه ولایت هرات.',
    (can('appt') ? `<button class="btn pri" data-act="book">${I.plus}نوبت جدید</button>` : '') + (can('patient') ? `<button class="btn" data-act="patient-new">${I.user}ثبت بیمار</button>` : ''))}
  <div class="kpis">
    <div class="card kpi"><div class="l">${I.users}بیماران ثبت‌شده</div><div class="v num">${nf(pats.length)}</div><div class="s">${fa(newWeek)} ثبت جدید در ۳۰ روز گذشته</div></div>
    <div class="card kpi"><div class="l">${I.cal}نوبت‌های امروز</div><div class="v num">${nf(appts.length)}</div><div class="s">${fa(done)} تکمیل‌شده · ${fa(appts.filter(a => a.status === 'checked_in').length)} در صف</div><div class="bar"><i style="width:${appts.length ? done / appts.length * 100 : 0}%"></i></div></div>
    <div class="card kpi"><div class="l">${I.bed}اشغال تخت‌ها</div><div class="v num">${fa(occPct)}<small>٪</small></div><div class="s">${fa(occ)} از ${fa(beds.length)} تخت ثبت‌شده</div><div class="bar"><i style="width:${occPct}%;background:${occPct > 85 ? 'var(--crit)' : 'var(--accent)'}"></i></div></div>
    <div class="card kpi ${cal.length + epi.length ? 'alert' : ''}"><div class="l">${I.alert}هشدارهای باز</div><div class="v num">${fa(cal.length + epi.length)}</div><div class="s">${fa(cal.length)} کلینیکی · ${fa(epi.length)} اپیدمی</div></div>
  </div>
  <div class="g g-21" style="margin-bottom:18px">
    <div class="card"><div class="card-h"><h3>نوبت‌ها <small>۷ روز گذشته و ۷ روز آینده · روز ماه شمسی</small></h3><button class="btn sm ghost" data-act="go" data-v="appointments">همه نوبت‌ها</button></div>
      <div class="card-b">${barChart(days, { h: 210, aria: 'تعداد نوبت‌ها در ۱۴ روز' })}</div></div>
    <div class="card"><div class="card-h"><h3>صف امروز</h3><span class="pill acc"><i></i>${fa(queue.length)} نفر</span></div>
      <div class="lst">${queue.length ? queue.map(a => { const p = Store.get('patients', a.patient_id), d = Store.get('doctors', a.doctor_id); return `<div class="li click" data-act="open-patient" data-id="${a.patient_id}"><span class="time">${fmtTime(a.appointment_time)}</span><div class="grow">${who(patName(p), esc(docName(d)))}</div>${a.priority !== 'normal' ? pill(L.priority, a.priority) : ''}${pill(L.appt, a.status)}</div>`; }).join('') : empty('صف امروز خالی است.')}</div></div>
  </div>
  <div class="g g3">
    <div class="card"><div class="card-h"><h3>${I.shield}هشدارهای کلینیکی</h3><small class="faint">CDSS</small></div>
      <div class="lst">${cal.length ? cal.slice(0, 5).map(a => `<div class="li"><div class="grow"><div class="row" style="gap:6px;margin-bottom:2px">${pill({ critical: ['بحرانی', 'crit'], warning: ['هشدار', 'warn'], info: ['اطلاع', 'info'] }, a.priority)}<b style="font-size:13px;cursor:pointer" data-act="open-patient" data-id="${a.patient_id}">${esc(patName(Store.get('patients', a.patient_id)))}</b></div><div class="muted" style="font-size:13px">${esc(a.message)}</div></div>${can('alert.ack') ? `<button class="btn sm" data-act="ack" data-id="${a.id}">بررسی شد</button>` : ''}</div>`).join('') : empty('هشدار بازی وجود ندارد.', I.check)}</div></div>
    <div class="card"><div class="card-h"><h3>${I.drop}ذخیره بانک خون</h3><button class="btn sm ghost" data-act="go" data-v="emergency">جزئیات</button></div>
      <div class="card-b"><div class="bgrid" style="grid-template-columns:repeat(4,minmax(0,1fr))">${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(k => { const u = blood[k] || 0; return `<div class="bcell ${u === 0 ? 'out' : u < 5 ? 'low' : ''}"><div class="ty">${k}</div><div class="u num">${fa(u)}</div></div>`; }).join('')}</div><p class="faint" style="font-size:12px;margin-top:10px">مجموع واحدهای خون کامل در ${fa(new Set(Store.all('blood_bank').map(b => b.hospital_id)).size)} شفاخانه · کمتر از ۵ واحد = کمبود</p></div></div>
    <div class="card"><div class="card-h"><h3>${I.pulse}روند بیماری‌های اولویت‌دار</h3><button class="btn sm ghost" data-act="go" data-v="surveillance">نظارت</button></div>
      <div class="card-b">${top.length ? lineChart(top.map((d, i) => ({ name: d, short: '', color: colors[i], values: sv.weeks.map(w => sv.sum[d][w] || 0) })), sv.weeks.map(w => 'هفته ' + fa(w)), { h: 190, w: 420, endLabels: false, aria: 'روند هفتگی موارد جدید' }) + `<div class="legend" style="margin-top:8px">${top.map((d, i) => `<span><i style="background:${colors[i]}"></i>${esc(d)}</span>`).join('')}</div>` : empty('گزارشی ثبت نشده.')}
      ${epi.map(a => note(`<b>${esc(a.disease_name)}</b> — ${esc(a.district || '')}: ${esc(a.description || '')}`, 'crit')).join('')}</div></div>
  </div>`;
};

/* ---------- patients ---------- */
function patientMatches(p, q) {
  if (!q) return true; const u = patUser(p) || {};
  return normKey(`${u.first_name} ${u.last_name} ${p.mrn} ${u.national_id || ''} ${u.phone || ''} ${u.first_name_en || ''}`).includes(q);
}
const lastVisit = p => { let m = null; for (const r of Store.by('medical_records', 'patient_id', p.id)) if (!m || r.visit_date > m) m = r.visit_date; return m; };
VIEWS.patients = () => {
  const q = normKey(S.f.pq || ''); const f = S.f;
  let rows = Store.all('patients').filter(p => patientMatches(p, q) && (!f.pdist || p.district === f.pdist) && (!f.pgen || (patUser(p) || {}).gender === f.pgen) &&
    (!f.pflag || (f.pflag === 'allergy' ? (p.allergies || []).length : f.pflag === 'chronic' ? (p.chronic_conditions || []).length : f.pflag === 'child' ? isChild(p) : true)));
  rows.sort((a, b) => (b.registered_at || '').localeCompare(a.registered_at || ''));
  const total = rows.length; rows = rows.slice(0, 200);
  return `${ph('خدمات کلینیکی', 'بیماران', 'پرونده صحی مادام‌العمر هر شهروند با نمبر پرونده یکتا (MRN)، تذکره و سوابق کامل.', can('patient') ? `<button class="btn pri" data-act="patient-new">${I.plus}ثبت بیمار جدید</button>` : '')}
  <div class="fbar">${fsearch('pq', 'جستجو با نام، MRN، تذکره یا شماره تماس')}
    ${fsel('pdist', f.pdist, districtOpts(), 'همه ولسوالی‌ها')}${fsel('pgen', f.pgen, [['male', 'مرد'], ['female', 'زن']], 'همه')}${fsel('pflag', f.pflag, [['allergy', 'دارای حساسیت'], ['chronic', 'بیماری مزمن'], ['child', 'اطفال زیر ۵ سال']], 'بدون فیلتر')}</div>
  <div class="card"><div class="card-h"><h3>فهرست بیماران <small>${fa(total)} نفر${total > 200 ? ' · ۲۰۰ مورد اول' : ''}</small></h3></div>
  ${rows.length ? `<div class="tw"><table class="t cards"><thead><tr><th>بیمار</th><th>تذکره</th><th>سن و جنس</th><th>ولسوالی</th><th>گروه خون</th><th>هشدار</th><th>آخرین ویزیت</th></tr></thead><tbody>
  ${rows.map(p => { const u = patUser(p) || {}; const lv = lastVisit(p); return `<tr class="click" data-act="open-patient" data-id="${p.id}">
    <td>${who(fullName(u), mono(p.mrn), u.gender === 'female' ? 'b' : '')}</td><td class="hide-m">${u.national_id ? mono(u.national_id) : '<span class="faint">—</span>'}</td>
    <td data-h="سن">${ageText(u.date_of_birth)} · ${L.gender[u.gender] || '—'}</td><td data-h="ولسوالی">${esc(p.district || '—')}</td><td>${bt(u.blood_type)}</td>
    <td>${(p.allergies || []).length ? `<span class="pill crit"><i></i>حساسیت</span>` : ''} ${(p.chronic_conditions || []).length ? `<span class="pill line">${fa((p.chronic_conditions || []).length)} مزمن</span>` : ''}</td>
    <td class="hide-m">${lv ? fmtShort(lv) : '<span class="faint">—</span>'}</td></tr>`; }).join('')}</tbody></table></div>` : empty('بیماری با این مشخصات پیدا نشد.', I.search)}</div>`;
};

VIEWS.patient = (id) => {
  const p = Store.get('patients', id);
  if (!p) return `${ph('بیماران', 'بیمار پیدا نشد', 'این پرونده حذف شده یا وجود ندارد.')}<button class="btn" data-act="go" data-v="patients">بازگشت به فهرست</button>`;
  const u = patUser(p) || {};
  const recs = Store.by('medical_records', 'patient_id', id).sort((a, b) => b.visit_date.localeCompare(a.visit_date));
  const vit = Store.by('vital_signs', 'patient_id', id).sort((a, b) => (a.recorded_at || '').localeCompare(b.recorded_at || ''));
  const lastV = vit[vit.length - 1]; const adult = (ageYears(u.date_of_birth) ?? 20) >= 16; const nw = lastV && adult ? news2(lastV) : null;
  const rxs = Store.by('prescriptions', 'patient_id', id).sort((a, b) => b.prescription_date.localeCompare(a.prescription_date));
  const labs = Store.by('lab_orders', 'patient_id', id).sort((a, b) => (b.order_date || '').localeCompare(a.order_date || ''));
  const vacs = Store.by('vaccinations', 'patient_id', id);
  const appts = Store.by('appointments', 'patient_id', id).sort((a, b) => (b.appointment_date + b.appointment_time).localeCompare(a.appointment_date + a.appointment_time));
  const pays = Store.by('payments', 'patient_id', id);
  const preg = Store.by('maternal_health', 'patient_id', id).find(m => m.status === 'active');
  const bedR = Store.by('bed_management', 'patient_id', id)[0];
  const child = Store.by('child_health', 'patient_id', id)[0];
  const alerts = Store.by('clinical_alerts', 'patient_id', id).filter(a => !a.is_acknowledged);
  const tab = tabOf('patient', 'overview');
  const showVac = isChild(p) || vacs.length;
  let body = '';
  if (tab === 'overview') {
    body = `<div class="g g-21"><div class="card"><div class="card-h"><h3>سیر ویزیت‌ها</h3><small class="faint">${fa(recs.length)} پرونده</small></div><div class="card-b">${recs.length ? `<div class="tl">${recs.map(r => { const dx = Store.by('diagnoses', 'record_id', r.id); const d = Store.get('doctors', r.doctor_id); return `<div class="it"><div class="d">${fmtDate(r.visit_date, true)} · ${fmtTime(r.visit_date.slice(11, 16))} · ${esc(hospName(r.hospital_id))}</div><h4>${esc(r.chief_complaint || 'ویزیت')}</h4><div class="muted" style="font-size:13px">${esc(docName(d))} — ${esc(docSpec(d))}</div>
      ${dx.length ? `<div class="chips" style="margin-top:6px">${dx.map(x => `<span class="tag">${x.icd_code ? mono(x.icd_code) + '&nbsp;' : ''}${esc(x.diagnosis_name)} · ${L.dxType[x.type] || ''}</span>`).join('')}</div>` : ''}
      ${r.treatment_plan ? `<p style="font-size:13px;margin-top:6px"><span class="faint">طرح درمان: </span>${esc(r.treatment_plan)}</p>` : ''}${r.follow_up_date ? `<p class="faint" style="font-size:12px">پیگیری: ${fmtDate(r.follow_up_date)}</p>` : ''}</div>`; }).join('')}</div>` : empty('هنوز ویزیتی ثبت نشده است.')}</div></div>
      <div class="stack">
        <div class="card"><div class="card-h"><h3>مشخصات</h3></div><div class="card-b"><dl class="kv">
          <dt>نمبر تذکره</dt><dd>${u.national_id ? mono(u.national_id) : '—'}</dd><dt>شماره تماس</dt><dd>${u.phone ? mono(u.phone) : '—'}</dd>
          <dt>تاریخ تولد</dt><dd>${u.date_of_birth ? fmtDate(u.date_of_birth) : '—'}</dd><dt>حالت مدنی</dt><dd>${L.marital[p.marital_status] || '—'}</dd>
          <dt>آدرس</dt><dd>${esc([p.village, p.district, p.province].filter(Boolean).join('، ') || '—')}</dd>
          <dt>تماس اضطراری</dt><dd>${p.emergency_contact ? esc(p.emergency_contact) + (p.emergency_relation ? ` (${esc(p.emergency_relation)})` : '') + (p.emergency_phone ? ' · ' + mono(p.emergency_phone) : '') : '—'}</dd>
          <dt>ثبت در سیستم</dt><dd>${p.registered_at ? fmtDate(p.registered_at) : '—'}</dd></dl></div></div>
        ${preg ? `<div class="card"><div class="card-h"><h3>${I.heart}حاملگی فعال</h3>${pill(L.risk, preg.risk_level)}</div><div class="card-b"><div class="stat-row"><div class="stat"><span class="v num">${fa(gaWeeks(preg.lmp_date))}</span><span class="l">هفته حاملگی</span></div><div class="stat"><span class="v">${fmtDM(preg.edd_date || eddOf(preg.lmp_date))}</span><span class="l">تاریخ تخمینی ولادت</span></div><div class="stat"><span class="v num">${fa(Store.countBy('anc_visits', 'maternal_id', preg.id))}</span><span class="l">ویزیت ANC</span></div></div></div></div>` : ''}
        ${child ? childCard(p, child) : ''}
        ${bedR ? note(`بستری در <b>${esc(hospName(bedR.hospital_id))}</b> · تخت ${mono(bedR.bed_number)} از ${fmtDate(bedR.admitted_at)}`, 'info', I.bed) : ''}
        <div class="card"><div class="card-h"><h3>${I.db}رابطه‌های این پرونده</h3></div><div class="card-b"><div class="chips">${Store.dependents('patients', id).map(d => `<span class="tag">${esc(SCHEMA[d.table].label)}: ${fa(d.n)}</span>`).join('') || '<span class="faint">بدون رکورد وابسته</span>'}</div><p class="faint" style="font-size:12px;margin-top:8px">حذف بیمار تا زمانی که رکورد وابسته دارد، توسط پایگاه داده مسدود می‌شود.</p></div></div>
      </div></div>`;
  } else if (tab === 'vitals') {
    const pts = vit.filter(v => v.bp_systolic);
    body = `<div class="stack">${pts.length >= 2 ? `<div class="card"><div class="card-h"><h3>روند فشار خون و نبض</h3></div><div class="card-b">${lineChart([{ name: 'سیستولیک', short: 'SYS', color: 'var(--s1)', values: pts.map(v => v.bp_systolic) }, { name: 'دیاستولیک', short: 'DIA', color: 'var(--s2)', values: pts.map(v => v.bp_diastolic) }, { name: 'نبض', short: 'HR', color: 'var(--s3)', values: pts.map(v => v.pulse_rate || 0) }], pts.map(v => fmtShort(v.recorded_at).slice(5)), { h: 220, aria: 'روند علائم حیاتی' })}<div class="legend" style="margin-top:6px"><span><i style="background:var(--s1)"></i>سیستولیک (mmHg)</span><span><i style="background:var(--s2)"></i>دیاستولیک (mmHg)</span><span><i style="background:var(--s3)"></i>نبض (در دقیقه)</span></div></div></div>` : ''}
    <div class="card"><div class="card-h"><h3>ثبت‌های علائم حیاتی</h3>${can('vitals') ? `<button class="btn sm" data-act="vitals-new" data-id="${id}">${I.plus}ثبت جدید</button>` : ''}</div>${vit.length ? `<div class="tw"><table class="t"><thead><tr><th>زمان</th><th class="n">فشار خون</th><th class="n">نبض</th><th class="n">حرارت °C</th><th class="n">تنفس</th><th class="n">SpO₂ ٪</th><th class="n">وزن kg</th><th class="n">BMI</th><th class="n">قند mg/dL</th><th class="n">MUAC cm</th><th>NEWS2</th></tr></thead><tbody>${vit.slice().reverse().map(v => { const n = adult ? news2(v) : null; return `<tr><td>${fmtDT(v.recorded_at)}</td><td class="n">${v.bp_systolic ? fa(v.bp_systolic + '/' + v.bp_diastolic) : '—'}</td><td class="n">${nf(v.pulse_rate)}</td><td class="n">${nf(v.temperature, 1)}</td><td class="n">${nf(v.respiratory_rate)}</td><td class="n">${nf(v.oxygen_sat)}</td><td class="n">${nf(v.weight_kg, 1)}</td><td class="n">${nf(v.bmi, 1)}</td><td class="n">${nf(v.blood_glucose)}</td><td class="n">${nf(v.muac_cm, 1)}</td><td>${n ? `<span class="pill ${NEWS_L[n.level][1]}">${fa(n.score)}</span>` : '—'}</td></tr>`; }).join('')}</tbody></table></div>` : empty('علائم حیاتی ثبت نشده.')}</div></div>`;
  } else if (tab === 'rx') {
    body = rxs.length ? `<div class="stack">${rxs.map(rx => rxCard(rx, false)).join('')}</div>` : `<div class="card">${empty('نسخه‌ای ثبت نشده.')}</div>`;
  } else if (tab === 'labs') {
    body = labs.length ? `<div class="stack">${labs.map(o => labCard(o)).join('')}</div>` : `<div class="card">${empty('آزمایشی درخواست نشده.')}</div>`;
  } else if (tab === 'vacc') {
    const epi = isChild(p) ? epiFor(p) : [];
    body = `<div class="stack">${epi.length ? `<div class="card"><div class="card-h"><h3>${I.syringe}کارت واکسیناسیون EPI</h3><small class="faint">تقسیم اوقات ملی افغانستان</small></div><div class="card-b"><div class="grid-f" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${epi.map(e => `<div class="note ${e.st === 'done' ? 'ok' : e.st === 'overdue' ? 'crit' : e.st === 'due' ? 'warn' : ''}" style="flex-direction:column;gap:2px"><b>${esc(e.name)}</b><span style="font-size:12px">${e.at} · ${e.done ? 'تطبیق شد ' + fmtShort(e.done.date_given) : e.st === 'overdue' ? 'معوقه از ' + fmtShort(e.due) : e.st === 'due' ? 'موعد: ' + fmtShort(e.due) : 'آینده: ' + fmtShort(e.due)}</span>${!e.done && e.st !== 'upcoming' && can('vacc') ? `<button class="btn sm" style="margin-top:6px;align-self:flex-start" data-act="vacc-give" data-id="${id}" data-code="${e.code}" data-dose="${e.dose}" data-name="${esc(e.name)}">ثبت تطبیق امروز</button>` : ''}</div>`).join('')}</div></div></div>` : ''}
      <div class="card"><div class="card-h"><h3>سوابق واکسین</h3></div>${vacs.length ? `<div class="tw"><table class="t"><thead><tr><th>واکسین</th><th>دوز</th><th>تاریخ</th><th>شفاخانه</th><th>نمبر بچ</th></tr></thead><tbody>${vacs.sort((a, b) => b.date_given.localeCompare(a.date_given)).map(v => `<tr><td>${esc(v.vaccine_name || v.vaccine_code)}</td><td class="num">${fa(v.dose_number)}</td><td>${fmtShort(v.date_given)}</td><td>${esc(hospName(v.hospital_id))}</td><td>${v.batch_number ? mono(v.batch_number) : '—'}</td></tr>`).join('')}</tbody></table></div>` : empty('واکسینی ثبت نشده.')}</div></div>`;
  } else if (tab === 'appts') {
    body = `<div class="card"><div class="lst">${appts.length ? appts.map(a => apptRow(a, { showDate: true, noPatient: true })).join('') : empty('نوبتی ثبت نشده.')}</div></div>`;
  } else if (tab === 'bill') {
    body = `<div class="card">${pays.length ? `<div class="tw"><table class="t"><thead><tr><th>نمبر</th><th>تاریخ</th><th class="n">مبلغ</th><th>روش</th><th>وضعیت</th></tr></thead><tbody>${pays.sort((a, b) => (b.payment_date || '').localeCompare(a.payment_date || '')).map(x => `<tr><td>${mono(x.payment_no)}</td><td>${fmtShort(x.payment_date)}</td><td class="n">${afn(x.amount)}</td><td>${L.pay[x.payment_method] || '—'}</td><td>${pill(L.payStatus, x.status)}</td></tr>`).join('')}</tbody></table></div>` : empty('پرداختی ثبت نشده.')}</div>`;
  }
  return `<button class="btn sm ghost" data-act="go" data-v="patients" style="margin-bottom:10px">${I.back}بیماران</button>
  <div class="card story" style="margin-bottom:16px">
    ${avatar(fullName(u), 'lg ' + (u.gender === 'female' ? 'b' : ''))}
    <div><div class="row" style="gap:10px"><h2>${esc(fullName(u))}</h2>${bt(u.blood_type)}${p.sample ? '<span class="pill brass">نمونه</span>' : ''}</div>
      <div class="meta"><span>${mono(p.mrn)}</span><span>${ageText(u.date_of_birth)} · ${L.gender[u.gender] || '—'}</span><span>${esc(p.district || '—')}</span>${lastV ? `<span>آخرین علائم: ${lastV.bp_systolic ? fa(lastV.bp_systolic + '/' + lastV.bp_diastolic) + ' mmHg' : ''} ${lastV.pulse_rate ? '· نبض ' + fa(lastV.pulse_rate) : ''}</span>` : ''}${nw ? `<span class="pill ${NEWS_L[nw.level][1]}">NEWS2: ${fa(nw.score)} · ${NEWS_L[nw.level][0]}</span>` : ''}</div>
      <div class="stack" style="gap:8px;margin-top:12px">
        ${(p.allergies || []).length ? `<div class="allergy">${I.alert}<div><b>حساسیت دارویی:</b> ${p.allergies.map(a => `${esc(a.drug)}${a.reaction ? ` (${esc(a.reaction)})` : ''}`).join('، ')}</div></div>` : ''}
        ${(p.chronic_conditions || []).length ? `<div class="chips">${p.chronic_conditions.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div>` : ''}
        ${alerts.map(a => note(esc(a.message), a.priority === 'critical' ? 'crit' : 'warn')).join('')}
      </div></div>
    <div class="acts row" style="align-self:start">
      ${can('appt') ? `<button class="btn pri sm" data-act="book" data-patient="${id}">${I.cal}نوبت</button>` : ''}
      ${can('vitals') ? `<button class="btn sm" data-act="vitals-new" data-id="${id}">${I.pulse}علائم حیاتی</button>` : ''}
      ${can('patient') ? `<button class="btn sm" data-act="patient-edit" data-id="${id}">${I.edit}ویرایش</button>` : ''}
      ${S.role === 'admin' ? `<button class="btn sm dan" data-act="patient-del" data-id="${id}" aria-label="حذف بیمار">${I.trash}</button>` : ''}
    </div></div>
  ${tabs('patient', [['overview', 'خلاصه'], ['vitals', 'علائم حیاتی', vit.length], ['rx', 'نسخه‌ها', rxs.length], ['labs', 'آزمایش‌ها', labs.length], ...(showVac ? [['vacc', 'واکسیناسیون', vacs.length]] : []), ['appts', 'نوبت‌ها', appts.length], ['bill', 'پرداخت‌ها', pays.length]], 'overview')}
  ${body}`;
};
function childCard(p, ch) {
  const g = Store.by('growth_monitoring', 'child_id', ch.id).sort((a, b) => a.measurement_date.localeCompare(b.measurement_date));
  const last = g[g.length - 1];
  return `<div class="card"><div class="card-h"><h3>${I.baby}پایش رشد</h3>${last ? pill(L.nut, last.nutritional_status) : ''}</div><div class="card-b">${last ? `<div class="stat-row"><div class="stat"><span class="v num">${nf(last.weight_kg, 1)}</span><span class="l">وزن kg</span></div><div class="stat"><span class="v num">${nf(last.height_cm, 1)}</span><span class="l">قد cm</span></div><div class="stat"><span class="v num">${nf(last.muac_cm, 1)}</span><span class="l">MUAC cm</span></div></div>${g.length > 1 ? `<div style="margin-top:10px">${sparkline(g.map(x => x.muac_cm), { w: 220, color: last.nutritional_status === 'normal' ? 'var(--ok)' : 'var(--crit)' })}<span class="faint" style="font-size:11.5px">روند MUAC در ${fa(g.length)} اندازه‌گیری</span></div>` : ''}` : empty('اندازه‌گیری ثبت نشده.')}
  <p class="faint" style="font-size:12px;margin-top:8px">وزن ولادت: ${ch.birth_weight_gm ? fa(ch.birth_weight_gm) + ' گرام' : '—'}${ch.mother_id ? ` · مادر: <a href="#" data-act="open-patient" data-id="${ch.mother_id}">${esc(patName(Store.get('patients', ch.mother_id)))}</a>` : ''}</p></div></div>`;
}
function rxCard(rx, withActions) {
  const items = Store.by('prescription_items', 'prescription_id', rx.id); const p = Store.get('patients', rx.patient_id); const d = Store.get('doctors', rx.doctor_id);
  const al = items.flatMap(it => allergyHits(p, it.medicine_id).map(a => medName(it.medicine_id) + ' ↔ ' + a.drug));
  const di = interactionsAmong(items.map(i => i.medicine_id));
  return `<div class="card"><div class="card-h"><div class="row">${who(patName(p), mono(rx.prescription_no) + ' · ' + fmtShort(rx.prescription_date), (patUser(p) || {}).gender === 'female' ? 'b' : '')}</div><div class="row">${rx.is_controlled ? '<span class="pill crit">مخدر</span>' : ''}${pill(L.rx, rx.status)}</div></div>
  <div class="card-b stack" style="gap:10px">
    ${al.length ? note('هشدار حساسیت: ' + esc(al.join('، ')), 'crit') : ''}${di.map(x => note(`تداخل ${pill(L.di, x.severity)} ${esc(medName(x.drug1_id))} + ${esc(medName(x.drug2_id))}: ${esc(x.description)}`, x.severity === 'major' ? 'crit' : 'warn')).join('')}
    <div class="tw"><table class="t"><thead><tr><th>دوا</th><th>دوز</th><th>تکرار</th><th class="n">روز</th><th>طریقه</th><th class="n">تعداد</th><th>وضعیت</th></tr></thead><tbody>${items.map(it => `<tr><td><b style="font-weight:600;direction:ltr;unicode-bidi:isolate">${esc(medName(it.medicine_id))}</b>${it.instructions ? `<div class="faint" style="font-size:12px">${esc(it.instructions)}</div>` : ''}</td><td>${esc(it.dosage || '—')}</td><td>${esc(it.frequency || '—')}</td><td class="n">${nf(it.duration_days)}</td><td>${L.route[it.route] || '—'}</td><td class="n">${nf(it.quantity)}</td><td>${it.is_dispensed ? '<span class="pill ok"><i></i>تحویل</span>' : '<span class="pill warn"><i></i>باقی</span>'}</td></tr>`).join('')}</tbody></table></div>
    <div class="row between"><span class="faint" style="font-size:12.5px">${esc(docName(d))} · دواخانه: ${esc((Store.get('pharmacies', rx.pharmacy_id) || {}).name || 'انتخاب نشده')}${rx.valid_until ? ' · اعتبار تا ' + fmtShort(rx.valid_until) : ''}</span>
    ${withActions && can('rx.dispense') && ['pending', 'partially_dispensed'].includes(rx.status) ? `<div class="row"><button class="btn sm pri" data-act="dispense" data-id="${rx.id}">${I.check}تحویل دوا</button><button class="btn sm dan" data-act="rx-cancel" data-id="${rx.id}">لغو نسخه</button></div>` : ''}</div>
  </div></div>`;
}
function labCard(o, withActions) {
  const res = Store.by('lab_results', 'order_id', o.id); const p = Store.get('patients', o.patient_id); const lab = Store.get('laboratories', o.laboratory_id);
  const acts = [];
  if (withActions) {
    if (o.status === 'ordered' && can('lab.result')) acts.push(`<button class="btn sm" data-act="lab-collect" data-id="${o.id}">${I.vial}ثبت نمونه</button>`);
    if (['sample_collected', 'processing'].includes(o.status) && can('lab.result')) acts.push(`<button class="btn sm pri" data-act="lab-result" data-id="${o.id}">ثبت نتایج</button>`);
    if (o.status === 'resulted' && can('lab.review')) acts.push(`<button class="btn sm pri" data-act="lab-review" data-id="${o.id}">${I.check}بررسی شد</button>`);
  }
  return `<div class="card"><div class="card-h"><div class="row">${who(patName(p), mono(o.order_no) + ' · ' + fmtDT(o.order_date), (patUser(p) || {}).gender === 'female' ? 'b' : '')}</div><div class="row">${o.priority !== 'routine' ? pill(L.labPriority, o.priority) : ''}${pill(L.lab, o.status)}</div></div>
  <div class="tw"><table class="t"><thead><tr><th>آزمایش</th><th class="n">نتیجه</th><th>واحد</th><th>محدوده نورمال</th><th>وضعیت</th></tr></thead><tbody>${res.map(r => { const t = Store.get('lab_tests', r.test_id) || {}; const rg = labRange(t, p); return `<tr><td>${esc(t.name)} ${mono(t.code)}</td><td class="n"><b>${r.result_value != null && r.result_value !== '' ? fa(r.result_value) : '<span class="faint">—</span>'}</b></td><td>${t.unit ? mono(t.unit) : ''}</td><td class="faint">${Array.isArray(rg) ? fa(rg[0] + '–' + rg[1]) : esc(rg || '—')}</td><td>${r.flag ? pill(L.flag, r.flag) : '<span class="faint">در انتظار</span>'}</td></tr>`; }).join('')}</tbody></table></div>
  <div class="card-b row between" style="border-top:1px solid var(--line)"><span class="faint" style="font-size:12.5px">${esc(lab ? lab.name : '—')} · درخواست ${esc(docName(Store.get('doctors', o.doctor_id)))}${o.reviewed_by ? ' · بررسی: ' + esc(docName(Store.get('doctors', o.reviewed_by))) : ''}</span><div class="row">${withActions ? `<button class="btn sm ghost" data-act="open-patient" data-id="${o.patient_id}">پرونده</button>` : ''}${acts.join('')}</div></div></div>`;
}

/* ---------- appointments ---------- */
function apptActions(a) {
  if (!can('appt') && !can('visit')) return '';
  const b = [];
  if (a.status === 'pending' && can('appt')) b.push(`<button class="btn sm" data-act="appt-set" data-id="${a.id}" data-s="confirmed">تأیید</button>`);
  if (a.status === 'confirmed' && can('appt')) b.push(`<button class="btn sm pri" data-act="appt-set" data-id="${a.id}" data-s="checked_in">پذیرش</button>`, `<button class="btn sm ghost" data-act="appt-set" data-id="${a.id}" data-s="no_show">غیرحاضر</button>`);
  if (a.status === 'checked_in' && can('visit')) b.push(`<button class="btn sm pri" data-act="visit" data-id="${a.id}">${I.play}شروع ویزیت</button>`);
  if (a.status === 'in_progress' && can('visit')) b.push(`<button class="btn sm pri" data-act="visit" data-id="${a.id}">${I.steth}ادامه ویزیت</button>`);
  if (['pending', 'confirmed'].includes(a.status) && can('appt')) b.push(`<button class="btn sm dan" data-act="appt-cancel" data-id="${a.id}">لغو</button>`);
  return b.join('');
}
function apptRow(a, o = {}) {
  const p = Store.get('patients', a.patient_id), d = Store.get('doctors', a.doctor_id);
  const tIcon = a.type === 'in_person' ? '' : `<span class="tag" title="${L.apptType[a.type]}">${a.type === 'home_visit' ? I.home.replace('<svg', '<svg width="14" height="14"') : a.type === 'telemedicine_audio' ? I.phone.replace('<svg', '<svg width="14" height="14"') : I.video.replace('<svg', '<svg width="14" height="14"')}&nbsp;${L.apptType[a.type]}</span>`;
  return `<div class="li"><span class="time">${fmtTime(a.appointment_time)}</span><div class="grow" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px 16px;align-items:center">
    ${o.noPatient ? `<div><b style="font-weight:600">${esc(docName(d))}</b><div class="faint" style="font-size:12px">${o.showDate ? fmtDate(a.appointment_date, true) + ' · ' : ''}${esc(hospName(a.hospital_id))}</div></div>` : `<div class="click" data-act="open-patient" data-id="${a.patient_id}" style="cursor:pointer">${who(patName(p), mono(p ? p.mrn : '') + (a.reason ? ' · ' + esc(a.reason) : ''), (patUser(p) || {}).gender === 'female' ? 'b' : '')}</div>
    <div style="font-size:13px"><b style="font-weight:500">${esc(docName(d))}</b><div class="faint" style="font-size:12px">${esc(docSpec(d))} · ${esc(hospName(a.hospital_id))}</div></div>`}
    </div><div class="row" style="justify-content:flex-end">${tIcon}${a.priority !== 'normal' ? pill(L.priority, a.priority) : ''}${pill(L.appt, a.status)}${apptActions(a)}</div></div>`;
}
VIEWS.appointments = () => {
  const t = TODAY(); const day = S.day || t; const f = S.f;
  const strip = []; for (let i = -3; i <= 10; i++) { const d = addDays(t, i); const n = Store.by('appointments', 'appointment_date', d).filter(a => a.status !== 'cancelled').length; const j = jal(d); strip.push(`<button class="day ${i === 0 ? 'today' : ''}" data-act="day" data-v="${d}" aria-pressed="${d === day}"><div class="w">${i === 0 ? 'امروز' : WEEKDAYS[parseISO(d).getDay()]}</div><div class="d">${fa(j.d)}</div><div class="m">${AF_MONTHS[j.m - 1]}</div><div class="c">${n ? fa(n) + ' نوبت' : '—'}</div></button>`); }
  let list = Store.by('appointments', 'appointment_date', day).filter(a => (!f.ah || a.hospital_id === f.ah) && (!f.ad || a.doctor_id === f.ad) && (!f.as || a.status === f.as));
  list.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  const all = Store.by('appointments', 'appointment_date', day);
  const cnt = s => all.filter(a => a.status === s).length;
  const docs = Store.all('doctors').filter(d => !f.ah || d.hospital_id === f.ah).map(d => [d.id, docName(d)]);
  return `${ph('خدمات کلینیکی', 'نوبت‌دهی', 'زمان‌های آزاد هر داکتر به‌صورت زنده محاسبه می‌شود؛ نوبت تکراری برای یک داکتر در یک ساعت ممکن نیست.', can('appt') ? `<button class="btn pri" data-act="book">${I.plus}نوبت جدید</button>` : '')}
  <div class="days" role="group" aria-label="انتخاب روز">${strip.join('')}</div>
  <div class="fbar">${fsel('ah', f.ah, hospOpts(), 'همه شفاخانه‌ها')}${fsel('ad', f.ad, docs, 'همه داکتران')}${fsel('as', f.as, Object.entries(L.appt).map(([k, v]) => [k, v[0]]), 'همه وضعیت‌ها')}</div>
  <div class="card"><div class="card-h"><h3>${fmtDate(day, true)} <small>${relDay(day)}</small></h3><div class="row" style="gap:6px">${['pending', 'confirmed', 'checked_in', 'completed'].map(s => cnt(s) ? `<span class="pill ${L.appt[s][1]}">${L.appt[s][0]}: ${fa(cnt(s))}</span>` : '').join('')}</div></div>
  <div class="lst">${list.length ? list.map(a => apptRow(a)).join('') : empty('برای این روز نوبتی مطابق فیلتر وجود ندارد.', I.cal)}</div></div>`;
};

/* ---------- doctors ---------- */
VIEWS.doctors = () => {
  const f = S.f; const q = normKey(f.dq || '');
  const list = Store.all('doctors').filter(d => { const u = U(d.user_id) || {}; return (!f.ds || d.specialization_id === f.ds) && (!f.dh || d.hospital_id === f.dh) && (!q || normKey(`${u.first_name} ${u.last_name} ${u.first_name_en} ${u.last_name_en} ${d.sub_specialization}`).includes(q)); });
  const t = TODAY();
  return `${ph('خدمات کلینیکی', 'داکتران', `${fa(Store.count('doctors'))} داکتر ثبت‌شده در ${fa(Store.count('hospitals'))} مرکز صحی؛ فهرست تأییدشده از وب‌سایت‌های رسمی شفاخانه‌ها.`, S.role === 'admin' ? `<button class="btn pri" data-act="doctor-new">${I.plus}ثبت داکتر</button>` : '')}
  <div class="fbar">${fsearch('dq', 'جستجوی نام (دری یا انگلیسی) یا تخصص')}${fsel('ds', f.ds, specOpts(), 'همه تخصص‌ها')}${fsel('dh', f.dh, hospOpts(), 'همه شفاخانه‌ها')}</div>
  ${list.length ? `<div class="dcards">${list.map(d => { const u = U(d.user_id) || {}; const today = Store.by('appointments', 'doctor_id', d.id).filter(a => a.appointment_date === t && a.status !== 'cancelled').length; return `<div class="card dcard" data-act="doctor-open" data-id="${d.id}" tabindex="0" role="button">
    ${who('داکتر ' + fullName(u), esc(docSpec(d)), u.gender === 'female' ? 'b' : '')}
    <div class="en">Dr. ${esc([u.first_name_en, u.last_name_en].filter(Boolean).join(' '))}</div>
    <div class="faint" style="font-size:12.5px">${esc(d.sub_specialization || '')}</div>
    <div class="row between"><span class="tag">${esc(hospName(d.hospital_id))}</span><span class="faint" style="font-size:12px">${today ? `امروز ${fa(today)} نوبت` : 'امروز بدون نوبت'}</span></div></div>`; }).join('')}</div>` : `<div class="card">${empty('داکتری مطابق جستجو پیدا نشد.', I.search)}</div>`}`;
};

/* ---------- hospitals ---------- */
VIEWS.hospitals = () => `${ph('خدمات کلینیکی', 'شفاخانه‌ها و کلینیک‌ها', 'ظرفیت تخت، بخش‌ها، داکتران، بانک خون و امبولانس هر مرکز در یک نگاه.')}
  <div class="hcards">${Store.all('hospitals').map(h => {
    const beds = Store.by('bed_management', 'hospital_id', h.id); const occ = beds.filter(b => b.status === 'occupied').length, res = beds.filter(b => b.status === 'reserved').length;
    const blood = Store.by('blood_bank', 'hospital_id', h.id).reduce((n, b) => n + (b.units_available || 0), 0);
    return `<div class="card hcard"><div class="top-b"><div class="row between" style="align-items:flex-start"><div><h3>${esc(h.name)}</h3><span class="faint" style="font-size:12.5px">${L.hosp[h.type] || ''}${h.is_emergency ? ' · عاجل ۲۴ ساعته' : ''}</span></div>${avatar(h.name, 'b')}</div><span class="en">${esc(h.name_en || '')}</span></div>
    <div class="body">
      <div class="stat-row"><div class="stat"><span class="v num">${fa(Store.countBy('doctors', 'hospital_id', h.id))}</span><span class="l">داکتر</span></div><div class="stat"><span class="v num">${fa(Store.countBy('departments', 'hospital_id', h.id))}</span><span class="l">بخش</span></div><div class="stat"><span class="v num">${beds.length ? fa(occ) + '/' + fa(beds.length) : '—'}</span><span class="l">تخت اشغال</span></div><div class="stat"><span class="v num">${fa(blood)}</span><span class="l">واحد خون</span></div><div class="stat"><span class="v num">${fa(Store.countBy('ambulances', 'hospital_id', h.id))}</span><span class="l">امبولانس</span></div></div>
      ${beds.length ? `<div class="occ" title="اشغال تخت"><i style="width:${occ / beds.length * 100}%;background:var(--info)"></i><i style="width:${res / beds.length * 100}%;background:var(--warn)"></i></div>` : ''}
      <dl class="kv"><dt>آدرس</dt><dd>${esc(h.address || '—')}</dd>${h.phone ? `<dt>تلیفون</dt><dd><span class="copy">${esc(h.phone)}</span>${h.phone2 ? ` · <span class="copy">${esc(h.phone2)}</span>` : ''}</dd>` : ''}${h.working_hours ? `<dt>ساعات کار</dt><dd>${esc(h.working_hours)}</dd>` : ''}${h.website ? `<dt>وب‌سایت</dt><dd><a href="https://${esc(h.website)}" target="_blank" rel="noopener" class="mono">${esc(h.website)}</a></dd>` : ''}</dl>
      ${(h.services || []).length ? `<div class="chips">${h.services.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:auto">${h.phone ? `<button class="btn sm" data-act="copy" data-v="${esc(h.phone)}">${I.copy}کاپی شماره</button>` : ''}<button class="btn sm pri" data-act="open-hospital" data-id="${h.id}">جزئیات و تخت‌ها</button></div>
    </div></div>`; }).join('')}</div>`;

VIEWS.hospital = (id) => {
  const h = Store.get('hospitals', id); if (!h) return empty('شفاخانه پیدا نشد.');
  const deps = Store.by('departments', 'hospital_id', id); const docs = Store.by('doctors', 'hospital_id', id);
  const beds = Store.by('bed_management', 'hospital_id', id).sort((a, b) => a.bed_number.localeCompare(b.bed_number));
  const bySpec = {}; for (const d of docs) (bySpec[docSpec(d)] = bySpec[docSpec(d)] || []).push(d);
  return `<button class="btn sm ghost" data-act="go" data-v="hospitals" style="margin-bottom:10px">${I.back}شفاخانه‌ها</button>
  ${ph(L.hosp[h.type] || '', esc(h.name), esc(h.note || h.address || ''), S.role === 'admin' || can('bed') ? `<button class="btn" data-act="bed-new" data-id="${id}">${I.plus}افزودن تخت</button>` : '')}
  <div class="g g-12">
    <div class="stack">
      <div class="card"><div class="card-h"><h3>بخش‌ها</h3><small class="faint">${fa(deps.length)}</small></div><div class="lst">${deps.map(dp => `<div class="li"><div class="grow"><b style="font-weight:600">${esc(dp.name)}</b> ${dp.code ? mono(dp.code) : ''}<div class="faint" style="font-size:12px">${esc(dp.floor || '')}${dp.head_doctor_id ? ' · مسئول: ' + esc(docName(Store.get('doctors', dp.head_doctor_id))) : ''}</div></div><span class="faint" style="font-size:12px">${fa(Store.countBy('bed_management', 'department_id', dp.id))} تخت</span></div>`).join('') || empty('بخشی ثبت نشده.')}</div></div>
      <div class="card"><div class="card-h"><h3>داکتران</h3><small class="faint">${fa(docs.length)}</small></div><div class="lst">${Object.entries(bySpec).map(([s, ds]) => `<div class="li" style="align-items:flex-start"><div class="grow"><div class="faint" style="font-size:12px">${esc(s)}</div>${ds.map(d => `<div style="cursor:pointer" data-act="doctor-open" data-id="${d.id}">${esc(docName(d))}</div>`).join('')}</div></div>`).join('') || empty('داکتری ثبت نشده.')}</div></div>
    </div>
    <div class="card"><div class="card-h"><h3>${I.bed}مدیریت تخت‌ها</h3><div class="row" style="gap:6px">${Object.keys(L.bed).map(s => `<span class="pill ${L.bed[s][1]}"><i></i>${L.bed[s][0]} ${fa(beds.filter(b => b.status === s).length)}</span>`).join('')}</div></div>
      <div class="card-b">${beds.length ? deps.filter(dp => beds.some(b => b.department_id === dp.id)).map(dp => `<div class="fs-h" style="margin-top:4px">${esc(dp.name)}</div><div class="beds" style="margin-bottom:14px">${beds.filter(b => b.department_id === dp.id).map(b => { const p = Store.get('patients', b.patient_id); return `<button class="bed ${b.status}" data-act="bed-open" data-id="${b.id}"><b>${esc(b.bed_number)}</b><span>${p ? esc(fullName(patUser(p)).split(' ')[0]) : L.bed[b.status][0]}</span><span class="faint" style="font-size:11px">${L.bedType[b.bed_type] || ''}</span></button>`; }).join('')}</div>`).join('') : empty('برای این شفاخانه هنوز تخت ثبت نشده است.', I.bed)}</div></div>
  </div>`;
};
