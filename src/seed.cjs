/* Builds the initial HDHS dataset and writes one JSON file per storage document.
   Reference data (hospitals, doctors) comes from the HDHS specification (section 3).
   Patients and clinical activity are clearly-labelled sample records for trying the system. */
const fs = require('fs');
const path = require('path');
const SCHEMA = require('./schema.js');

const BASE = process.env.HDHS_BASE || '2026-09-27';
let seed = 20260927;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const hex = n => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(rnd() * 16)]).join('');
const uuid = () => `${hex(8)}-${hex(4)}-4${hex(3)}-${'89ab'[int(0, 3)]}${hex(3)}-${hex(12)}`;
const d = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)); };
const iso = (dt) => dt.toISOString().slice(0, 10);
const add = (s, n) => { const x = d(s); x.setUTCDate(x.getUTCDate() + n); return iso(x); };
const ts = (s, hm) => `${s}T${hm}:00`;
const U = Date.parse(BASE + 'T08:00:00Z');

const T = {}; for (const k of Object.keys(SCHEMA)) T[k] = [];
const ins = (t, row) => { row.id = row.id || uuid(); row._u = U; if (!('created_at' in row)) row.created_at = ts(BASE, '08:00'); T[t].push(row); return row; };

/* ---------- roles ---------- */
const ROLES = [
  ['superadmin', 'مدیر ارشد سیستم'], ['admin', 'مدیر سیستم'], ['doctor', 'داکتر'], ['nurse', 'نرس / پذیرش'], ['patient', 'بیمار'],
  ['pharmacist', 'فارمسست'], ['lab_tech', 'تکنیشن لابراتوار'], ['chw', 'کارمند صحی جامعه'], ['hospital_manager', 'مدیر شفاخانه'], ['ministry_official', 'مسئول وزارت صحت عامه'],
];
const role = {};
ROLES.forEach(([name, display_name], i) => { role[name] = ins('roles', { id: 'role-' + name, name, display_name, is_system: true, description: null }); });

/* ---------- specializations ---------- */
const SPEC = {
  cardio: ['قلب', 'Cardiology'], internal: ['داخله', 'Internal Medicine'], gyn: ['نسایی و ولادی', 'Obstetrics & Gynecology'],
  peds: ['اطفال', 'Pediatrics'], ortho: ['ارتوپیدی', 'Orthopedics'], surg: ['جراحی عمومی', 'General Surgery'], uro: ['یورولوژی', 'Urology'],
  neuro: ['نوروسایکیاتری', 'Neuropsychiatry'], gastro: ['گوارش', 'Gastroenterology'], dental: ['دندان', 'Dentistry'],
  eye: ['چشم', 'Ophthalmology'], ent: ['گوش، گلو و بینی', 'ENT'], plastic: ['جراحی پلاستیک و سوختگی', 'Plastic & Burn Surgery'],
  sono: ['سونولوژی', 'Sonology'], gp: ['طب عمومی', 'General Practice'], unk: ['تخصص اعلام نشده', 'Not published'],
};
const spec = {};
for (const [k, [name, name_en]] of Object.entries(SPEC)) spec[k] = ins('specializations', { name, name_en, description: null });

/* ---------- hospitals (from spec section 3) ---------- */
const H = {};
H.heart = ins('hospitals', { name: 'شفاخانه قلب هرات', name_en: 'Herat Heart Hospital', type: 'private_hospital', address: 'سرک مجیدی، هرات', district: 'هرات', phone: '0798384000', email: 'info@herathearthospital.af', website: 'herathearthospital.af', gps_lat: 34.3482, gps_lng: 62.2042, services: ['قلب', 'داخله'], working_hours: 'شنبه تا جمعه، ۹:۰۰ صبح تا ۱۱:۵۹ شب', is_emergency: false, status: 'active', note: 'اولین مرکز تخصصی قلب و داخله در افغانستان' });
H.mehraban = ins('hospitals', { name: 'شفاخانه مهربان هرات', name_en: 'Mehraban Hospital', type: 'private_hospital', address: 'بلوار شهید امام مسلم، هرات', district: 'هرات', phone: '+93 799 133 002', email: null, website: 'mehrabanhospital.com', gps_lat: 34.3391, gps_lng: 62.1905, services: ['ارتوپیدی', 'نورولوژی', 'نوروسرجری', 'داخله', 'اطفال', 'دندان'], working_hours: null, is_emergency: false, status: 'active', note: 'اولین ساختمان اختصاصی شفاخانه در هرات' });
H.sadra = ins('hospitals', { name: 'کلینیک صدرا هرات', name_en: 'Sadra Clinic', type: 'clinic', address: 'مرکز شهر هرات', district: 'هرات', phone: '+93 79 825 1989', email: 'info@sadramed.com', website: 'sadramed.com', gps_lat: 34.3445, gps_lng: 62.1998, services: ['داخله', 'اطفال', 'نسایی', 'پوست', 'جراحی زیبایی', 'سوختگی', 'تشخیصیه'], working_hours: null, is_emergency: false, status: 'active', note: null });
H.habibyar = ins('hospitals', { name: 'شفاخانه بین‌المللی حبیب‌یار هرات', name_en: 'Habibyar International Hospital', type: 'private_hospital', address: 'هرات', district: 'هرات', phone: '+93 787 304 000', phone2: '+93 794 137 161', email: null, website: 'habibyarhospital.com', gps_lat: 34.3520, gps_lng: 62.2150, services: ['عاجل ۲۴ ساعته'], working_hours: '۸:۰۰ صبح تا ۴:۰۰ عصر (عاجل ۲۴ ساعته)', is_emergency: true, status: 'active', note: null });
H.regional = ins('hospitals', { name: 'شفاخانه ولایتی هرات', name_en: 'Herat Regional Hospital', type: 'public_hospital', address: 'هرات شهر', district: 'هرات', phone: null, email: null, website: null, gps_lat: 34.3430, gps_lng: 62.1935, services: ['داخله', 'جراحی', 'اطفال', 'نسایی', 'عاجل'], working_hours: '۲۴ ساعته', is_emergency: true, status: 'active', note: 'بزرگترین شفاخانه دولتی هرات' });

/* ---------- departments ---------- */
const DEP = {};
const dep = (h, key, name, code, floor) => { DEP[h + ':' + key] = ins('departments', { hospital_id: H[h].id, name, code, floor, phone: null, head_doctor_id: null }); };
dep('heart', 'cardio', 'بخش قلب', 'CARD', 'منزل اول'); dep('heart', 'internal', 'بخش داخله', 'MED', 'منزل دوم');
dep('mehraban', 'internal', 'داخله', 'MED', 'منزل اول'); dep('mehraban', 'peds', 'اطفال', 'PED', 'منزل دوم'); dep('mehraban', 'surg', 'جراحی', 'SUR', 'منزل سوم'); dep('mehraban', 'gyn', 'نسایی و ولادی', 'OBG', 'منزل دوم'); dep('mehraban', 'dental', 'دندان', 'DEN', 'منزل همکف'); dep('mehraban', 'eye', 'چشم و گوش‌وگلو', 'EYE', 'منزل همکف');
dep('sadra', 'opd', 'بخش سرپایی', 'OPD', 'منزل همکف'); dep('sadra', 'burn', 'سوختگی و پلاستیک', 'BRN', 'منزل اول');
dep('habibyar', 'er', 'عاجل', 'ER', 'منزل همکف'); dep('habibyar', 'ward', 'بستر عمومی', 'GEN', 'منزل اول');
dep('regional', 'er', 'عاجل', 'ER', 'منزل همکف'); dep('regional', 'med', 'داخله', 'MED', 'منزل اول'); dep('regional', 'peds', 'اطفال', 'PED', 'منزل دوم'); dep('regional', 'mat', 'ولادی', 'MAT', 'منزل دوم'); dep('regional', 'icu', 'مراقبت‌های ویژه', 'ICU', 'منزل سوم');

/* ---------- staff users ---------- */
const staff = {};
const mkUser = (o) => ins('users', Object.assign({ national_id: null, first_name_en: null, last_name_en: null, email: null, gender: 'male', date_of_birth: null, blood_type: 'Unknown', language: 'dari', status: 'active', is_verified: true, created_by: null }, o));
staff.admin = mkUser({ first_name: 'مدیر', last_name: 'سیستم', phone: '0700000001', role_id: role.admin.id });
staff.nurse = mkUser({ first_name: 'نرس', last_name: 'پذیرش', phone: '0700000002', role_id: role.nurse.id, gender: 'female' });
staff.pharm = mkUser({ first_name: 'فارمسست', last_name: 'دواخانه', phone: '0700000003', role_id: role.pharmacist.id });
staff.lab = mkUser({ first_name: 'تکنیشن', last_name: 'لابراتوار', phone: '0700000004', role_id: role.lab_tech.id });
staff.chw = mkUser({ first_name: 'کارمند صحی', last_name: 'جامعه', phone: '0700000005', role_id: role.chw.id, gender: 'female' });
staff.mph = mkUser({ first_name: 'مسئول', last_name: 'صحت عامه', phone: '0700000006', role_id: role.ministry_official.id });

/* ---------- doctors (from spec, section 3 A1–A4) ---------- */
const DOCS = [
  ['heart', 'Abdul Khaliq Monib', 'عبدالخالق', 'منیب', 'cardio', 'm', 'متخصص قلب و انترونشنال (Interventional Cardiologist & EP)'],
  ['heart', 'Haroon Halimyar', 'هارون', 'حلیم‌یار', 'internal', 'm', 'داخله عمومی'],
  ['heart', 'Mohammad Saleh Saljuqi', 'محمد صالح', 'سلجوقی', 'gp', 'm', 'MD — طبیب عمومی'],
  ['heart', 'Gulbaddin Noorzai', 'گلبدین', 'نورزی', 'internal', 'm', 'داخله عمومی'],
  ['mehraban', 'Abdul Qader Amani', 'عبدالقادر', 'امانی', 'cardio', 'm', 'متخصص قلب انترونشنال'],
  ['mehraban', 'Abdul Qodus Haidarian', 'عبدالقدوس', 'حیدریان', 'internal', 'm', 'متخصص داخله'],
  ['mehraban', 'Ahmad Farhad Fahim', 'احمد فرهاد', 'فهیم', 'surg', 'm', 'متخصص جراحی عمومی'],
  ['mehraban', 'Nazifa Hashem', 'نظیفه', 'هاشم', 'gyn', 'f', 'نسایی و ولادی'],
  ['mehraban', 'Khaja Abdul Samad Hekmat', 'خواجه عبدالصمد', 'حکمت', 'uro', 'm', 'متخصص یورولوژی و جراح'],
  ['mehraban', 'Ghulam Nabi Quraishi', 'غلام نبی', 'قریشی', 'peds', 'm', 'متخصص اطفال'],
  ['mehraban', 'Farid Ahmad Radfar', 'فرید احمد', 'رادفر', 'peds', 'm', 'متخصص اطفال'],
  ['mehraban', 'Aarash Taaj', 'آرش', 'تاج', 'neuro', 'm', 'متخصص نوروسایکیاتری'],
  ['mehraban', 'Naser Ahmad Mohammadi', 'ناصر احمد', 'محمدی', 'gastro', 'm', 'متخصص گوارش'],
  ['mehraban', 'Nasir Ahmad Barati', 'نصیر احمد', 'براتی', 'peds', 'm', 'اطفال'],
  ['mehraban', 'Omid Aslami', 'امید', 'اسلامی', 'dental', 'm', 'جراح دندان'],
  ['mehraban', 'Tamana Noor', 'تمنا', 'نور', 'dental', 'f', 'دندان'],
  ['mehraban', 'Frangis Qazizada', 'فرنگیس', 'قاضی‌زاده', 'dental', 'f', 'دندان'],
  ['mehraban', 'Mohammad Qasem Rahimi', 'محمد قاسم', 'رحیمی', 'sono', 'm', 'سونوگرافی'],
  ['mehraban', 'Hamayoon Amani', 'همایون', 'امانی', 'internal', 'm', 'متخصص داخله'],
  ['mehraban', 'Dost Mohammad Zaki', 'دوست محمد', 'زکی', 'internal', 'm', 'متخصص داخله'],
  ['mehraban', 'Homayoon Rahmanpoor', 'همایون', 'رحمان‌پور', 'eye', 'm', 'اپتومتریست'],
  ['mehraban', 'Saeid Torabi', 'سعید', 'ترابی', 'eye', 'm', 'متخصص چشم'],
  ['mehraban', 'Mohammad Ajmal Sarwari', 'محمد اجمل', 'سروری', 'ent', 'm', 'متخصص گوش، گلو و بینی'],
  ['mehraban', 'Abdul Sami Azimi', 'عبدالسمیع', 'عظیمی', 'ortho', 'm', 'متخصص ارتوپیدی'],
  ['sadra', 'Razia Nazami', 'راضیه', 'نظامی', 'gp', 'f', 'طبیب عمومی'],
  ['sadra', 'Khatera Rahmani', 'خاطره', 'رحمانی', 'gyn', 'f', 'متخصص نسایی و ولادی'],
  ['sadra', 'Din Mohammad Rahmani', 'دین محمد', 'رحمانی', 'ortho', 'm', 'متخصص ارتوپیدی'],
  ['sadra', 'Mohammad Younas Ghafori', 'محمد یونس', 'غفوری', 'plastic', 'm', 'جراحی پلاستیک، سوختگی و پوست'],
  ['sadra', 'Abdul Wasee Asem Haidari', 'عبدالواسع عاصم', 'حیدری', 'plastic', 'm', 'جراح پلاستیک و سوختگی'],
  ['sadra', 'Ehsan Allah Islami', 'احسان‌الله', 'اسلامی', 'gp', 'm', 'طبیب عمومی'],
  ['habibyar', 'Behrouz Daneshmand', 'بهروز', 'دانشمند', 'unk', 'm', 'تخصص در وب‌سایت اعلام نشده'],
  ['habibyar', 'Faiz Ahmad Fayez', 'فیض احمد', 'فایض', 'unk', 'm', 'تخصص در وب‌سایت اعلام نشده'],
];
const doctors = [];
let dphone = 0;
for (const [h, en, fn, ln, sk, g, sub] of DOCS) {
  const [fe, ...le] = en.split(' ');
  const u = mkUser({ first_name: fn, last_name: ln, first_name_en: en.split(' ').slice(0, -1).join(' '), last_name_en: en.split(' ').slice(-1)[0], phone: null, role_id: role.doctor.id, gender: g === 'f' ? 'female' : 'male' });
  const doc = ins('doctors', { user_id: u.id, license_number: null, specialization_id: spec[sk].id, sub_specialization: sub, hospital_id: H[h].id, experience_years: null, qualification: null, consultation_fee: null, online_fee: null, bio: null, available_online: false, languages: ['dari'], avg_rating: null, total_reviews: 0, status: 'active', source: 'spec' });
  doctors.push({ doc, h, sk, g });
  // availability: Sat–Thu (JS day 6,0,1,2,3,4), Fridays off
  for (const dow of [6, 0, 1, 2, 3, 4]) ins('doctor_availability', { doctor_id: doc.id, hospital_id: H[h].id, day_of_week: dow, start_time: h === 'heart' ? '09:00' : '08:00', end_time: h === 'heart' ? '15:00' : '14:00', slot_duration: 15, max_patients: 24, is_online: false, is_active: true });
}
const D = (en) => doctors.find(x => x.doc && DOCS[doctors.indexOf(x)][1] === en).doc;
T.departments.find(x => x.id === DEP['heart:cardio'].id).head_doctor_id = D('Abdul Khaliq Monib').id;
T.departments.find(x => x.id === DEP['mehraban:peds'].id).head_doctor_id = D('Ghulam Nabi Quraishi').id;

/* ---------- sample patients ---------- */
const PAT = [
  ['احمد', 'علی‌زاده', 'male', '1968-03-12', 'B+', 'هرات', 'جبرئیل', [{ drug: 'Penicillin', reaction: 'کهیر شدید' }], ['دیابت نوع ۲', 'فشار خون بلند']],
  ['فریده', 'احمدی', 'female', '1997-05-20', 'O+', 'انجیل', 'قریه سیاوشان', [], []],
  ['محمد نبی', 'رحیمی', 'male', '1955-11-02', 'A+', 'هرات', 'ناحیه ۸', [], ['نارسایی قلبی', 'فشار خون بلند']],
  ['زهرا', 'حسینی', 'female', '2001-01-15', 'AB+', 'گذره', 'قریه روضه باغ', [{ drug: 'Sulfonamide', reaction: 'بثورات جلدی' }], []],
  ['گل‌احمد', 'نوری', 'male', '1979-07-30', 'O-', 'کرخ', 'مرکز ولسوالی', [], ['توبرکلوز ریوی (تحت درمان)']],
  ['مریم', 'صدیقی', 'female', '1990-09-09', 'A-', 'هرات', 'ناحیه ۶', [], ['آسم']],
  ['عبدالرحیم', 'کریمی', 'male', '1982-02-18', 'B-', 'شیندند', 'مرکز ولسوالی', [], []],
  ['نرگس', 'یوسفی', 'female', '1994-12-01', 'O+', 'زنده‌جان', 'قریه کوشک', [], ['کم‌خونی فقر آهن']],
  ['سید احمد', 'هاشمی', 'male', '1961-06-25', 'A+', 'هرات', 'ناحیه ۲', [{ drug: 'Aspirin', reaction: 'خونریزی معده' }], ['بیماری کرونری قلب']],
  ['شکیلا', 'رسولی', 'female', '1988-04-04', 'B+', 'پشتون زرغون', 'مرکز ولسوالی', [], ['لیشمانیا جلدی']],
  ['حمیدالله', 'فراهی', 'male', '2003-10-10', 'O+', 'غوریان', 'مرکز ولسوالی', [], []],
  ['لیلما', 'ستانکزی', 'female', '1999-08-14', 'AB-', 'هرات', 'ناحیه ۱۰', [], []],
  ['نوید', 'اکبری', 'male', '2024-05-02', 'O+', 'هرات', 'ناحیه ۸', [], []],
  ['آیدا', 'نوری', 'female', '2025-11-20', 'Unknown', 'کرخ', 'مرکز ولسوالی', [], []],
  ['یحیی', 'رحیمی', 'male', '2025-03-08', 'A+', 'انجیل', 'قریه سیاوشان', [], ['سوء تغذیه']],
  ['صالحه', 'محمدی', 'female', '1975-03-03', 'A+', 'کهسان', 'مرکز ولسوالی', [], ['فشار خون بلند']],
  ['فرهاد', 'جامی', 'male', '1971-12-22', 'B+', 'هرات', 'ناحیه ۴', [], ['دیابت نوع ۲']],
  ['روح‌الله', 'اسحاقزی', 'male', '1993-09-17', 'O+', 'اوبه', 'مرکز ولسوالی', [], []],
];
const patients = [];
PAT.forEach(([fn, ln, g, dob, bt, dist, village, allergies, chronic], i) => {
  const u = mkUser({ first_name: fn, last_name: ln, gender: g, date_of_birth: dob, blood_type: bt, phone: '07' + String(int(90, 99)) + String(int(1000000, 9999999)), national_id: `1${int(390, 404)}-${String(int(1000, 9999))}-${String(int(10000, 99999))}`, role_id: role.patient.id });
  const p = ins('patients', { user_id: u.id, mrn: 'HRT-' + String(100100 + i * 37), address: null, province: 'هرات', district: dist, village, gps_lat: null, gps_lng: null, marital_status: (+dob.slice(0, 4) < 2005) ? (i % 3 ? 'married' : 'single') : 'single', occupation: null, education_level: null, emergency_contact: null, emergency_phone: null, emergency_relation: null, allergies, chronic_conditions: chronic, insurance_id: null, registered_at: ts(add(BASE, -int(20, 400)), '09:00'), sample: true });
  patients.push({ p, u });
});
const P = i => patients[i].p;

/* ---------- mother/child links ---------- */
const ch1 = ins('child_health', { patient_id: P(12).id, mother_id: P(1).id, birth_weight_gm: 3100, birth_height_cm: 49.5, birth_place: 'شفاخانه ولایتی هرات', is_breastfed: true, delivery_complications: null });
const ch2 = ins('child_health', { patient_id: P(13).id, mother_id: null, birth_weight_gm: 2600, birth_height_cm: 47, birth_place: 'منزل', is_breastfed: true, delivery_complications: null });
const ch3 = ins('child_health', { patient_id: P(14).id, mother_id: null, birth_weight_gm: 2400, birth_height_cm: 46, birth_place: 'کلینیک صحی انجیل', is_breastfed: false, delivery_complications: 'ولادت قبل از وقت' });
const growth = [[ch1, '2026-06-15', 25, 12.1, 84, 14.4], [ch1, '2026-09-10', 28, 12.6, 87, 14.6], [ch2, '2026-08-01', 8, 7.4, 67, 13.0], [ch2, '2026-09-20', 10, 7.9, 70, 12.9], [ch3, '2026-07-20', 16, 7.6, 74, 11.9], [ch3, '2026-09-18', 18, 7.5, 75, 11.2]];
for (const [c, dt, age, w, h, muac] of growth) ins('growth_monitoring', { child_id: c.id, measurement_date: dt, age_months: age, weight_kg: w, height_cm: h, muac_cm: muac, nutritional_status: muac < 11.5 ? 'SAM' : muac < 12.5 ? 'MAM' : 'normal', oedema: false, recorded_by: staff.chw.id, notes: null });

/* vaccinations (EPI) */
const vac = (pi, code, dose, date, name) => ins('vaccinations', { patient_id: P(pi).id, vaccine_name: name, vaccine_code: code, dose_number: dose, batch_number: 'B' + int(10000, 99999), date_given: date, next_dose_date: null, given_by: staff.nurse.id, hospital_id: H.regional.id, site: null, adverse_reaction: null, notes: null });
// Navid (born 2024-05-02) complete up to MR1
[['BCG', 1, '2024-05-02', 'BCG'], ['OPV', 0, '2024-05-02', 'پولیو خوراکی'], ['HEPB', 0, '2024-05-02', 'هپاتیت B ولادی'], ['OPV', 1, '2024-06-14', 'پولیو خوراکی'], ['PENTA', 1, '2024-06-14', 'پنتاوالان'], ['PCV', 1, '2024-06-14', 'PCV'], ['ROTA', 1, '2024-06-14', 'روتاویروس'], ['OPV', 2, '2024-07-12', 'پولیو خوراکی'], ['PENTA', 2, '2024-07-12', 'پنتاوالان'], ['PCV', 2, '2024-07-12', 'PCV'], ['ROTA', 2, '2024-07-12', 'روتاویروس'], ['OPV', 3, '2024-08-09', 'پولیو خوراکی'], ['PENTA', 3, '2024-08-09', 'پنتاوالان'], ['PCV', 3, '2024-08-09', 'PCV'], ['IPV', 1, '2024-08-09', 'پولیو زرقی'], ['MR', 1, '2025-02-03', 'سرخکان-روبیلا']].forEach(([c, n, dt, nm]) => vac(12, c, n, dt, nm));
// Aida (born 2025-11-20): birth doses only -> 6w, 10w due
[['BCG', 1, '2025-11-21', 'BCG'], ['OPV', 0, '2025-11-21', 'پولیو خوراکی'], ['HEPB', 0, '2025-11-21', 'هپاتیت B ولادی'], ['OPV', 1, '2026-01-05', 'پولیو خوراکی'], ['PENTA', 1, '2026-01-05', 'پنتاوالان'], ['PCV', 1, '2026-01-05', 'PCV'], ['ROTA', 1, '2026-01-05', 'روتاویروس']].forEach(([c, n, dt, nm]) => vac(13, c, n, dt, nm));
// Yahya (born 2025-03-08): partial
[['BCG', 1, '2025-03-09', 'BCG'], ['OPV', 0, '2025-03-09', 'پولیو خوراکی'], ['OPV', 1, '2025-04-22', 'پولیو خوراکی'], ['PENTA', 1, '2025-04-22', 'پنتاوالان']].forEach(([c, n, dt, nm]) => vac(14, c, n, dt, nm));
// TT for pregnant women
vac(1, 'TT', 1, '2026-07-02', 'توکسوئید تیتانوس'); vac(7, 'TT', 1, '2026-08-11', 'توکسوئید تیتانوس');

/* maternal health */
const m1 = ins('maternal_health', { patient_id: P(1).id, lmp_date: '2026-03-10', edd_date: '2026-12-15', gravida: 2, para: 1, abortion_count: 0, status: 'active', risk_level: 'low', delivery_date: null, delivery_type: null, delivery_place: null, baby_id: null, notes: null });
const m2 = ins('maternal_health', { patient_id: P(7).id, lmp_date: '2026-05-01', edd_date: '2027-02-05', gravida: 4, para: 3, abortion_count: 0, status: 'active', risk_level: 'high', delivery_date: null, delivery_type: null, delivery_place: null, baby_id: null, notes: 'کم‌خونی؛ فاصله کم بین حاملگی‌ها' });
const m3 = ins('maternal_health', { patient_id: P(11).id, lmp_date: '2026-01-22', edd_date: '2026-10-29', gravida: 1, para: 0, abortion_count: 0, status: 'active', risk_level: 'moderate', delivery_date: null, delivery_type: null, delivery_place: null, baby_id: null, notes: 'فشار خون مرزی در ویزیت آخر' });
const nazifa = D('Nazifa Hashem'), khatera = D('Khatera Rahmani');
const anc = (m, n, dt, ga, doc, w, s, di, fhr, fh, next) => ins('anc_visits', { maternal_id: m.id, visit_number: n, visit_date: dt, weeks_of_gestation: ga, doctor_id: doc.id, weight_kg: w, bp_systolic: s, bp_diastolic: di, fetal_heart_rate: fhr, fundal_height: fh, fetal_presentation: ga > 32 ? 'سفالیک' : null, iron_given: true, folate_given: true, tt_vaccine_given: n === 1, risk_factors: [], notes: null, next_visit_date: next });
anc(m1, 1, '2026-05-20', 10, nazifa, 58, 110, 70, null, null, '2026-07-02'); anc(m1, 2, '2026-07-02', 16, nazifa, 60, 112, 72, 148, 16, '2026-08-27'); anc(m1, 3, '2026-08-27', 24, nazifa, 63, 115, 75, 144, 24, '2026-10-08');
anc(m2, 1, '2026-08-11', 14, khatera, 51, 104, 66, null, 13, '2026-09-22');
anc(m3, 1, '2026-04-15', 12, khatera, 55, 118, 76, null, null, '2026-06-10'); anc(m3, 2, '2026-06-10', 20, khatera, 57, 126, 82, 150, 20, '2026-08-05'); anc(m3, 3, '2026-08-05', 28, khatera, 60, 134, 88, 146, 28, '2026-09-16'); anc(m3, 4, '2026-09-16', 34, khatera, 62, 138, 90, 142, 33, '2026-09-30');

/* ---------- medicines (WHO essential list subset) ---------- */
const MED = {};
const med = (k, generic, brands, cls, forms, strengths, controlled = false, essential = true) => { MED[k] = ins('medicines', { generic_name: generic, brand_names: brands, drug_class: cls, category: cls, dosage_forms: forms, strengths, description: null, contraindications: null, side_effects: null, storage: null, is_controlled: controlled, is_essential: essential, status: 'active' }); };
med('para', 'Paracetamol', ['Panadol', 'Calpol'], 'Analgesic', ['tablet', 'syrup'], ['500mg', '120mg/5ml']);
med('ibu', 'Ibuprofen', ['Brufen'], 'NSAID', ['tablet', 'syrup'], ['400mg', '100mg/5ml']);
med('amox', 'Amoxicillin', ['Amoxil'], 'Penicillin', ['capsule', 'syrup'], ['500mg', '250mg/5ml']);
med('coamox', 'Amoxicillin + Clavulanic acid', ['Augmentin'], 'Penicillin', ['tablet'], ['625mg']);
med('azi', 'Azithromycin', ['Zithromax'], 'Macrolide', ['tablet', 'syrup'], ['500mg', '200mg/5ml']);
med('cipro', 'Ciprofloxacin', ['Cipro'], 'Fluoroquinolone', ['tablet'], ['500mg']);
med('metro', 'Metronidazole', ['Flagyl'], 'Nitroimidazole', ['tablet'], ['400mg']);
med('cotri', 'Co-trimoxazole', ['Bactrim'], 'Sulfonamide', ['tablet'], ['480mg']);
med('ors', 'Oral Rehydration Salts', ['ORS'], 'Rehydration', ['sachet'], ['20.5g/L']);
med('zinc', 'Zinc sulfate', [], 'Mineral', ['dispersible tablet'], ['20mg']);
med('metf', 'Metformin', ['Glucophage'], 'Biguanide', ['tablet'], ['500mg']);
med('glib', 'Glibenclamide', ['Daonil'], 'Sulfonylurea', ['tablet'], ['5mg']);
med('insulin', 'Insulin (Regular)', ['Actrapid'], 'Insulin', ['injection'], ['100IU/ml']);
med('amlo', 'Amlodipine', ['Norvasc'], 'Calcium channel blocker', ['tablet'], ['5mg']);
med('enal', 'Enalapril', ['Renitec'], 'ACE inhibitor', ['tablet'], ['10mg']);
med('ator', 'Atorvastatin', ['Lipitor'], 'Statin', ['tablet'], ['20mg']);
med('asa', 'Aspirin', ['Aspro'], 'Antiplatelet', ['tablet'], ['75mg']);
med('clop', 'Clopidogrel', ['Plavix'], 'Antiplatelet', ['tablet'], ['75mg']);
med('warf', 'Warfarin', ['Coumadin'], 'Anticoagulant', ['tablet'], ['5mg']);
med('furo', 'Furosemide', ['Lasix'], 'Diuretic', ['tablet'], ['40mg']);
med('omep', 'Omeprazole', ['Losec'], 'Proton pump inhibitor', ['capsule'], ['20mg']);
med('salb', 'Salbutamol', ['Ventolin'], 'Bronchodilator', ['inhaler'], ['100mcg/dose']);
med('fefol', 'Ferrous sulfate + Folic acid', [], 'Iron supplement', ['tablet'], ['200mg+0.4mg']);
med('al', 'Artemether + Lumefantrine', ['Coartem'], 'Antimalarial', ['tablet'], ['20mg+120mg']);
med('glucan', 'Meglumine antimoniate', ['Glucantime'], 'Antileishmanial', ['injection'], ['1.5g/5ml']);
med('rhze', 'Rifampicin + Isoniazid + Pyrazinamide + Ethambutol', ['RHZE FDC'], 'Anti-TB', ['tablet'], ['150/75/400/275mg']);
med('ceftri', 'Ceftriaxone', ['Rocephin'], 'Cephalosporin', ['injection'], ['1g']);
med('mgso4', 'Magnesium sulfate', [], 'Anticonvulsant', ['injection'], ['50%']);
med('oxy', 'Oxytocin', ['Syntocinon'], 'Uterotonic', ['injection'], ['10IU']);
med('rutf', 'RUTF (Ready-to-use therapeutic food)', ['Plumpy\'Nut'], 'Therapeutic food', ['sachet'], ['92g']);
med('diaz', 'Diazepam', ['Valium'], 'Benzodiazepine', ['tablet', 'injection'], ['5mg', '10mg/2ml'], true);
med('tram', 'Tramadol', ['Tramal'], 'Opioid analgesic', ['capsule'], ['50mg'], true);

const DI = [
  ['warf', 'asa', 'major', 'خطر خونریزی به‌طور قابل ملاحظه بالا می‌رود.', 'از ترکیب اجتناب شود؛ در صورت ضرورت INR و علائم خونریزی پایش شود.'],
  ['warf', 'ibu', 'major', 'NSAID ها خطر خونریزی معده را همراه وارفارین بالا می‌برند.', 'پاراسیتامول جایگزین شود.'],
  ['warf', 'metro', 'major', 'مترونیدازول متابولیزم وارفارین را کم و INR را بالا می‌برد.', 'دوز وارفارین کاهش یابد و INR کنترل شود.'],
  ['warf', 'cipro', 'moderate', 'سیپروفلوکساسین اثر وارفارین را افزایش می‌دهد.', 'INR در هفته اول پایش شود.'],
  ['clop', 'omep', 'moderate', 'اومپرازول فعال‌شدن کلوپیدوگرل را کم می‌کند.', 'از پنتوپرازول یا داروی دیگر استفاده شود.'],
  ['asa', 'ibu', 'moderate', 'ایبوپروفن اثر محافظتی قلبی اسپرین را کاهش می‌دهد.', 'ایبوپروفن حداقل ۸ ساعت پیش یا ۳۰ دقیقه بعد از اسپرین داده شود.'],
  ['enal', 'ibu', 'moderate', 'NSAID اثر ضد فشار را کم و خطر آسیب کلیوی را بالا می‌برد.', 'فشار خون و کریاتینین پایش شود.'],
  ['tram', 'diaz', 'major', 'تضعیف شدید سیستم عصبی و تنفسی.', 'از ترکیب اجتناب شود.'],
  ['glib', 'cipro', 'moderate', 'خطر هیپوگلایسمی یا هایپرگلایسمی.', 'قند خون از نزدیک پایش شود.'],
  ['cipro', 'zinc', 'minor', 'جذب سیپروفلوکساسین با زینک کم می‌شود.', 'سیپروفلوکساسین ۲ ساعت قبل از زینک داده شود.'],
  ['furo', 'enal', 'minor', 'خطر افت فشار دوز اول.', 'دوز اول انالاپریل هنگام خواب داده شود.'],
];
for (const [a, b, severity, description, management] of DI) ins('drug_interactions', { drug1_id: MED[a].id, drug2_id: MED[b].id, severity, description, mechanism: null, management, evidence_level: 'B' });

/* ---------- pharmacies & inventory ---------- */
const PH = {};
PH.regional = ins('pharmacies', { name: 'دواخانه شفاخانه ولایتی', license_number: 'PH-HRT-001', address: 'داخل شفاخانه ولایتی هرات', district: 'هرات', phone: null, hospital_id: H.regional.id, is_open_24h: true, delivery_available: false, status: 'active' });
PH.mehraban = ins('pharmacies', { name: 'دواخانه مهربان', license_number: 'PH-HRT-002', address: 'بلوار شهید امام مسلم', district: 'هرات', phone: null, hospital_id: H.mehraban.id, is_open_24h: false, delivery_available: true, status: 'active' });
PH.city = ins('pharmacies', { name: 'دواخانه مرکز شهر', license_number: 'PH-HRT-003', address: 'چهارسوق، هرات', district: 'هرات', phone: null, hospital_id: null, is_open_24h: false, delivery_available: true, status: 'active' });
const inv = (ph, m, qty, exp, price, min = 20) => ins('pharmacy_inventory', { pharmacy_id: PH[ph].id, medicine_id: MED[m].id, batch_number: 'LOT-' + int(10000, 99999), quantity: qty, unit_price: price, selling_price: Math.round(price * 1.25), manufacture_date: add(exp, -730), expiry_date: exp, supplier_id: null, min_stock_level: min, updated_at: ts(BASE, '08:00') });
inv('regional', 'para', 1200, '2027-08-01', 2); inv('regional', 'para', 300, '2026-11-15', 2);
inv('regional', 'amox', 640, '2027-03-01', 6); inv('regional', 'ors', 900, '2027-12-01', 8); inv('regional', 'zinc', 450, '2027-06-01', 3);
inv('regional', 'metf', 800, '2027-10-01', 3); inv('regional', 'amlo', 400, '2027-05-01', 4); inv('regional', 'fefol', 1000, '2027-09-01', 1);
inv('regional', 'ceftri', 12, '2027-01-10', 45); inv('regional', 'oxy', 60, '2026-10-20', 30, 30); inv('regional', 'mgso4', 40, '2027-04-01', 55);
inv('regional', 'rutf', 18, '2027-02-01', 25, 50); inv('regional', 'al', 150, '2027-01-01', 35); inv('regional', 'rhze', 280, '2027-07-01', 12);
inv('regional', 'glucan', 35, '2026-12-01', 180, 20); inv('regional', 'insulin', 25, '2026-12-20', 320, 10);
inv('mehraban', 'para', 500, '2027-06-01', 3); inv('mehraban', 'ibu', 300, '2027-04-01', 4); inv('mehraban', 'coamox', 140, '2027-02-01', 22);
inv('mehraban', 'azi', 90, '2026-10-30', 25); inv('mehraban', 'omep', 260, '2027-08-01', 5); inv('mehraban', 'ator', 180, '2027-09-01', 9);
inv('mehraban', 'clop', 8, '2027-03-01', 14); inv('mehraban', 'enal', 220, '2027-05-01', 4); inv('mehraban', 'salb', 30, '2027-01-01', 160, 10);
inv('city', 'para', 900, '2027-09-01', 2); inv('city', 'cipro', 200, '2027-02-01', 9); inv('city', 'metro', 350, '2027-03-01', 3); inv('city', 'furo', 160, '2027-06-01', 3);

/* ---------- laboratories & tests ---------- */
const LAB = {};
LAB.regional = ins('laboratories', { name: 'لابراتوار شفاخانه ولایتی', hospital_id: H.regional.id, address: null, district: 'هرات', phone: null, accredited: true });
LAB.mehraban = ins('laboratories', { name: 'لابراتوار مهربان', hospital_id: H.mehraban.id, address: null, district: 'هرات', phone: null, accredited: false });
LAB.heart = ins('laboratories', { name: 'لابراتوار شفاخانه قلب', hospital_id: H.heart.id, address: null, district: 'هرات', phone: null, accredited: false });
const TEST = {};
const test = (code, name, cat, unit, sample, m, f, c, crit, price, tat) => { TEST[code] = ins('lab_tests', { code, name, category: cat, unit, sample_type: sample, ranges: { m, f, c }, critical: crit, normal_range_male: m ? m.join('–') : null, normal_range_female: f ? f.join('–') : null, normal_range_child: c ? c.join('–') : null, qualitative: !m, turnaround_hours: tat, price, description: null }); };
test('HB', 'هیموگلوبین', 'هماتولوژی', 'g/dL', 'خون', [13.5, 17.5], [12, 15.5], [11, 14], [7, 20], 80, 2);
test('WBC', 'شمار کریوات سفید', 'هماتولوژی', '×10³/µL', 'خون', [4, 11], [4, 11], [5, 15], [2, 30], 80, 2);
test('PLT', 'پلاکت', 'هماتولوژی', '×10³/µL', 'خون', [150, 450], [150, 450], [150, 450], [50, 1000], 80, 2);
test('ESR', 'ESR', 'هماتولوژی', 'mm/hr', 'خون', [0, 15], [0, 20], [0, 10], null, 60, 2);
test('FBS', 'قند خون ناشتا', 'بیوشیمی', 'mg/dL', 'خون', [70, 100], [70, 100], [60, 100], [50, 400], 70, 1);
test('HBA1C', 'HbA1c', 'بیوشیمی', '%', 'خون', [4, 5.6], [4, 5.6], [4, 5.6], null, 350, 24);
test('CREAT', 'کریاتینین', 'بیوشیمی', 'mg/dL', 'خون', [0.7, 1.3], [0.6, 1.1], [0.3, 0.7], [null, 5], 120, 4);
test('UREA', 'یوریا', 'بیوشیمی', 'mg/dL', 'خون', [15, 45], [15, 45], [10, 40], [null, 200], 100, 4);
test('ALT', 'ALT', 'بیوشیمی', 'U/L', 'خون', [7, 56], [7, 45], [5, 45], null, 120, 4);
test('K', 'پتاشیم', 'الکترولایت', 'mmol/L', 'خون', [3.5, 5.1], [3.5, 5.1], [3.5, 5.5], [2.8, 6.2], 150, 2);
test('NA', 'سودیم', 'الکترولایت', 'mmol/L', 'خون', [135, 145], [135, 145], [135, 145], [120, 160], 150, 2);
test('TROP', 'تروپونین I', 'قلب', 'ng/mL', 'خون', [0, 0.04], [0, 0.04], [0, 0.04], [null, 0.4], 900, 1);
test('TCHOL', 'کولسترول تام', 'بیوشیمی', 'mg/dL', 'خون', [0, 200], [0, 200], [0, 170], null, 150, 4);
test('MRDT', 'تست سریع ملاریا', 'میکروبیولوژی', null, 'خون', null, null, null, null, 120, 1);
test('HBSAG', 'HBsAg', 'سیرولوژی', null, 'خون', null, null, null, null, 250, 4);
test('SPUTUM', 'AFB بلغم', 'میکروبیولوژی', null, 'بلغم', null, null, null, null, 100, 48);

/* ---------- clinical activity (sample) ---------- */
let seq = 1;
const no = (pre, dt) => `${pre}-${dt.replace(/-/g, '').slice(2)}-${String(seq++).padStart(4, '0')}`;
const docOf = en => D(en);
const APPTS = [];
const appt = (pi, en, h, date, time, status, type = 'in_person', priority = 'normal', reason = null) => {
  const doc = docOf(en);
  const a = ins('appointments', { appointment_no: no('APT', date), patient_id: P(pi).id, doctor_id: doc.id, hospital_id: H[h].id, department_id: null, appointment_date: date, appointment_time: time, duration_minutes: 15, type, status, priority, reason, notes: null, cancelled_by: null, cancel_reason: status === 'cancelled' ? 'درخواست بیمار' : null, reminder_sent: true, created_at: ts(add(date, -3), '10:00') });
  APPTS.push(a); return a;
};
// past completed visits (with records)
const past = [
  [0, 'Haroon Halimyar', 'heart', add(BASE, -6), '09:30', 'تعقیب دیابت و فشار خون'],
  [2, 'Abdul Khaliq Monib', 'heart', add(BASE, -5), '10:00', 'نفس‌تنگی هنگام فعالیت'],
  [4, 'Abdul Qodus Haidarian', 'mehraban', add(BASE, -4), '08:45', 'تعقیب درمان توبرکلوز'],
  [9, 'Mohammad Younas Ghafori', 'sadra', add(BASE, -3), '11:00', 'زخم جلدی روی دست'],
  [14, 'Ghulam Nabi Quraishi', 'mehraban', add(BASE, -2), '09:15', 'اسهال و کاهش وزن'],
  [8, 'Abdul Qader Amani', 'mehraban', add(BASE, -2), '10:30', 'درد سینه'],
  [16, 'Hamayoon Amani', 'mehraban', add(BASE, -1), '08:30', 'تعقیب دیابت'],
  [5, 'Razia Nazami', 'sadra', add(BASE, -1), '12:00', 'سرفه و تب'],
];
const pastA = past.map(([pi, en, h, dt, tm, r]) => appt(pi, en, h, dt, tm, 'completed', 'in_person', 'normal', r));
appt(6, 'Abdul Sami Azimi', 'mehraban', add(BASE, -3), '10:15', 'no_show', 'in_person', 'normal', 'درد کمر');
appt(10, 'Mohammad Ajmal Sarwari', 'mehraban', add(BASE, -2), '11:30', 'cancelled', 'in_person', 'normal', 'درد گوش');
// earlier week volume
const volume = [[-7, 3], [-6, 4], [-5, 5], [-4, 4], [-3, 6], [-2, 5], [-1, 4]];
const vDocs = ['Razia Nazami', 'Ehsan Allah Islami', 'Hamayoon Amani', 'Dost Mohammad Zaki', 'Nasir Ahmad Barati', 'Farid Ahmad Radfar', 'Saeid Torabi', 'Omid Aslami'];
const vHosp = { 'Razia Nazami': 'sadra', 'Ehsan Allah Islami': 'sadra' };
for (const [off, n] of volume) for (let k = 0; k < n; k++) { const en = vDocs[(k + off + 8) % vDocs.length]; appt(int(0, 17), en, vHosp[en] || 'mehraban', add(BASE, off), `${String(10 + (k % 2))}:${['00', '15', '30', '45'][k % 4]}`, 'completed', 'in_person', 'normal', null); }
// today
appt(0, 'Haroon Halimyar', 'heart', BASE, '09:00', 'checked_in', 'in_person', 'normal', 'نتیجه آزمایش HbA1c');
appt(15, 'Gulbaddin Noorzai', 'heart', BASE, '09:15', 'checked_in', 'in_person', 'urgent', 'سردردی و فشار بلند');
appt(3, 'Nazifa Hashem', 'mehraban', BASE, '08:30', 'in_progress', 'in_person', 'normal', 'درد زیر شکم');
appt(17, 'Abdul Sami Azimi', 'mehraban', BASE, '10:00', 'confirmed', 'in_person', 'normal', 'درد زانو بعد از افتادن');
appt(11, 'Khatera Rahmani', 'sadra', BASE, '10:30', 'confirmed', 'in_person', 'normal', 'ویزیت ANC');
appt(13, 'Ghulam Nabi Quraishi', 'mehraban', BASE, '11:00', 'pending', 'in_person', 'normal', 'واکسین و معاینه طفل');
appt(12, 'Farid Ahmad Radfar', 'mehraban', BASE, '11:15', 'confirmed', 'in_person', 'normal', 'تب');
appt(6, 'Dost Mohammad Zaki', 'mehraban', BASE, '12:00', 'pending', 'telemedicine_video', 'normal', 'مشوره آنلاین');
// upcoming
const up = [[1, 'Nazifa Hashem', 'mehraban', 1, '09:00'], [2, 'Abdul Khaliq Monib', 'heart', 2, '10:00'], [7, 'Khatera Rahmani', 'sadra', 2, '11:00'], [9, 'Mohammad Younas Ghafori', 'sadra', 3, '09:30'], [4, 'Abdul Qodus Haidarian', 'mehraban', 4, '08:30'], [16, 'Hamayoon Amani', 'mehraban', 5, '09:45'], [10, 'Mohammad Ajmal Sarwari', 'mehraban', 6, '10:15'], [5, 'Razia Nazami', 'sadra', 7, '12:30']];
for (const [pi, en, h, off, tm] of up) appt(pi, en, h, add(BASE, off), tm, off < 3 ? 'confirmed' : 'pending', 'in_person', 'normal', null);

// payments for completed/confirmed
for (const a of APPTS.filter(a => ['completed', 'confirmed', 'checked_in', 'in_progress'].includes(a.status)).slice(0, 26)) {
  ins('payments', { payment_no: no('PAY', a.appointment_date), patient_id: a.patient_id, appointment_id: a.id, amount: pick([200, 300, 300, 500, 500, 700]), currency: 'AFN', payment_method: pick(['cash', 'cash', 'cash', 'mobile_money', 'free']), status: a.status === 'completed' ? 'completed' : 'pending', transaction_id: null, payment_date: ts(a.appointment_date, a.appointment_time), notes: null });
}

/* medical records for past completed visits */
const REC = [];
const record = (a, cc, exam, assess, plan, vit, dx, fu) => {
  const r = ins('medical_records', { patient_id: a.patient_id, doctor_id: a.doctor_id, appointment_id: a.id, hospital_id: a.hospital_id, visit_date: ts(a.appointment_date, a.appointment_time), visit_type: 'outpatient', chief_complaint: cc, history: null, physical_exam: exam, assessment: assess, treatment_plan: plan, follow_up: null, follow_up_date: fu, doctor_signature: 'signed', is_confidential: false, created_at: ts(a.appointment_date, a.appointment_time) });
  const bmi = vit.w && vit.h ? Math.round(vit.w / ((vit.h / 100) ** 2) * 10) / 10 : null;
  ins('vital_signs', { patient_id: a.patient_id, record_id: r.id, temperature: vit.t, bp_systolic: vit.s, bp_diastolic: vit.d, pulse_rate: vit.p, respiratory_rate: vit.rr, oxygen_sat: vit.o, weight_kg: vit.w, height_cm: vit.h, bmi, blood_glucose: vit.g || null, pain_scale: vit.pain ?? null, muac_cm: vit.muac || null, recorded_by: staff.nurse.id, recorded_at: ts(a.appointment_date, a.appointment_time) });
  dx.forEach(([code, name, type, sev]) => ins('diagnoses', { record_id: r.id, icd_code: code, icd_description: name, diagnosis_name: name, type, severity: sev, notes: null }));
  REC.push(r); return r;
};
const r0 = record(pastA[0], 'تعقیب دیابت و فشار خون', 'پاها سالم، حساسیت محیطی نورمال', 'دیابت کنترل‌نشده؛ فشار خون مرحله ۱', 'ادامه متفورمین، شروع املودیپین، رژیم غذایی', { t: 36.8, s: 148, d: 92, p: 82, rr: 16, o: 97, w: 84, h: 172, g: 212 }, [['E11.9', 'دیابت نوع ۲', 'primary', 'moderate'], ['I10', 'فشار خون بلند اولیه', 'secondary', 'mild']], add(BASE, 0));
const r1 = record(pastA[1], 'نفس‌تنگی هنگام فعالیت', 'ادیم خفیف هر دو پا، کریپیتاسیون قاعده ریه', 'نارسایی قلبی مزمن', 'فوروسماید، انالاپریل، کنترل وزن روزانه', { t: 36.6, s: 132, d: 84, p: 96, rr: 22, o: 93, w: 78, h: 168 }, [['I50.9', 'نارسایی قلبی', 'primary', 'moderate']], add(BASE, 2));
const r2 = record(pastA[2], 'تعقیب درمان توبرکلوز — ماه دوم', 'وضعیت عمومی خوب', 'TB ریوی، مرحله فشرده', 'ادامه RHZE تحت DOTS', { t: 37.1, s: 118, d: 76, p: 84, rr: 18, o: 96, w: 58, h: 170 }, [['A15.0', 'توبرکلوز ریوی', 'primary', 'moderate']], add(BASE, 4));
const r3 = record(pastA[3], 'زخم جلدی بدون درد روی دست از ۲ ماه قبل', 'زخم ۲ سانتی با حاشیه برجسته', 'لیشمانیا جلدی', 'تزریق داخل ضایعه گلوکانتیم هفته‌وار', { t: 36.7, s: 116, d: 74, p: 76, rr: 16, o: 98, w: 61, h: 160 }, [['B55.1', 'لیشمانیا جلدی', 'primary', 'mild']], add(BASE, 3));
const r4 = record(pastA[4], 'اسهال ۱۰ روزه و کاهش وزن', 'طفل لاغر، چین جلدی آهسته برمی‌گردد', 'سوء تغذیه حاد شدید با اسهال', 'RUTF، ORS و زینک، معرفی به OTP', { t: 37.4, s: null, d: null, p: 128, rr: 34, o: 97, w: 7.5, h: 75, muac: 11.2 }, [['E43', 'سوء تغذیه حاد شدید (SAM)', 'primary', 'severe'], ['A09', 'اسهال و گاستروانتریت', 'secondary', 'moderate']], add(BASE, 5));
const r5 = record(pastA[5], 'درد سینه فشارنده از دو روز', 'صداهای قلبی نورمال', 'آنژین ناپایدار — احتمالی', 'تروپونین، ECG، کلوپیدوگرل، اتورواستاتین', { t: 36.9, s: 156, d: 96, p: 102, rr: 20, o: 95, w: 88, h: 175, pain: 6 }, [['I20.0', 'آنژین ناپایدار', 'provisional', 'severe']], add(BASE, 1));
const r6 = record(pastA[6], 'تعقیب دیابت', 'بدون یافته خاص', 'دیابت نوع ۲ با کنترل متوسط', 'افزایش دوز متفورمین', { t: 36.6, s: 128, d: 80, p: 78, rr: 16, o: 98, w: 91, h: 176, g: 168 }, [['E11.9', 'دیابت نوع ۲', 'primary', 'mild']], add(BASE, 30));
const r7 = record(pastA[7], 'سرفه و تب از ۴ روز', 'رال در قاعده ریه راست', 'سینه‌بغل اکتسابی از جامعه', 'اموکسی‌سیلین ۵ روز، سالبوتامول', { t: 38.6, s: 112, d: 70, p: 104, rr: 24, o: 94, w: 62, h: 163 }, [['J18.9', 'سینه‌بغل (نمونیا)', 'primary', 'moderate'], ['J45.9', 'آسم', 'secondary', 'mild']], add(BASE, 5));
// earlier vitals for trend (patient 0)
[[-90, 156, 96, 228], [-60, 150, 94, 205], [-30, 152, 90, 198]].forEach(([off, s, di, g]) => ins('vital_signs', { patient_id: P(0).id, record_id: null, temperature: 36.7, bp_systolic: s, bp_diastolic: di, pulse_rate: 80, respiratory_rate: 16, oxygen_sat: 97, weight_kg: 85, height_cm: 172, bmi: 28.7, blood_glucose: g, pain_scale: 0, muac_cm: null, recorded_by: staff.nurse.id, recorded_at: ts(add(BASE, off), '09:00') }));

/* prescriptions */
const rx = (r, pharmacyKey, status, items) => {
  const p = ins('prescriptions', { prescription_no: no('RX', r.visit_date.slice(0, 10)), record_id: r.id, doctor_id: r.doctor_id, patient_id: r.patient_id, prescription_date: r.visit_date.slice(0, 10), pharmacy_id: pharmacyKey ? PH[pharmacyKey].id : null, status, notes: null, valid_until: add(r.visit_date.slice(0, 10), 30), is_controlled: false, dispensed_at: status === 'dispensed' ? r.visit_date : null, dispensed_by: status === 'dispensed' ? staff.pharm.id : null, created_at: r.visit_date });
  for (const [m, dosage, frequency, days, route, qty, instr] of items) ins('prescription_items', { prescription_id: p.id, medicine_id: MED[m].id, dosage, frequency, duration_days: days, route, instructions: instr, quantity: qty, is_dispensed: status === 'dispensed' });
  return p;
};
rx(r0, 'regional', 'dispensed', [['metf', '500mg', 'دو بار در روز', 30, 'oral', 60, 'بعد از غذا'], ['amlo', '5mg', 'یک بار در روز', 30, 'oral', 30, 'صبح']]);
rx(r1, 'city', 'pending', [['furo', '40mg', 'یک بار در روز', 30, 'oral', 30, 'صبح'], ['enal', '10mg', 'یک بار در روز', 30, 'oral', 30, null]]);
rx(r2, 'regional', 'dispensed', [['rhze', '4 قرص', 'یک بار در روز', 28, 'oral', 112, 'ناشتا، زیر نظر DOTS']]);
rx(r3, 'regional', 'pending', [['glucan', '1–3ml داخل ضایعه', 'هفته‌وار', 35, 'injection', 5, 'در کلینیک تزریق شود']]);
rx(r4, 'regional', 'pending', [['rutf', '1 ساشه', 'سه بار در روز', 14, 'oral', 42, null], ['ors', '1 ساشه در یک لیتر آب', 'بعد از هر اسهال', 7, 'oral', 10, null], ['zinc', '20mg', 'یک بار در روز', 10, 'oral', 10, null]]);
rx(r5, 'mehraban', 'partially_dispensed', [['clop', '75mg', 'یک بار در روز', 30, 'oral', 30, null], ['ator', '20mg', 'شب', 30, 'oral', 30, null]]);
rx(r7, 'mehraban', 'pending', [['amox', '500mg', 'سه بار در روز', 5, 'oral', 15, null], ['salb', '2 پف', 'در صورت ضرورت', 30, 'inhaler', 1, null], ['para', '500mg', 'هر ۶ ساعت در صورت تب', 3, 'oral', 12, null]]);
// mark clopidogrel dispensed for partial
T.prescription_items.find(i => i.medicine_id === MED.clop.id).is_dispensed = true;

/* lab orders */
const lab = (r, labKey, status, priority, tests) => {
  const o = ins('lab_orders', { order_no: no('LAB', r.visit_date.slice(0, 10)), patient_id: r.patient_id, doctor_id: r.doctor_id, record_id: r.id, laboratory_id: LAB[labKey].id, order_date: r.visit_date, priority, status, clinical_notes: null, sample_collected_at: status !== 'ordered' ? r.visit_date : null, resulted_at: ['resulted', 'reviewed'].includes(status) ? r.visit_date : null, reviewed_by: status === 'reviewed' ? r.doctor_id : null });
  for (const [code, value, flag] of tests) ins('lab_results', { order_id: o.id, test_id: TEST[code].id, result_value: value, result_unit: TEST[code].unit, normal_range: null, flag: flag || null, result_date: value != null ? r.visit_date : null, performed_by: value != null ? staff.lab.id : null, notes: null, is_abnormal: !!flag && flag !== 'normal' });
  return o;
};
lab(r0, 'heart', 'resulted', 'routine', [['HBA1C', '9.1', 'high'], ['FBS', '212', 'high'], ['CREAT', '1.1', 'normal']]);
lab(r1, 'heart', 'reviewed', 'urgent', [['CREAT', '1.6', 'high'], ['K', '4.2', 'normal'], ['NA', '134', 'low']]);
lab(r2, 'regional', 'processing', 'routine', [['SPUTUM', null, null]]);
lab(r5, 'mehraban', 'resulted', 'emergency', [['TROP', '0.62', 'critical_high'], ['TCHOL', '246', 'high']]);
lab(r7, 'mehraban', 'sample_collected', 'routine', [['WBC', null, null], ['HB', null, null]]);
lab(r4, 'regional', 'ordered', 'urgent', [['HB', null, null], ['NA', null, null], ['K', null, null]]);

/* clinical alerts */
ins('clinical_alerts', { alert_type: 'critical_lab', patient_id: P(8).id, doctor_id: D('Abdul Qader Amani').id, record_id: r5.id, priority: 'critical', message: 'تروپونین I = ۰٫۶۲ ng/mL (بحرانی) — احتمال انفارکتوس میوکارد', detail: null, is_acknowledged: false, acknowledged_by: null, acknowledge_reason: null });
ins('clinical_alerts', { alert_type: 'drug_allergy', patient_id: P(8).id, doctor_id: D('Abdul Qader Amani').id, record_id: r5.id, priority: 'warning', message: 'حساسیت ثبت‌شده به اسپرین — از تجویز ضد پلاکت‌های هم‌گروه با احتیاط استفاده شود', detail: null, is_acknowledged: false, acknowledged_by: null, acknowledge_reason: null });
ins('clinical_alerts', { alert_type: 'overdue_test', patient_id: P(0).id, doctor_id: D('Haroon Halimyar').id, record_id: r0.id, priority: 'warning', message: 'HbA1c = ۹٫۱٪ — هدف کمتر از ۷٪؛ بازنگری درمان دیابت', detail: null, is_acknowledged: false, acknowledged_by: null, acknowledge_reason: null });
ins('clinical_alerts', { alert_type: 'malnutrition', patient_id: P(14).id, doctor_id: D('Ghulam Nabi Quraishi').id, record_id: r4.id, priority: 'critical', message: 'MUAC = ۱۱٫۲ سانتی‌متر — سوء تغذیه حاد شدید (SAM)', detail: null, is_acknowledged: false, acknowledged_by: null, acknowledge_reason: null });

/* ---------- beds ---------- */
const bed = (h, depKey, n, type, status, pi) => ins('bed_management', { hospital_id: H[h].id, department_id: DEP[h + ':' + depKey].id, bed_number: n, bed_type: type, status, patient_id: pi != null ? P(pi).id : null, admitted_at: pi != null ? ts(add(BASE, -2), '14:00') : null });
['M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07', 'M-08'].forEach((n, i) => bed('regional', 'med', n, 'general', i < 5 ? 'occupied' : i === 7 ? 'maintenance' : 'available', i < 5 ? [2, 4, 15, 6, 17][i] : null));
['P-01', 'P-02', 'P-03', 'P-04', 'P-05', 'P-06'].forEach((n, i) => bed('regional', 'peds', n, 'pediatric', i < 2 ? 'occupied' : 'available', i === 0 ? 14 : i === 1 ? 12 : null));
['I-01', 'I-02', 'I-03', 'I-04'].forEach((n, i) => bed('regional', 'icu', n, 'ICU', i < 1 ? 'occupied' : i === 3 ? 'reserved' : 'available', i === 0 ? 8 : null));
['L-01', 'L-02', 'L-03', 'L-04'].forEach((n, i) => bed('regional', 'mat', n, 'maternity', i === 0 ? 'occupied' : 'available', i === 0 ? 11 : null));
['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06'].forEach((n, i) => bed('heart', 'cardio', n, i < 2 ? 'HDU' : 'general', i < 3 ? 'reserved' : 'available', null));
['G-01', 'G-02', 'G-03', 'G-04', 'G-05'].forEach((n, i) => bed('mehraban', 'surg', n, 'general', i < 2 ? 'reserved' : 'available', null));
// beds cannot be occupied by the same patient twice — patient index 12 used once only

/* ---------- blood bank ---------- */
const BT = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const stock = { regional: [18, 3, 22, 2, 6, 1, 27, 4], habibyar: [9, 1, 11, 0, 3, 0, 14, 2], mehraban: [6, 0, 7, 1, 2, 0, 9, 1] };
for (const [h, arr] of Object.entries(stock)) BT.forEach((bt, i) => ins('blood_bank', { hospital_id: H[h].id, blood_type: bt, component: 'whole_blood', units_available: arr[i], expiry_date: add(BASE, int(10, 34)), updated_at: ts(BASE, '07:30') }));

/* ---------- ambulances & emergency calls ---------- */
const AMB = [];
const amb = (h, n, type, status, lat, lng) => { const a = ins('ambulances', { hospital_id: H[h].id, vehicle_number: n, model: 'Toyota HiAce', type, driver_id: null, paramedic_id: null, current_lat: lat, current_lng: lng, status, last_service_date: add(BASE, -int(10, 80)) }); AMB.push(a); return a; };
const a1 = amb('regional', 'HRT-AMB-101', 'advanced', 'on_call', 34.371, 62.170);
amb('regional', 'HRT-AMB-102', 'basic', 'available', 34.343, 62.193);
amb('regional', 'HRT-AMB-103', 'neonatal', 'available', 34.343, 62.194);
const a4 = amb('habibyar', 'HRT-AMB-201', 'ICU_mobile', 'on_call', 34.330, 62.230);
amb('habibyar', 'HRT-AMB-202', 'basic', 'maintenance', 34.352, 62.215);
const call = (o) => ins('emergency_calls', Object.assign({ patient_id: null, caller_name: null, gps_lat: null, gps_lng: null, ambulance_id: null, hospital_id: null, dispatched_at: null, arrived_at: null, resolved_at: null, operator_id: staff.nurse.id }, o));
call({ caller_phone: '0791234567', caller_name: 'همسایه', location_text: 'انجیل، نزدیک مسجد جامع قریه', district: 'انجیل', situation: 'مرد ۶۰ ساله، درد شدید سینه و عرق سرد', triage: 'red', status: 'dispatched', ambulance_id: a1.id, hospital_id: H.regional.id, received_at: ts(BASE, '07:48'), dispatched_at: ts(BASE, '07:51') });
call({ caller_phone: '0784455667', caller_name: 'پدر طفل', location_text: 'سرک ولایت، چهارراهی آمریت', district: 'هرات', situation: 'تصادم موتور، زخم پا، هوشیار', triage: 'yellow', status: 'arrived', ambulance_id: a4.id, hospital_id: H.habibyar.id, received_at: ts(BASE, '07:20'), dispatched_at: ts(BASE, '07:24'), arrived_at: ts(BASE, '07:36') });
call({ caller_phone: '0799887766', caller_name: null, location_text: 'گذره، مرکز ولسوالی', district: 'گذره', situation: 'زن باردار ۳۸ هفته، شروع درد ولادی', triage: 'yellow', status: 'received', received_at: ts(BASE, '08:02') });
call({ caller_phone: '0772233445', caller_name: 'دکاندار', location_text: 'بازار ملک', district: 'هرات', situation: 'افتادن از زینه، دست درد', triage: 'green', status: 'resolved', hospital_id: H.mehraban.id, received_at: ts(add(BASE, -1), '16:10'), dispatched_at: ts(add(BASE, -1), '16:14'), arrived_at: ts(add(BASE, -1), '16:29'), resolved_at: ts(add(BASE, -1), '17:05') });

/* ---------- disease surveillance (IDSR weekly, epi-weeks 32–39 of 2026) ---------- */
const DIS = {
  'اسهال حاد آبکی (AWD)': ['A09', [42, 48, 51, 55, 60, 58, 66, 118]],
  'انتانات حاد تنفسی / سینه‌بغل': ['J18.9', [70, 64, 61, 66, 72, 69, 74, 81]],
  'لیشمانیا جلدی': ['B55.1', [18, 21, 19, 24, 22, 26, 25, 27]],
  'سرخکان (مشکوک)': ['B05.9', [2, 1, 3, 2, 4, 3, 6, 11]],
  'ملاریا': ['B54', [9, 8, 11, 10, 7, 8, 6, 5]],
  'توبرکلوز (موارد جدید)': ['A15.0', [6, 5, 7, 6, 8, 5, 6, 7]],
};
const DISTRICTS_SPLIT = [['هرات', 0.46], ['انجیل', 0.18], ['گذره', 0.12], ['کرخ', 0.08], ['شیندند', 0.1], ['غوریان', 0.06]];
for (const [name, [icd, weeks]] of Object.entries(DIS)) {
  weeks.forEach((total, wi) => {
    const week = 32 + wi;
    let left = total;
    DISTRICTS_SPLIT.forEach(([district, share], di) => {
      const n = di === DISTRICTS_SPLIT.length - 1 ? left : Math.round(total * share);
      left -= n;
      if (n <= 0) return;
      ins('disease_surveillance', { hospital_id: null, disease_name: name, icd_code: icd, week_number: week, year: 2026, district, total_cases: n, new_cases: n, deaths: name.startsWith('اسهال') && week === 39 && district === 'انجیل' ? 1 : 0, recovered: null, hospitalized: Math.round(n * 0.12), age_group: 'all', gender: 'both', report_date: add('2026-08-09', wi * 7), reported_by: staff.mph.id, verified: wi < 7 });
    });
  });
}
ins('epidemic_alerts', { disease_name: 'اسهال حاد آبکی (AWD)', district: 'انجیل', severity: 'alert', cases_count: 21, description: 'افزایش ناگهانی موارد در هفته ۳۹ همراه با یک مرگ', recommended_actions: 'کلورین‌کاری منابع آب، توزیع ORS، تیم واکنش سریع', reported_by: staff.mph.id, alert_date: ts(BASE, '07:00'), is_resolved: false, resolved_at: null });

/* ---------- write storage documents ---------- */
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
const out = path.join(__dirname, '..', 'seed');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const docs = {};
for (const [t, def] of Object.entries(SCHEMA)) {
  const b = def.b || 1;
  for (let k = 0; k < b; k++) docs[`${t}~${k}`] = { t, rows: {} };
  for (const row of T[t]) docs[`${t}~${b > 1 ? fnv(row.id) % b : 0}`].rows[row.id] = row;
}
let maxSize = 0;
for (const [k, body] of Object.entries(docs)) { const s = JSON.stringify(body); maxSize = Math.max(maxSize, s.length); fs.writeFileSync(path.join(out, k + '.json'), s); }
const keys = Object.keys(docs);
const batches = []; for (let i = 0; i < keys.length; i += 50) batches.push(keys.slice(i, i + 50));
fs.writeFileSync(path.join(out, '_batches.json'), JSON.stringify(batches.map(b => b.map(k => ({ op: 'set', collection: 'hdhs', doc_id: k, file_path: path.join(out, k + '.json') }))), null, 1));
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'data', 'seed.js'), '/* HDHS sample dataset — generated by src/seed.cjs */\nwindow.HDHS_SEED = ' + JSON.stringify(docs) + ';\n');
const counts = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v.length]));
console.log(JSON.stringify({ docs: keys.length, batches: batches.length, maxDocBytes: maxSize, rows: Object.values(counts).reduce((a, b) => a + b, 0), counts }));
