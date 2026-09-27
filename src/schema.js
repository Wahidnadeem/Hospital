/* HDHS relational schema (client engine).
   fk: { column: [parentTable, mode] }  mode: 'r' = RESTRICT, 'c' = CASCADE, 'n' = SET NULL
   b: number of storage buckets (documents) the table is spread over */
const SCHEMA = {
  roles:            { b:1, label:'نقش‌ها', req:['name'], uniq:['name'] },
  users:            { b:4, label:'کاربران', req:['first_name','last_name','role_id'], uniq:['national_id','phone','email'],
                      fk:{ role_id:['roles','r'] },
                      enums:{ gender:['male','female','other'], blood_type:['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'], status:['active','inactive','suspended'], language:['dari','pashto','english'] } },
  specializations:  { b:1, label:'تخصص‌ها', req:['name'] },
  hospitals:        { b:1, label:'شفاخانه‌ها', req:['name','type'],
                      enums:{ type:['public_hospital','private_hospital','clinic','health_center','subcenter','CHC'], status:['active','inactive','closed'] } },
  departments:      { b:1, label:'بخش‌ها', req:['hospital_id','name'], fk:{ hospital_id:['hospitals','c'], head_doctor_id:['doctors','n'] } },
  doctors:          { b:2, label:'داکتران', req:['user_id','specialization_id','hospital_id'], uniq:['user_id','license_number'],
                      fk:{ user_id:['users','r'], specialization_id:['specializations','r'], hospital_id:['hospitals','r'] },
                      enums:{ status:['active','inactive','on_leave'] } },
  doctor_availability:{ b:1, label:'زمان‌بندی داکتران', req:['doctor_id','day_of_week','start_time','end_time'],
                      fk:{ doctor_id:['doctors','c'], hospital_id:['hospitals','r'] } },
  patients:         { b:4, label:'بیماران', req:['user_id','mrn'], uniq:['user_id','mrn'], fk:{ user_id:['users','r'] }, idx:['district'],
                      enums:{ marital_status:['single','married','widowed','divorced'] } },
  appointments:     { b:4, label:'نوبت‌ها', req:['appointment_no','patient_id','doctor_id','hospital_id','appointment_date','appointment_time'], uniq:['appointment_no'],
                      fk:{ patient_id:['patients','r'], doctor_id:['doctors','r'], hospital_id:['hospitals','r'], department_id:['departments','n'] },
                      idx:['appointment_date','status'],
                      enums:{ type:['in_person','telemedicine_video','telemedicine_audio','home_visit'], status:['pending','confirmed','checked_in','in_progress','completed','cancelled','no_show'], priority:['normal','urgent','emergency'] },
                      check(row, S){
                        if (row.status === 'cancelled' || row.status === 'no_show') return;
                        const clash = S.by('appointments','doctor_id',row.doctor_id).find(a => a.id !== row.id && a.appointment_date === row.appointment_date && a.appointment_time === row.appointment_time && a.status !== 'cancelled' && a.status !== 'no_show');
                        if (clash) return 'این داکتر در همین تاریخ و ساعت نوبت دیگری دارد.';
                      } },
  payments:         { b:2, label:'پرداخت‌ها', req:['payment_no','patient_id','amount'], uniq:['payment_no','appointment_id'],
                      fk:{ patient_id:['patients','r'], appointment_id:['appointments','n'] },
                      enums:{ payment_method:['cash','mobile_money','card','insurance','free'], status:['pending','completed','refunded','failed'] },
                      check(row){ if (!(row.amount >= 0)) return 'مبلغ پرداخت نمی‌تواند منفی باشد.'; } },
  medical_records:  { b:4, label:'پرونده‌های طبی', req:['patient_id','doctor_id','hospital_id','visit_date'], uniq:['appointment_id'],
                      fk:{ patient_id:['patients','r'], doctor_id:['doctors','r'], appointment_id:['appointments','r'], hospital_id:['hospitals','r'] },
                      enums:{ visit_type:['outpatient','inpatient','emergency','telemedicine'] } },
  diagnoses:        { b:4, label:'تشخیص‌ها', req:['record_id','diagnosis_name'], fk:{ record_id:['medical_records','c'] },
                      enums:{ type:['primary','secondary','provisional','final'], severity:['mild','moderate','severe','critical'] } },
  vital_signs:      { b:4, label:'علائم حیاتی', req:['patient_id'], fk:{ patient_id:['patients','r'], record_id:['medical_records','c'], recorded_by:['users','n'] },
                      check(r){
                        if (r.pain_scale != null && (r.pain_scale < 0 || r.pain_scale > 10)) return 'مقیاس درد باید بین ۰ و ۱۰ باشد.';
                        if (r.oxygen_sat != null && (r.oxygen_sat < 50 || r.oxygen_sat > 100)) return 'اشباع اکسیجن باید بین ۵۰ و ۱۰۰ باشد.';
                        if (r.bp_systolic != null && r.bp_diastolic != null && r.bp_diastolic >= r.bp_systolic) return 'فشار دیاستولیک باید کمتر از سیستولیک باشد.';
                        if (r.temperature != null && (r.temperature < 30 || r.temperature > 45)) return 'درجه حرارت خارج از محدوده ممکن است.';
                      } },
  medicines:        { b:1, label:'دارونامه', req:['generic_name'] },
  drug_interactions:{ b:1, label:'تداخلات دارویی', req:['drug1_id','drug2_id','severity'], fk:{ drug1_id:['medicines','c'], drug2_id:['medicines','c'] },
                      enums:{ severity:['minor','moderate','major','contraindicated'] } },
  pharmacies:       { b:1, label:'دواخانه‌ها', req:['name'], uniq:['license_number'], fk:{ hospital_id:['hospitals','n'] } },
  pharmacy_inventory:{ b:2, label:'موجودی دواخانه', req:['pharmacy_id','medicine_id','quantity','expiry_date'],
                      fk:{ pharmacy_id:['pharmacies','c'], medicine_id:['medicines','r'] },
                      check(r){ if (!(r.quantity >= 0)) return 'تعداد موجودی نمی‌تواند منفی باشد.'; } },
  prescriptions:    { b:2, label:'نسخه‌ها', req:['prescription_no','doctor_id','patient_id','prescription_date'], uniq:['prescription_no'],
                      fk:{ record_id:['medical_records','c'], doctor_id:['doctors','r'], patient_id:['patients','r'], pharmacy_id:['pharmacies','n'], dispensed_by:['users','n'] },
                      idx:['status'],
                      enums:{ status:['pending','dispensed','partially_dispensed','cancelled'] } },
  prescription_items:{ b:2, label:'اقلام نسخه', req:['prescription_id','medicine_id','quantity'],
                      fk:{ prescription_id:['prescriptions','c'], medicine_id:['medicines','r'] },
                      enums:{ route:['oral','injection','topical','inhaler','drops','other'] },
                      check(r){ if (!(r.quantity > 0)) return 'تعداد دوا باید بیشتر از صفر باشد.'; } },
  lab_tests:        { b:1, label:'آزمایش‌ها', req:['code','name'], uniq:['code'] },
  laboratories:     { b:1, label:'لابراتوارها', req:['name'], fk:{ hospital_id:['hospitals','n'] } },
  lab_orders:       { b:2, label:'درخواست آزمایش', req:['order_no','patient_id','doctor_id','laboratory_id'], uniq:['order_no'],
                      fk:{ patient_id:['patients','r'], doctor_id:['doctors','r'], record_id:['medical_records','c'], laboratory_id:['laboratories','r'], reviewed_by:['doctors','n'] },
                      idx:['status'],
                      enums:{ priority:['routine','urgent','emergency'], status:['ordered','sample_collected','processing','resulted','reviewed','cancelled'] } },
  lab_results:      { b:2, label:'نتایج آزمایش', req:['order_id','test_id'], fk:{ order_id:['lab_orders','c'], test_id:['lab_tests','r'], performed_by:['users','n'] },
                      enums:{ flag:['normal','low','high','critical_low','critical_high','abnormal'] } },
  vaccinations:     { b:2, label:'واکسیناسیون', req:['patient_id','vaccine_code','date_given'], fk:{ patient_id:['patients','r'], given_by:['users','n'], hospital_id:['hospitals','n'] } },
  maternal_health:  { b:1, label:'صحت مادر', req:['patient_id','lmp_date'], fk:{ patient_id:['patients','r'], baby_id:['patients','n'] },
                      enums:{ status:['active','delivered','miscarriage','stillbirth'], risk_level:['low','moderate','high','critical'] } },
  anc_visits:       { b:1, label:'ویزیت‌های ANC', req:['maternal_id','visit_date'], fk:{ maternal_id:['maternal_health','c'], doctor_id:['doctors','n'] } },
  child_health:     { b:1, label:'صحت طفل', req:['patient_id'], uniq:['patient_id'], fk:{ patient_id:['patients','r'], mother_id:['patients','n'] } },
  growth_monitoring:{ b:1, label:'پایش رشد', req:['child_id','measurement_date'], fk:{ child_id:['child_health','c'], recorded_by:['users','n'] },
                      enums:{ nutritional_status:['normal','MAM','SAM'] } },
  disease_surveillance:{ b:3, label:'نظارت بیماری‌ها', req:['disease_name','week_number','year','district'], fk:{ hospital_id:['hospitals','n'] },
                      check(r){ if (r.new_cases < 0 || r.deaths < 0) return 'تعداد موارد نمی‌تواند منفی باشد.'; } },
  epidemic_alerts:  { b:1, label:'هشدارهای اپیدمی', req:['disease_name','severity'], enums:{ severity:['watch','warning','alert','emergency'] } },
  ambulances:       { b:1, label:'امبولانس‌ها', req:['hospital_id','vehicle_number'], uniq:['vehicle_number'], fk:{ hospital_id:['hospitals','r'] },
                      enums:{ type:['basic','advanced','neonatal','ICU_mobile'], status:['available','on_call','maintenance','offline'] } },
  emergency_calls:  { b:1, label:'تماس‌های عاجل', req:['caller_phone','situation'], fk:{ patient_id:['patients','n'], ambulance_id:['ambulances','n'], hospital_id:['hospitals','n'] },
                      enums:{ status:['received','dispatched','arrived','transported','resolved','cancelled'], triage:['red','yellow','green'] } },
  blood_bank:       { b:1, label:'بانک خون', req:['hospital_id','blood_type'], fk:{ hospital_id:['hospitals','c'] },
                      enums:{ blood_type:['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
                      check(r, S){
                        if (!(r.units_available >= 0)) return 'واحدهای خون نمی‌تواند منفی باشد.';
                        const dup = S.by('blood_bank','hospital_id',r.hospital_id).find(x => x.id !== r.id && x.blood_type === r.blood_type && x.component === r.component);
                        if (dup) return 'این گروه خونی برای این شفاخانه قبلاً ثبت شده است.';
                      } },
  bed_management:   { b:1, label:'تخت‌ها', req:['hospital_id','bed_number'], fk:{ hospital_id:['hospitals','c'], department_id:['departments','n'], patient_id:['patients','r'] },
                      enums:{ bed_type:['general','ICU','HDU','isolation','pediatric','maternity'], status:['available','occupied','reserved','maintenance'] },
                      check(r, S){
                        if (r.status === 'occupied' && !r.patient_id) return 'برای تخت اشغال‌شده باید بیمار مشخص شود.';
                        if (r.patient_id) { const other = S.by('bed_management','patient_id',r.patient_id).find(x => x.id !== r.id); if (other) return 'این بیمار قبلاً روی تخت دیگری بستری است.'; }
                      } },
  clinical_alerts:  { b:1, label:'هشدارهای کلینیکی', req:['patient_id','alert_type','message'], fk:{ patient_id:['patients','c'], doctor_id:['doctors','n'], record_id:['medical_records','c'] },
                      enums:{ priority:['info','warning','critical'] } },
  audit_logs:       { b:6, label:'گزارش تغییرات', req:['action','table_name'] },
};
if (typeof module !== 'undefined') module.exports = SCHEMA;
