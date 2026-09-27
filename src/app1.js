/* ================= constants & vocabulary ================= */
const AF_MONTHS = ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'];
const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
const DISTRICTS = [['هرات', 34.342, 62.203], ['انجیل', 34.30, 62.25], ['گذره', 34.21, 62.21], ['کرخ', 34.48, 62.58], ['پشتون زرغون', 34.29, 62.80], ['غوریان', 34.34, 61.47], ['زنده‌جان', 34.34, 61.75], ['کهسان', 34.65, 61.20], ['کشک رباط سنگی', 34.83, 62.47], ['کشک کهنه', 34.87, 62.54], ['شیندند', 33.30, 62.14], ['ادرسکن', 33.64, 62.27], ['اوبه', 34.37, 63.17], ['چشت شریف', 34.35, 63.73], ['فارسی', 33.78, 63.26], ['گلران', 35.10, 61.66]];
const ICD = [
  ['J06.9', 'انتان حاد طرق تنفسی فوقانی'], ['J18.9', 'سینه‌بغل (نمونیا)'], ['J45.9', 'آسم'], ['J44.9', 'مرض مزمن انسدادی ریه (COPD)'],
  ['A09', 'اسهال و گاستروانتریت'], ['A00.9', 'کولرا'], ['A01.0', 'محرقه (تیفوئید)'], ['B54', 'ملاریا'], ['B55.1', 'لیشمانیا جلدی'], ['B55.0', 'لیشمانیا احشایی'],
  ['A15.0', 'توبرکلوز ریوی'], ['B05.9', 'سرخکان'], ['B15.9', 'هپاتیت A'], ['B16.9', 'هپاتیت B حاد'], ['B18.2', 'هپاتیت C مزمن'],
  ['E11.9', 'دیابت نوع ۲'], ['E10.9', 'دیابت نوع ۱'], ['E43', 'سوء تغذیه حاد شدید (SAM)'], ['E44.0', 'سوء تغذیه حاد متوسط (MAM)'], ['D50.9', 'کم‌خونی فقر آهن'],
  ['I10', 'فشار خون بلند اولیه'], ['I20.0', 'آنژین ناپایدار'], ['I20.9', 'آنژین صدری'], ['I21.9', 'انفارکتوس حاد میوکارد'], ['I50.9', 'نارسایی قلبی'], ['I63.9', 'سکته مغزی'],
  ['K29.7', 'التهاب معده (گاستریت)'], ['K35.8', 'آپاندیسیت حاد'], ['K80.2', 'سنگ صفرا'], ['N39.0', 'انتان طرق بولی'], ['N20.0', 'سنگ گرده'],
  ['O14.9', 'پره‌اکلامپسی'], ['O21.0', 'استفراغ شدید حاملگی'], ['Z34.9', 'نظارت حاملگی نورمال'], ['O80', 'ولادت نورمال'],
  ['H10.9', 'التهاب ملتحمه'], ['H66.9', 'التهاب گوش میانی'], ['H25.9', 'آب مروارید (کتاراکت)'], ['K02.9', 'پوسیدگی دندان'],
  ['L30.9', 'التهاب جلد (درماتیت)'], ['T30.0', 'سوختگی'], ['S52.5', 'شکستگی انتهای رادیوس'], ['M54.5', 'درد کمر'], ['M17.9', 'آرتروز زانو'],
  ['R51', 'سردردی'], ['F32.9', 'افسردگی'], ['F41.1', 'اضطراب عمومی'], ['F43.1', 'اختلال استرس پس از سانحه (PTSD)'], ['G40.9', 'صرع'],
];
const EPI = [
  { code: 'BCG', dose: 1, name: 'BCG', days: 0, at: 'ولادت' }, { code: 'OPV', dose: 0, name: 'پولیو خوراکی ۰', days: 0, at: 'ولادت' }, { code: 'HEPB', dose: 0, name: 'هپاتیت B ولادی', days: 0, at: 'ولادت' },
  { code: 'OPV', dose: 1, name: 'پولیو خوراکی ۱', days: 42, at: '۶ هفتگی' }, { code: 'PENTA', dose: 1, name: 'پنتاوالان ۱', days: 42, at: '۶ هفتگی' }, { code: 'PCV', dose: 1, name: 'PCV ۱', days: 42, at: '۶ هفتگی' }, { code: 'ROTA', dose: 1, name: 'روتاویروس ۱', days: 42, at: '۶ هفتگی' },
  { code: 'OPV', dose: 2, name: 'پولیو خوراکی ۲', days: 70, at: '۱۰ هفتگی' }, { code: 'PENTA', dose: 2, name: 'پنتاوالان ۲', days: 70, at: '۱۰ هفتگی' }, { code: 'PCV', dose: 2, name: 'PCV ۲', days: 70, at: '۱۰ هفتگی' }, { code: 'ROTA', dose: 2, name: 'روتاویروس ۲', days: 70, at: '۱۰ هفتگی' },
  { code: 'OPV', dose: 3, name: 'پولیو خوراکی ۳', days: 98, at: '۱۴ هفتگی' }, { code: 'PENTA', dose: 3, name: 'پنتاوالان ۳', days: 98, at: '۱۴ هفتگی' }, { code: 'PCV', dose: 3, name: 'PCV ۳', days: 98, at: '۱۴ هفتگی' }, { code: 'IPV', dose: 1, name: 'پولیو زرقی (IPV)', days: 98, at: '۱۴ هفتگی' },
  { code: 'MR', dose: 1, name: 'سرخکان-روبیلا ۱', days: 274, at: '۹ ماهگی' }, { code: 'MR', dose: 2, name: 'سرخکان-روبیلا ۲', days: 548, at: '۱۸ ماهگی' },
];
const L = {
  appt: { pending: ['در انتظار تأیید', 'warn'], confirmed: ['تأییدشده', 'info'], checked_in: ['پذیرش‌شده', 'acc'], in_progress: ['در حال ویزیت', 'brass'], completed: ['تکمیل‌شده', 'ok'], cancelled: ['لغوشده', 'crit'], no_show: ['غیرحاضر', ''] },
  apptType: { in_person: 'حضوری', telemedicine_video: 'مشوره ویدیویی', telemedicine_audio: 'مشوره تلفنی', home_visit: 'ویزیت منزل' },
  priority: { normal: ['عادی', ''], urgent: ['فوری', 'warn'], emergency: ['عاجل', 'crit'] },
  rx: { pending: ['در انتظار تحویل', 'warn'], dispensed: ['تحویل‌شده', 'ok'], partially_dispensed: ['تحویل ناقص', 'info'], cancelled: ['لغوشده', 'crit'] },
  lab: { ordered: ['درخواست‌شده', 'warn'], sample_collected: ['نمونه گرفته شد', 'info'], processing: ['در حال انجام', 'info'], resulted: ['نتیجه آماده', 'acc'], reviewed: ['بررسی‌شده', 'ok'], cancelled: ['لغوشده', 'crit'] },
  labPriority: { routine: ['عادی', ''], urgent: ['فوری', 'warn'], emergency: ['عاجل', 'crit'] },
  flag: { normal: ['نورمال', 'ok'], low: ['پایین', 'warn'], high: ['بالا', 'warn'], critical_low: ['بحرانی پایین', 'crit'], critical_high: ['بحرانی بالا', 'crit'], abnormal: ['غیرنورمال', 'warn'] },
  call: { received: ['دریافت‌شده', 'warn'], dispatched: ['اعزام امبولانس', 'info'], arrived: ['رسیده به محل', 'acc'], transported: ['در راه شفاخانه', 'brass'], resolved: ['بسته‌شده', 'ok'], cancelled: ['لغو', ''] },
  amb: { available: ['آماده', 'ok'], on_call: ['در مأموریت', 'warn'], maintenance: ['در ترمیم', 'crit'], offline: ['خاموش', ''] },
  ambType: { basic: 'ابتدایی', advanced: 'پیشرفته', neonatal: 'نوزادان', ICU_mobile: 'ICU سیار' },
  hosp: { public_hospital: 'شفاخانه دولتی', private_hospital: 'شفاخانه خصوصی', clinic: 'کلینیک', health_center: 'مرکز صحی', subcenter: 'مرکز صحی فرعی', CHC: 'مرکز صحی جامع' },
  gender: { male: 'مرد', female: 'زن', other: 'دیگر' },
  route: { oral: 'خوراکی', injection: 'زرقی', topical: 'موضعی', inhaler: 'استنشاقی', drops: 'قطره', other: 'دیگر' },
  risk: { low: ['خطر کم', 'ok'], moderate: ['خطر متوسط', 'warn'], high: ['خطر بلند', 'crit'], critical: ['بحرانی', 'crit'] },
  di: { minor: ['خفیف', 'info'], moderate: ['متوسط', 'warn'], major: ['شدید', 'crit'], contraindicated: ['ممنوع', 'crit'] },
  epi: { watch: ['مراقبت', 'info'], warning: ['هشدار', 'warn'], alert: ['خطر', 'crit'], emergency: ['اضطرار', 'crit'] },
  bed: { available: ['خالی', 'ok'], occupied: ['اشغال', 'info'], reserved: ['رزرو', 'warn'], maintenance: ['ترمیم', ''] },
  bedType: { general: 'عمومی', ICU: 'ICU', HDU: 'HDU', isolation: 'تجرید', pediatric: 'اطفال', maternity: 'ولادی' },
  nut: { normal: ['نورمال', 'ok'], MAM: ['سوء تغذیه متوسط (MAM)', 'warn'], SAM: ['سوء تغذیه شدید (SAM)', 'crit'] },
  dxType: { primary: 'اصلی', secondary: 'فرعی', provisional: 'احتمالی', final: 'نهایی' },
  pay: { cash: 'نقد', mobile_money: 'پول موبایلی', card: 'کارت', insurance: 'بیمه', free: 'رایگان' },
  payStatus: { pending: ['در انتظار', 'warn'], completed: ['پرداخت‌شده', 'ok'], refunded: ['مسترد', 'info'], failed: ['ناموفق', 'crit'] },
  action: { create: ['ایجاد', 'ok'], update: ['ویرایش', 'info'], delete: ['حذف', 'crit'] },
  marital: { single: 'مجرد', married: 'متأهل', widowed: 'بیوه', divorced: 'جدا شده' },
};
const FIELD_FA = {
  first_name: 'نام', last_name: 'تخلص', phone: 'شماره تماس', national_id: 'نمبر تذکره', email: 'ایمیل', role_id: 'نقش', mrn: 'نمبر پرونده (MRN)', user_id: 'کاربر',
  patient_id: 'بیمار', doctor_id: 'داکتر', hospital_id: 'شفاخانه', appointment_date: 'تاریخ نوبت', appointment_time: 'ساعت نوبت', appointment_no: 'نمبر نوبت',
  specialization_id: 'تخصص', license_number: 'نمبر جواز', name: 'نام', type: 'نوع', status: 'وضعیت', priority: 'اولویت', quantity: 'تعداد', medicine_id: 'دوا',
  expiry_date: 'تاریخ انقضا', pharmacy_id: 'دواخانه', laboratory_id: 'لابراتوار', vaccine_code: 'واکسین', date_given: 'تاریخ تطبیق', lmp_date: 'تاریخ آخرین قاعدگی',
  visit_date: 'تاریخ ویزیت', diagnosis_name: 'تشخیص', caller_phone: 'شماره تماس‌گیرنده', situation: 'شرح وضعیت', disease_name: 'بیماری', week_number: 'هفته', district: 'ولسوالی',
  blood_type: 'گروه خون', bed_number: 'نمبر تخت', vehicle_number: 'نمبر پلیت', amount: 'مبلغ', payment_no: 'نمبر پرداخت', appointment_id: 'نوبت', code: 'کد', maternal_id: 'پرونده حاملگی',
  child_id: 'پرونده طفل', measurement_date: 'تاریخ اندازه‌گیری', order_no: 'نمبر درخواست', prescription_no: 'نمبر نسخه', record_id: 'پرونده', severity: 'شدت', gender: 'جنس',
  test_id: 'آزمایش', order_id: 'درخواست', prescription_id: 'نسخه', prescription_date: 'تاریخ نسخه', year: 'سال', message: 'پیام', alert_type: 'نوع هشدار', generic_name: 'نام علمی دوا',
};
const ROLE_UI = {
  admin: { label: 'مدیر سیستم', views: '*', can: '*' },
  doctor: { label: 'داکتر', views: ['dashboard', 'patients', 'appointments', 'doctors', 'hospitals', 'lab', 'mch'], can: ['visit', 'appt', 'patient', 'vitals', 'lab.review', 'alert.ack', 'mch', 'vacc'] },
  nurse: { label: 'نرس / پذیرش', views: ['dashboard', 'patients', 'appointments', 'doctors', 'hospitals', 'mch', 'emergency'], can: ['appt', 'patient', 'vitals', 'mch', 'vacc', 'bed', 'call', 'blood'] },
  pharmacist: { label: 'فارمسست', views: ['dashboard', 'pharmacy', 'patients'], can: ['rx.dispense', 'stock'] },
  lab_tech: { label: 'تکنیشن لابراتوار', views: ['dashboard', 'lab', 'patients'], can: ['lab.result'] },
  ministry_official: { label: 'مسئول صحت عامه', views: ['dashboard', 'surveillance', 'emergency', 'hospitals', 'doctors'], can: ['surv', 'alert', 'call', 'blood'] },
};
const can = p => { const r = ROLE_UI[S.role]; return r.can === '*' || r.can.includes(p); };
const canView = v => { const r = ROLE_UI[S.role]; return r.views === '*' || r.views.includes(v); };

/* ================= icons ================= */
const ico = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  dash: ico('<rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2"/><rect x="3" y="15" width="7.5" height="6" rx="2"/>'),
  user: ico('<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.8-3.9 3.8-6.5 7.5-6.5s6.7 2.6 7.5 6.5"/>'),
  users: ico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.7-3.5 3.3-5.8 6.5-5.8s5.8 2.3 6.5 5.8"/><path d="M15.5 4.8a3.3 3.3 0 0 1 0 6.4M17.5 14.6c2 .8 3.4 2.7 3.9 5.4"/>'),
  cal: ico('<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M8 14h2M14 14h2M8 17.5h2"/>'),
  steth: ico('<path d="M5 3.5v4.8a4.5 4.5 0 0 0 9 0V3.5"/><path d="M9.5 12.8v1.7a5 5 0 0 0 10 0V12"/><circle cx="19.5" cy="10" r="2"/>'),
  hosp: ico('<path d="M4.5 21V5.5A2.5 2.5 0 0 1 7 3h10a2.5 2.5 0 0 1 2.5 2.5V21"/><path d="M2 21h20M12 7v6M9 10h6M10 21v-3.5h4V21"/>'),
  pill: ico('<path d="M10.5 3.9a4.9 4.9 0 0 1 6.9 6.9l-6.6 6.6a4.9 4.9 0 0 1-6.9-6.9z"/><path d="M7.3 7.1l6.9 6.9"/>'),
  flask: ico('<path d="M9 3h6M10 3v6.2L4.6 18.6A1.6 1.6 0 0 0 6 21h12a1.6 1.6 0 0 0 1.4-2.4L14 9.2V3"/><path d="M7 15.5h10"/>'),
  heart: ico('<path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.5c0 5.8-7.5 10.4-7.5 10.4z"/>'),
  baby: ico('<circle cx="12" cy="8.5" r="5"/><path d="M10 8.2h.01M14 8.2h.01M10.3 10.5c.9.7 2.5.7 3.4 0"/><path d="M7.5 21c.6-3 2.3-4.8 4.5-4.8s3.9 1.8 4.5 4.8"/>'),
  pulse: ico('<path d="M2.5 12.5h4l2.5-7 4.5 14 3-7h5"/>'),
  siren: ico('<path d="M6.5 18v-5.5a5.5 5.5 0 0 1 11 0V18"/><path d="M4 21h16M5 18h14M12 2.5v2M4.2 5.7l1.4 1.4M19.8 5.7l-1.4 1.4"/>'),
  list: ico('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
  db: ico('<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v13c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-13M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>'),
  search: ico('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>'),
  plus: ico('<path d="M12 5v14M5 12h14"/>'),
  x: ico('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  alert: ico('<path d="M12 3.5L2.5 20h19z"/><path d="M12 10v4.5M12 17.5h.01"/>'),
  info: ico('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>'),
  drop: ico('<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z"/>'),
  bed: ico('<path d="M3 6v14M3 14h18v6M21 14a3.5 3.5 0 0 0-3.5-3.5H10V14"/><circle cx="6.8" cy="11" r="1.8"/>'),
  amb: ico('<path d="M2.5 16.5V8.5a1.5 1.5 0 0 1 1.5-1.5h10v9.5M14 10h3.8l3.7 3.8v2.7h-2"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M9 17.5h6M7 9.5v4M5 11.5h4"/>'),
  copy: ico('<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>'),
  menu: ico('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  edit: ico('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  trash: ico('<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3"/>'),
  play: ico('<path d="M7 4.5v15l12-7.5z"/>'),
  vial: ico('<path d="M9 3h6M10 3v14a2 2 0 0 0 4 0V3"/><path d="M10 11h4"/>'),
  syringe: ico('<path d="M18 2.5l3.5 3.5M16 4.5l3.5 3.5M17.8 6.2L8.5 15.5 5 16l.5-3.5 9.3-9.3M9.5 9.5l2 2M12 7l2 2M5.5 16.5L2.5 19.5"/>'),
  back: ico('<path d="M9 5l7 7-7 7"/>'),
  video: ico('<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5"/>'),
  phone: ico('<path d="M5 3.5h3.5l1.8 4.5-2.3 1.5a11 11 0 0 0 6.5 6.5l1.5-2.3 4.5 1.8V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z"/>'),
  home: ico('<path d="M3.5 11L12 4l8.5 7M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>'),
  shield: ico('<path d="M12 3l7.5 3v5.5c0 4.7-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.8-7.5-9.5V6z"/><path d="M8.8 12l2.2 2.2 4.3-4.4"/>'),
  scale: ico('<path d="M12 4v16M5 20h14M5.5 8h13M5.5 8L3 14a3 3 0 0 0 5 0zM18.5 8L16 14a3 3 0 0 0 5 0z"/>'),
};
const GIRIH = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23D2AE6B' stroke-width='.9'%3E%3Cpath d='M32 8l6.6 17.4L56 32l-17.4 6.6L32 56l-6.6-17.4L8 32l17.4-6.6z'/%3E%3Cpath d='M15 15l17 7 17-7-7 17 7 17-17-7-17 7 7-17z'/%3E%3Ccircle cx='32' cy='32' r='6'/%3E%3Cpath d='M0 0l8 8M64 0l-8 8M0 64l8-8M64 64l-8-8'/%3E%3C/g%3E%3C/svg%3E")`;

/* ================= formatting ================= */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fa = v => String(v ?? '').replace(/\d/g, d => FA_DIGITS[d]);
const nf = (n, d = 0) => n == null || isNaN(n) ? '—' : fa(Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 })).replace(/,/g, '٬').replace(/\./g, '٫');
const pad2 = n => String(n).padStart(2, '0');
const isoDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d, 12); };
const TODAY = () => isoDate(new Date());
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return isoDate(d); };
const diffDays = (a, b) => Math.round((parseISO(a) - parseISO(b)) / 864e5);
const _pf = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: 'numeric', day: 'numeric' });
const jal = s => { const p = _pf.formatToParts(parseISO(s)); const g = t => +((p.find(x => x.type === t) || {}).value || 0); return { y: g('year'), m: g('month'), d: g('day') }; };
const fmtDate = (s, wd = false) => { if (!s) return '—'; const j = jal(s); return (wd ? WEEKDAYS[parseISO(s).getDay()] + ' ' : '') + fa(j.d) + ' ' + AF_MONTHS[j.m - 1] + ' ' + fa(j.y); };
const fmtShort = s => { if (!s) return '—'; const j = jal(s); return fa(`${j.y}/${pad2(j.m)}/${pad2(j.d)}`); };
const fmtDM = s => { const j = jal(s); return fa(j.d) + ' ' + AF_MONTHS[j.m - 1]; };
const fmtTime = t => t ? fa(String(t).slice(0, 5)) : '—';
const fmtDT = s => s ? fmtShort(s) + '، ' + fmtTime(String(s).slice(11, 16)) : '—';
const relDay = s => { const n = diffDays(String(s).slice(0, 10), TODAY()); return n === 0 ? 'امروز' : n === 1 ? 'فردا' : n === -1 ? 'دیروز' : n > 0 ? fa(n) + ' روز بعد' : fa(-n) + ' روز پیش'; };
const ageDays = dob => dob ? diffDays(TODAY(), dob) : null;
const ageYears = dob => dob ? Math.floor(ageDays(dob) / 365.25) : null;
const ageText = dob => { if (!dob) return 'سن نامعلوم'; const d = ageDays(dob); if (d < 0) return '—'; if (d < 60) return fa(Math.floor(d / 7)) + ' هفته'; if (d < 730) return fa(Math.floor(d / 30.44)) + ' ماه'; return fa(Math.floor(d / 365.25)) + ' سال'; };
const afn = n => n == null ? '—' : nf(n) + ' افغانی';

/* ================= relations helpers ================= */
const U = id => Store.get('users', id);
const fullName = u => u ? `${u.first_name} ${u.last_name}` : '—';
const patUser = p => p ? U(p.user_id) : null;
const patName = p => p ? fullName(patUser(p)) : 'بیمار حذف‌شده';
const docName = d => d ? 'داکتر ' + fullName(U(d.user_id)) : '—';
const docSpec = d => d ? (Store.get('specializations', d.specialization_id) || {}).name || '—' : '—';
const hospName = id => (Store.get('hospitals', id) || {}).name || '—';
const medName = id => (Store.get('medicines', id) || {}).generic_name || '—';
const rowLabel = (t, r) => {
  if (!r) return '';
  switch (t) {
    case 'patients': return `${patName(r)} · ${r.mrn}`;
    case 'users': return fullName(r);
    case 'doctors': return docName(r);
    case 'appointments': return `${r.appointment_no} · ${patName(Store.get('patients', r.patient_id))}`;
    case 'medical_records': return `ویزیت ${patName(Store.get('patients', r.patient_id))}`;
    case 'prescriptions': return r.prescription_no;
    case 'prescription_items': return medName(r.medicine_id);
    case 'lab_orders': return r.order_no;
    case 'lab_results': return (Store.get('lab_tests', r.test_id) || {}).name || '';
    case 'vital_signs': return `علائم حیاتی ${patName(Store.get('patients', r.patient_id))}`;
    case 'vaccinations': return `${r.vaccine_name || r.vaccine_code} · ${patName(Store.get('patients', r.patient_id))}`;
    case 'pharmacy_inventory': return `${medName(r.medicine_id)} · ${r.batch_number || ''}`;
    case 'blood_bank': return `${r.blood_type} · ${hospName(r.hospital_id)}`;
    case 'bed_management': return `تخت ${r.bed_number} · ${hospName(r.hospital_id)}`;
    case 'emergency_calls': return r.situation;
    case 'disease_surveillance': return `${r.disease_name} · هفته ${r.week_number}`;
    case 'diagnoses': return r.diagnosis_name;
    case 'payments': return r.payment_no;
    default: return r.name || r.disease_name || r.message || r.code || r.vehicle_number || String(r.id).slice(0, 8);
  }
};

/* ================= clinical calculators ================= */
const bmiOf = (w, h) => (w && h) ? Math.round(w / ((h / 100) ** 2) * 10) / 10 : null;
const bmiClass = b => b == null ? '' : b < 18.5 ? 'کم‌وزن' : b < 25 ? 'نورمال' : b < 30 ? 'اضافه‌وزن' : 'چاقی';
function news2(v) {
  let s = 0, three = false, n = 0; const add = x => { s += x; n++; if (x === 3) three = true; };
  if (v.respiratory_rate != null) { const r = v.respiratory_rate; add(r <= 8 ? 3 : r <= 11 ? 1 : r <= 20 ? 0 : r <= 24 ? 2 : 3); }
  if (v.oxygen_sat != null) { const o = v.oxygen_sat; add(o <= 91 ? 3 : o <= 93 ? 2 : o <= 95 ? 1 : 0); }
  if (v.bp_systolic != null) { const b = v.bp_systolic; add(b <= 90 ? 3 : b <= 100 ? 2 : b <= 110 ? 1 : b <= 219 ? 0 : 3); }
  if (v.pulse_rate != null) { const p = v.pulse_rate; add(p <= 40 ? 3 : p <= 50 ? 1 : p <= 90 ? 0 : p <= 110 ? 1 : p <= 130 ? 2 : 3); }
  if (v.temperature != null) { const t = v.temperature; add(t <= 35 ? 3 : t <= 36 ? 1 : t <= 38 ? 0 : t <= 39 ? 1 : 2); }
  if (!n) return null;
  return { score: s, n, level: s >= 7 ? 'high' : s >= 5 ? 'medium' : three ? 'single' : 'low' };
}
const NEWS_L = { high: ['خطر بلند — ارزیابی فوری تیم', 'crit'], medium: ['خطر متوسط — پاسخ عاجل', 'warn'], single: ['یک پارامتر بحرانی', 'warn'], low: ['خطر کم', 'ok'] };
const muacClass = m => m == null ? null : m < 11.5 ? 'SAM' : m < 12.5 ? 'MAM' : 'normal';
const eddOf = lmp => lmp ? addDays(lmp, 280) : null;
const gaWeeks = (lmp, at = TODAY()) => lmp ? Math.floor(diffDays(at, lmp) / 7) : null;
function labRange(test, p) {
  if (test.qualitative) return 'منفی';
  const u = patUser(p) || {}; const age = ageYears(u.date_of_birth);
  const r = age != null && age < 14 ? test.ranges.c : u.gender === 'female' ? test.ranges.f : test.ranges.m;
  return r ? r : null;
}
function labFlag(test, value, p) {
  if (value == null || String(value).trim() === '') return null;
  if (test.qualitative) return /مثبت|positive|pos|\+|reactive|seen|دیده/i.test(String(value)) ? 'abnormal' : 'normal';
  const x = parseFloat(toLatin(value).replace('٫', '.')); if (isNaN(x)) return null;
  const c = test.critical; if (c) { if (c[0] != null && x < c[0]) return 'critical_low'; if (c[1] != null && x > c[1]) return 'critical_high'; }
  const r = labRange(test, p); if (r) { if (x < r[0]) return 'low'; if (x > r[1]) return 'high'; }
  return 'normal';
}
function epiFor(p) {
  const u = patUser(p); if (!u || !u.date_of_birth) return [];
  const given = Store.by('vaccinations', 'patient_id', p.id);
  return EPI.map(e => {
    const done = given.find(v => v.vaccine_code === e.code && Number(v.dose_number) === e.dose);
    const due = addDays(u.date_of_birth, e.days); const late = diffDays(TODAY(), due);
    return Object.assign({}, e, { due, done, st: done ? 'done' : late > 28 ? 'overdue' : late >= 0 ? 'due' : 'upcoming' });
  });
}
const isChild = p => { const u = patUser(p); return u && u.date_of_birth && ageDays(u.date_of_birth) < 1826; };
const haversine = (a, b, c, d) => { const R = 6371, r = x => x * Math.PI / 180; const dl = r(c - a), dn = r(d - b); const q = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(q)); };
function allergyHits(p, medId) {
  const m = Store.get('medicines', medId); if (!m || !p) return [];
  const keys = [m.generic_name, m.drug_class, ...(m.brand_names || [])].map(normKey);
  return (p.allergies || []).filter(a => { const k = normKey(a.drug); return k && keys.some(x => x && (x.includes(k) || k.includes(x))); });
}
function interactionsAmong(medIds) {
  const set = new Set(medIds); const out = [];
  for (const di of Store.all('drug_interactions')) if (set.has(di.drug1_id) && set.has(di.drug2_id) && di.drug1_id !== di.drug2_id) out.push(di);
  return out;
}
function activeMeds(p) {
  const out = new Set();
  for (const rx of Store.by('prescriptions', 'patient_id', p.id)) {
    if (rx.status === 'cancelled') continue;
    for (const it of Store.by('prescription_items', 'prescription_id', rx.id)) if (diffDays(TODAY(), rx.prescription_date) <= (it.duration_days || 30)) out.add(it.medicine_id);
  }
  return out;
}
const genNo = (pre, t, col) => { const d = TODAY().replace(/-/g, '').slice(2); let v; do { v = `${pre}-${d}-${String(Math.floor(1000 + Math.random() * 9000))}`; } while (Store.unique(t, col, v)); return v; };
const genMRN = () => { let v; do { v = 'HRT-' + String(Math.floor(100000 + Math.random() * 899999)); } while (Store.unique('patients', 'mrn', v)); return v; };

/* ================= small UI builders ================= */
const pill = (map, k) => { const v = map[k]; if (!v) return ''; const [l, c] = Array.isArray(v) ? v : [v, '']; return `<span class="pill ${c}"><i></i>${l}</span>`; };
const avatar = (name, cls = '') => `<span class="av ${cls}" aria-hidden="true">${esc(String(name || '؟').replace(/^(داکتر|دکترس)\s+/, '').trim().charAt(0))}</span>`;
const bt = t => `<span class="bt ${!t || t === 'Unknown' ? 'u' : ''}" title="گروه خون">${t && t !== 'Unknown' ? esc(t) : '؟'}</span>`;
const mono = s => `<span class="mono">${esc(s)}</span>`;
const empty = (msg, icon = I.info) => `<div class="empty">${icon}${msg}</div>`;
const note = (msg, kind = '', icon = kind === 'crit' || kind === 'warn' ? I.alert : I.info) => `<div class="note ${kind}">${icon}<div>${msg}</div></div>`;
const who = (name, sub, cls = '') => `<div class="who">${avatar(name, cls)}<div class="t"><b>${esc(name)}</b><span>${sub}</span></div></div>`;
const opt = (v, l, sel) => `<option value="${esc(v)}"${String(sel ?? '') === String(v) ? ' selected' : ''}>${esc(l)}</option>`;
const field = (label, input, o = {}) => `<div class="f ${o.cls || ''}"><label class="${o.req ? 'req' : ''}"${o.for ? ` for="${o.for}"` : ''}>${label}</label>${input}${o.hint ? `<span class="hint">${o.hint}</span>` : ''}</div>`;
const inp = (key, val, o = {}) => `<input class="in" id="f-${key}" data-bind="${key}" value="${esc(val ?? '')}" ${o.num ? 'inputmode="decimal" data-num' : ''} ${o.type ? `type="${o.type}"` : ''} ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.dir ? `dir="${o.dir}"` : ''} ${o.parts ? `data-parts="${o.parts}"` : ''} ${o.attrs || ''} autocomplete="off">`;
const sel = (key, val, options, o = {}) => `<select class="in" id="f-${key}" data-bind="${key}" ${o.rr ? 'data-rerender' : ''} ${o.parts ? `data-parts="${o.parts}"` : ''}>${o.blank !== false ? opt('', o.blank || 'انتخاب کنید…', val) : ''}${options.map(([v, l]) => opt(v, l, val)).join('')}</select>`;
const txt = (key, val, o = {}) => `<textarea class="in" id="f-${key}" data-bind="${key}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''}>${esc(val ?? '')}</textarea>`;
const dateHint = v => v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? '= ' + fmtDate(v, true) : 'تاریخ میلادی؛ معادل شمسی نمایش داده می‌شود';

/* ================= charts (SVG, theme tokens) ================= */
function barChart(data, o = {}) {
  const W = o.w || 640, H = o.h || 200, pl = 34, pr = 8, pt = 12, pb = 26;
  const max = Math.max(1, ...data.map(d => d.v)); const step = niceStep(max); const top = Math.ceil(max / step) * step;
  const bw = (W - pl - pr) / data.length; const y = v => pt + (H - pt - pb) * (1 - v / top);
  let g = '<g class="grid">'; for (let v = 0; v <= top; v += step) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${fa(v)}</text>`; g += '</g>';
  const bars = data.map((d, i) => {
    const x = pl + i * bw, w = Math.max(4, bw * 0.56), cx = x + bw / 2, h = y(0) - y(d.v);
    const r = Math.min(4, w / 2, h);
    const path = h > 0 ? `M${cx - w / 2},${y(0)} v${-(h - r)} q0,${-r} ${r},${-r} h${w - 2 * r} q${r},0 ${r},${r} v${h - r} z` : '';
    return `<rect class="hit" x="${x}" y="${pt}" width="${bw}" height="${H - pt - pb}" data-tip="${esc(d.tip || d.label + ': ' + fa(d.v))}"/>` +
      (path ? `<path d="${path}" fill="${d.hl ? 'var(--brass)' : o.color || 'var(--accent)'}" opacity="${d.dim ? .45 : 1}"/>` : '') +
      (d.hl && d.v ? `<text x="${cx}" y="${y(d.v) - 6}" text-anchor="middle" style="fill:var(--ink);font-weight:700">${fa(d.v)}</text>` : '') +
      `<text x="${cx}" y="${H - 8}" text-anchor="middle" ${d.hl ? 'style="fill:var(--ink);font-weight:600"' : ''}>${esc(d.label)}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}" style="direction:ltr">${g}<line class="axis" x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}"/>${bars}</svg>`;
}
function lineChart(series, labels, o = {}) {
  const W = o.w || 640, H = o.h || 220, pl = 34, pr = 70, pt = 14, pb = 26;
  const max = Math.max(1, ...series.flatMap(s => s.values)); const step = niceStep(max); const top = Math.ceil(max / step) * step;
  const n = labels.length; const x = i => pl + (W - pl - pr) * (n === 1 ? .5 : i / (n - 1)); const y = v => pt + (H - pt - pb) * (1 - v / top);
  let g = '<g class="grid">'; for (let v = 0; v <= top; v += step) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end">${fa(v)}</text>`; g += '</g>';
  const colW = (W - pl - pr) / Math.max(1, n - 1);
  const hits = labels.map((l, i) => `<rect class="hit" x="${x(i) - colW / 2}" y="${pt}" width="${colW}" height="${H - pt - pb}" data-tip="${esc(l + '\n' + series.map(s => s.name + ': ' + fa(s.values[i])).join('\n'))}"/>`).join('');
  const xl = labels.map((l, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`).join('');
  // end labels, de-collided
  const ends = series.map(s => ({ s, yy: y(s.values[n - 1]) })).sort((a, b) => a.yy - b.yy);
  for (let i = 1; i < ends.length; i++) if (ends[i].yy - ends[i - 1].yy < 13) ends[i].yy = ends[i - 1].yy + 13;
  const lines = series.map(s => `<path d="${s.values.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1)).join('')}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<circle cx="${x(n - 1)}" cy="${y(s.values[n - 1])}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`).join('');
  const lbl = o.endLabels === false ? '' : ends.map(e => `<text x="${x(n - 1) + 9}" y="${e.yy + 4}" style="fill:var(--ink-2)">${fa(e.s.values[n - 1])} ${esc(e.s.short || '')}</text>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}" style="direction:ltr">${g}${hits}<line class="axis" x1="${pl}" x2="${W - pr}" y1="${y(0)}" y2="${y(0)}"/>${lines}${lbl}${xl}</svg>`;
}
function niceStep(max) { const raw = max / 4; const p = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }
function sparkline(vals, o = {}) {
  const W = o.w || 120, H = o.h || 34; const max = Math.max(...vals, 1), min = Math.min(...vals, 0);
  const x = i => 2 + (W - 4) * i / Math.max(1, vals.length - 1), y = v => 3 + (H - 6) * (1 - (v - min) / Math.max(1, max - min));
  const d = vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1)).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="direction:ltr;display:block"><path d="${d} L${x(vals.length - 1)},${H} L${x(0)},${H}z" fill="${o.color || 'var(--accent)'}" opacity=".12"/><path d="${d}" fill="none" stroke="${o.color || 'var(--accent)'}" stroke-width="1.8"/><circle cx="${x(vals.length - 1)}" cy="${y(vals[vals.length - 1])}" r="3" fill="${o.color || 'var(--accent)'}"/></svg>`;
}
