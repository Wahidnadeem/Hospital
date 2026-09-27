-- =============================================================================
--  HDHS — Herat Digital Health System · PostgreSQL 15+ production schema
--  Mirrors the relational rules enforced by the web app (same FKs, ON DELETE
--  behaviour, UNIQUE and CHECK constraints). UTF-8 for Dari / Pashto.
--  Conventions:
--    * UUID primary keys (gen_random_uuid), timestamptz everywhere
--    * ON DELETE RESTRICT for clinical history, CASCADE only for owned children
--    * every foreign-key column is indexed (fast joins / reverse lookups)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- fast fuzzy patient / drug search

-- ---------- enum types ----------
CREATE TYPE gender_t          AS ENUM ('male','female','other');
CREATE TYPE blood_t           AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown');
CREATE TYPE lang_t            AS ENUM ('dari','pashto','english');
CREATE TYPE user_status_t     AS ENUM ('active','inactive','suspended');
CREATE TYPE hospital_type_t   AS ENUM ('public_hospital','private_hospital','clinic','health_center','subcenter','CHC');
CREATE TYPE appt_type_t       AS ENUM ('in_person','telemedicine_video','telemedicine_audio','home_visit');
CREATE TYPE appt_status_t     AS ENUM ('pending','confirmed','checked_in','in_progress','completed','cancelled','no_show');
CREATE TYPE priority_t        AS ENUM ('normal','urgent','emergency');
CREATE TYPE lab_priority_t    AS ENUM ('routine','urgent','emergency');
CREATE TYPE visit_type_t      AS ENUM ('outpatient','inpatient','emergency','telemedicine');
CREATE TYPE dx_type_t         AS ENUM ('primary','secondary','provisional','final');
CREATE TYPE severity_t        AS ENUM ('mild','moderate','severe','critical');
CREATE TYPE route_t           AS ENUM ('oral','injection','topical','inhaler','drops','other');
CREATE TYPE rx_status_t       AS ENUM ('pending','dispensed','partially_dispensed','cancelled');
CREATE TYPE lab_status_t      AS ENUM ('ordered','sample_collected','processing','resulted','reviewed','cancelled');
CREATE TYPE lab_flag_t        AS ENUM ('normal','low','high','critical_low','critical_high','abnormal');
CREATE TYPE di_severity_t     AS ENUM ('minor','moderate','major','contraindicated');
CREATE TYPE preg_status_t     AS ENUM ('active','delivered','miscarriage','stillbirth');
CREATE TYPE risk_t            AS ENUM ('low','moderate','high','critical');
CREATE TYPE nutrition_t       AS ENUM ('normal','MAM','SAM');
CREATE TYPE alert_sev_t       AS ENUM ('watch','warning','alert','emergency');
CREATE TYPE amb_type_t        AS ENUM ('basic','advanced','neonatal','ICU_mobile');
CREATE TYPE amb_status_t      AS ENUM ('available','on_call','maintenance','offline');
CREATE TYPE call_status_t     AS ENUM ('received','dispatched','arrived','transported','resolved','cancelled');
CREATE TYPE triage_t          AS ENUM ('red','yellow','green');
CREATE TYPE bed_type_t        AS ENUM ('general','ICU','HDU','isolation','pediatric','maternity');
CREATE TYPE bed_status_t      AS ENUM ('available','occupied','reserved','maintenance');
CREATE TYPE pay_method_t      AS ENUM ('cash','mobile_money','card','insurance','free');
CREATE TYPE pay_status_t      AS ENUM ('pending','completed','refunded','failed');
CREATE TYPE cdss_priority_t   AS ENUM ('info','warning','critical');
CREATE TYPE audit_action_t    AS ENUM ('create','update','delete','login','logout','view');

-- ---------- identity ----------
CREATE TABLE roles (
  id            text PRIMARY KEY,                       -- 'role-doctor' …
  name          varchar(50)  NOT NULL UNIQUE,
  display_name  varchar(100),
  permissions   jsonb NOT NULL DEFAULT '[]',
  description   text,
  is_system     boolean NOT NULL DEFAULT false
);

CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  national_id    varchar(20) UNIQUE,                    -- تذکره
  first_name     varchar(100) NOT NULL,
  last_name      varchar(100) NOT NULL,
  first_name_en  varchar(100),
  last_name_en   varchar(100),
  phone          varchar(20) UNIQUE,                    -- nullable: doctors' personal numbers are not published
  email          varchar(255) UNIQUE,
  password_hash  varchar(255),
  role_id        text NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  gender         gender_t,
  date_of_birth  date,                                  -- "not in future" validated in app / trigger
  blood_type     blood_t NOT NULL DEFAULT 'Unknown',
  language       lang_t  NOT NULL DEFAULT 'dari',
  status         user_status_t NOT NULL DEFAULT 'active',
  is_verified    boolean NOT NULL DEFAULT false,
  last_login     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  created_by     uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX users_role_idx ON users(role_id);
CREATE INDEX users_name_trgm ON users USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- ---------- facilities ----------
CREATE TABLE specializations (
  id serial PRIMARY KEY, name varchar(200) NOT NULL, name_en varchar(200), description text, icon varchar(100)
);

CREATE TABLE hospitals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            varchar(200) NOT NULL,
  name_en         varchar(200),
  type            hospital_type_t NOT NULL,
  address         text, district varchar(100),
  phone           varchar(20), email varchar(255), website varchar(255),
  gps_lat         numeric(10,8), gps_lng numeric(11,8),
  services        jsonb NOT NULL DEFAULT '[]',
  working_hours   jsonb,
  is_emergency    boolean NOT NULL DEFAULT false,
  manager_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  status          varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','closed')),
  established_date date, license_number varchar(100)
);

CREATE TABLE doctors (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,   -- 1:1
  license_number     varchar(50) UNIQUE,                  -- required for new registrations (app-level)
  specialization_id  int  NOT NULL REFERENCES specializations(id) ON DELETE RESTRICT,
  sub_specialization varchar(200),
  hospital_id        uuid NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
  experience_years   int CHECK (experience_years >= 0),
  qualification      varchar(200),
  consultation_fee   numeric(10,2) CHECK (consultation_fee >= 0),
  online_fee         numeric(10,2) CHECK (online_fee >= 0),
  bio                text,
  available_online   boolean NOT NULL DEFAULT false,
  languages          jsonb NOT NULL DEFAULT '["dari"]',
  avg_rating         numeric(3,2) CHECK (avg_rating BETWEEN 0 AND 5),
  total_reviews      int NOT NULL DEFAULT 0,
  status             varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave'))
);
CREATE INDEX doctors_spec_idx ON doctors(specialization_id);
CREATE INDEX doctors_hosp_idx ON doctors(hospital_id);

CREATE TABLE departments (
  id              serial PRIMARY KEY,
  hospital_id     uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  name            varchar(200) NOT NULL,
  code            varchar(50),
  head_doctor_id  uuid REFERENCES doctors(id) ON DELETE SET NULL,
  floor           varchar(50), phone varchar(20),
  UNIQUE (hospital_id, code)
);
CREATE INDEX departments_hosp_idx ON departments(hospital_id);

CREATE TABLE doctor_availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     uuid NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  hospital_id   uuid NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),   -- 0 = Sunday … 5 = Friday
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  slot_duration int  NOT NULL DEFAULT 15 CHECK (slot_duration BETWEEN 5 AND 120),
  max_patients  int,
  is_online     boolean NOT NULL DEFAULT false,
  valid_from    date, valid_until date,
  is_active     boolean NOT NULL DEFAULT true,
  CHECK (start_time < end_time)
);
CREATE INDEX availability_doc_idx ON doctor_availability(doctor_id, day_of_week);

-- ---------- patients ----------
CREATE TABLE patients (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,   -- 1:1
  mrn                 varchar(20) NOT NULL UNIQUE,
  address text, province varchar(100) DEFAULT 'هرات', district varchar(100), village varchar(100),
  gps_lat numeric(10,8), gps_lng numeric(11,8),
  marital_status      varchar(20) CHECK (marital_status IN ('single','married','widowed','divorced')),
  occupation varchar(100), education_level varchar(100),
  emergency_contact varchar(100), emergency_phone varchar(20), emergency_relation varchar(50),
  allergies           jsonb NOT NULL DEFAULT '[]',     -- [{drug, reaction}]
  chronic_conditions  jsonb NOT NULL DEFAULT '[]',
  registered_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patients_district_idx ON patients(district);

-- ---------- scheduling & billing ----------
CREATE TABLE appointments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_no    varchar(20) NOT NULL UNIQUE,
  patient_id        uuid NOT NULL REFERENCES patients(id)  ON DELETE RESTRICT,
  doctor_id         uuid NOT NULL REFERENCES doctors(id)   ON DELETE RESTRICT,
  hospital_id       uuid NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
  department_id     int  REFERENCES departments(id) ON DELETE SET NULL,
  appointment_date  date NOT NULL,
  appointment_time  time NOT NULL,
  duration_minutes  int NOT NULL DEFAULT 15 CHECK (duration_minutes > 0),
  type              appt_type_t   NOT NULL DEFAULT 'in_person',
  status            appt_status_t NOT NULL DEFAULT 'pending',
  priority          priority_t    NOT NULL DEFAULT 'normal',
  reason text, notes text,
  cancelled_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  cancel_reason     text,
  reminder_sent     boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'cancelled' OR cancel_reason IS NOT NULL)
);
-- one active booking per doctor per slot (cancelled / no-show free the slot)
CREATE UNIQUE INDEX appointments_slot_uq ON appointments(doctor_id, appointment_date, appointment_time)
  WHERE status NOT IN ('cancelled','no_show');
CREATE INDEX appointments_patient_idx ON appointments(patient_id);
CREATE INDEX appointments_day_idx     ON appointments(appointment_date, status);
CREATE INDEX appointments_hosp_idx    ON appointments(hospital_id);

CREATE TABLE payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no      varchar(20) NOT NULL UNIQUE,
  patient_id      uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  appointment_id  uuid UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,   -- 1:1 (FK lives here only; no cycle)
  amount          numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency        varchar(10) NOT NULL DEFAULT 'AFN',
  payment_method  pay_method_t NOT NULL,
  status          pay_status_t NOT NULL DEFAULT 'pending',
  transaction_id  varchar(200),
  payment_date    timestamptz NOT NULL DEFAULT now(),
  notes           text
);
CREATE INDEX payments_patient_idx ON payments(patient_id);

-- ---------- clinical record ----------
CREATE TABLE medical_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES patients(id)  ON DELETE RESTRICT,
  doctor_id        uuid NOT NULL REFERENCES doctors(id)   ON DELETE RESTRICT,
  appointment_id   uuid UNIQUE REFERENCES appointments(id) ON DELETE RESTRICT,   -- 1:1
  hospital_id      uuid NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
  visit_date       timestamptz NOT NULL,
  visit_type       visit_type_t NOT NULL DEFAULT 'outpatient',
  chief_complaint text, history text, physical_exam text, assessment text, treatment_plan text,
  follow_up text, follow_up_date date,
  doctor_signature varchar(500),
  is_confidential  boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX records_patient_idx ON medical_records(patient_id, visit_date DESC);
CREATE INDEX records_doctor_idx  ON medical_records(doctor_id);

CREATE TABLE diagnoses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id       uuid NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  icd_code        varchar(20),
  icd_description varchar(500),
  diagnosis_name  varchar(500) NOT NULL,
  type            dx_type_t NOT NULL DEFAULT 'primary',
  severity        severity_t,
  notes           text
);
CREATE INDEX diagnoses_record_idx ON diagnoses(record_id);
CREATE INDEX diagnoses_icd_idx    ON diagnoses(icd_code);

CREATE TABLE vital_signs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  record_id        uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  temperature      numeric(4,1) CHECK (temperature BETWEEN 30 AND 45),
  bp_systolic      int CHECK (bp_systolic BETWEEN 40 AND 300),
  bp_diastolic     int CHECK (bp_diastolic BETWEEN 20 AND 200),
  pulse_rate       int CHECK (pulse_rate BETWEEN 20 AND 250),
  respiratory_rate int CHECK (respiratory_rate BETWEEN 4 AND 80),
  oxygen_sat       numeric(4,1) CHECK (oxygen_sat BETWEEN 50 AND 100),
  weight_kg        numeric(5,2) CHECK (weight_kg > 0),
  height_cm        numeric(5,1) CHECK (height_cm > 0),
  bmi              numeric(4,1) GENERATED ALWAYS AS (round(weight_kg / ((height_cm/100.0)^2), 1)) STORED,
  blood_glucose    numeric(5,1),
  pain_scale       int CHECK (pain_scale BETWEEN 0 AND 10),
  muac_cm          numeric(4,1) CHECK (muac_cm BETWEEN 6 AND 25),
  recorded_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  recorded_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (bp_diastolic IS NULL OR bp_systolic IS NULL OR bp_diastolic < bp_systolic)
);
CREATE INDEX vitals_patient_idx ON vital_signs(patient_id, recorded_at DESC);
CREATE INDEX vitals_record_idx  ON vital_signs(record_id);

-- ---------- medicines & pharmacy ----------
CREATE TABLE medicines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generic_name    varchar(200) NOT NULL,
  brand_names     jsonb NOT NULL DEFAULT '[]',
  drug_class      varchar(100),                          -- used for class-level allergy matching
  dosage_forms    jsonb NOT NULL DEFAULT '[]',
  strengths       jsonb NOT NULL DEFAULT '[]',
  description text, contraindications text, side_effects text, storage varchar(200),
  is_controlled   boolean NOT NULL DEFAULT false,
  is_essential    boolean NOT NULL DEFAULT false,
  status          varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','discontinued'))
);
CREATE INDEX medicines_name_trgm ON medicines USING gin (generic_name gin_trgm_ops);

CREATE TABLE drug_interactions (
  id           serial PRIMARY KEY,
  drug1_id     uuid NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  drug2_id     uuid NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  severity     di_severity_t NOT NULL,
  description  text, mechanism text, management text,
  evidence_level char(1) CHECK (evidence_level IN ('A','B','C','D')),
  CHECK (drug1_id <> drug2_id)
);
-- symmetric pair is unique regardless of order
CREATE UNIQUE INDEX drug_interactions_pair_uq ON drug_interactions (LEAST(drug1_id, drug2_id), GREATEST(drug1_id, drug2_id));

CREATE TABLE pharmacies (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               varchar(200) NOT NULL,
  license_number     varchar(100) UNIQUE,
  hospital_id        uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  address text, district varchar(100), phone varchar(20),
  gps_lat numeric(10,8), gps_lng numeric(11,8), working_hours jsonb,
  is_open_24h        boolean NOT NULL DEFAULT false,
  delivery_available boolean NOT NULL DEFAULT false,
  manager_id         uuid REFERENCES users(id) ON DELETE SET NULL,
  status             varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended'))
);

CREATE TABLE pharmacy_inventory (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id      uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id      uuid NOT NULL REFERENCES medicines(id)  ON DELETE RESTRICT,
  batch_number     varchar(100) NOT NULL,
  quantity         int NOT NULL CHECK (quantity >= 0),
  unit_price       numeric(10,2) CHECK (unit_price >= 0),
  selling_price    numeric(10,2) CHECK (selling_price >= 0),
  manufacture_date date,
  expiry_date      date NOT NULL,
  supplier_id      uuid,
  min_stock_level  int NOT NULL DEFAULT 10 CHECK (min_stock_level >= 0),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pharmacy_id, medicine_id, batch_number),
  CHECK (manufacture_date IS NULL OR manufacture_date < expiry_date)
);
-- FEFO dispensing: first-expiry-first-out lookup
CREATE INDEX inventory_fefo_idx ON pharmacy_inventory(pharmacy_id, medicine_id, expiry_date) WHERE quantity > 0;

CREATE TABLE prescriptions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_no   varchar(20) NOT NULL UNIQUE,
  record_id         uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  doctor_id         uuid NOT NULL REFERENCES doctors(id)  ON DELETE RESTRICT,
  patient_id        uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  prescription_date date NOT NULL DEFAULT current_date,
  pharmacy_id       uuid REFERENCES pharmacies(id) ON DELETE SET NULL,
  status            rx_status_t NOT NULL DEFAULT 'pending',
  notes text,
  valid_until       date,
  qr_code           varchar(500),
  is_controlled     boolean NOT NULL DEFAULT false,
  dispensed_at      timestamptz,
  dispensed_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= prescription_date)
);
CREATE INDEX rx_patient_idx ON prescriptions(patient_id);
CREATE INDEX rx_queue_idx   ON prescriptions(status) WHERE status IN ('pending','partially_dispensed');

CREATE TABLE prescription_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id     uuid NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
  dosage varchar(100), frequency varchar(100),
  duration_days   int CHECK (duration_days > 0),
  route           route_t NOT NULL DEFAULT 'oral',
  instructions    text,
  quantity        int NOT NULL CHECK (quantity > 0),
  is_dispensed    boolean NOT NULL DEFAULT false
);
CREATE INDEX rx_items_rx_idx ON prescription_items(prescription_id);

-- ---------- laboratory ----------
CREATE TABLE lab_tests (
  id serial PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE, name varchar(200) NOT NULL, category varchar(100),
  ranges jsonb,                       -- {"m":[lo,hi],"f":[lo,hi],"c":[lo,hi]}
  critical jsonb,                     -- [lo,hi] critical limits
  unit varchar(50), sample_type varchar(100), qualitative boolean NOT NULL DEFAULT false,
  turnaround_hours int, price numeric(10,2), description text
);

CREATE TABLE laboratories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  hospital_id uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  address text, district varchar(100), phone varchar(20),
  accredited boolean NOT NULL DEFAULT false,
  manager_id uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE lab_orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no            varchar(20) NOT NULL UNIQUE,
  patient_id          uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id           uuid NOT NULL REFERENCES doctors(id)  ON DELETE RESTRICT,
  record_id           uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  laboratory_id       uuid NOT NULL REFERENCES laboratories(id) ON DELETE RESTRICT,
  order_date          timestamptz NOT NULL DEFAULT now(),
  priority            lab_priority_t NOT NULL DEFAULT 'routine',
  status              lab_status_t   NOT NULL DEFAULT 'ordered',
  clinical_notes      text,
  sample_collected_at timestamptz,
  resulted_at         timestamptz,
  reviewed_by         uuid REFERENCES doctors(id) ON DELETE SET NULL
);
CREATE INDEX lab_orders_patient_idx ON lab_orders(patient_id);
CREATE INDEX lab_orders_status_idx  ON lab_orders(status, priority);

CREATE TABLE lab_results (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  test_id      int  NOT NULL REFERENCES lab_tests(id)  ON DELETE RESTRICT,
  result_value varchar(200), result_unit varchar(50), normal_range varchar(200),
  flag         lab_flag_t,
  result_date  timestamptz,
  performed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  notes        text,
  is_abnormal  boolean NOT NULL DEFAULT false,
  UNIQUE (order_id, test_id)
);

-- ---------- maternal & child ----------
CREATE TABLE vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  vaccine_name  varchar(200) NOT NULL,
  vaccine_code  varchar(50)  NOT NULL,            -- BCG, OPV, PENTA, PCV, ROTA, IPV, MR, TT
  dose_number   int NOT NULL CHECK (dose_number >= 0),
  batch_number  varchar(100),
  date_given    date NOT NULL,
  next_dose_date date,
  given_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  hospital_id   uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  site varchar(100), adverse_reaction text, notes text,
  UNIQUE (patient_id, vaccine_code, dose_number)
);

CREATE TABLE maternal_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id     uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  lmp_date       date NOT NULL,
  edd_date       date GENERATED ALWAYS AS (lmp_date + 280) STORED,     -- Naegele's rule
  gravida        int CHECK (gravida >= 1),
  para           int CHECK (para >= 0),
  abortion_count int NOT NULL DEFAULT 0,
  status         preg_status_t NOT NULL DEFAULT 'active',
  risk_level     risk_t NOT NULL DEFAULT 'low',
  delivery_date  date, delivery_type varchar(20) CHECK (delivery_type IN ('normal','cesarean','assisted')),
  delivery_place varchar(200),
  baby_id        uuid REFERENCES patients(id) ON DELETE SET NULL,
  notes          text,
  CHECK (para IS NULL OR gravida IS NULL OR para <= gravida)
);
-- at most one active pregnancy per woman
CREATE UNIQUE INDEX maternal_active_uq ON maternal_health(patient_id) WHERE status = 'active';

CREATE TABLE anc_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maternal_id        uuid NOT NULL REFERENCES maternal_health(id) ON DELETE CASCADE,
  visit_number       int NOT NULL CHECK (visit_number >= 1),
  visit_date         date NOT NULL,
  weeks_of_gestation int CHECK (weeks_of_gestation BETWEEN 0 AND 44),
  doctor_id          uuid REFERENCES doctors(id) ON DELETE SET NULL,
  weight_kg numeric(5,2), bp_systolic int, bp_diastolic int, fetal_heart_rate int, fundal_height numeric(4,1),
  fetal_presentation varchar(100),
  iron_given boolean NOT NULL DEFAULT false, folate_given boolean NOT NULL DEFAULT false, tt_vaccine_given boolean NOT NULL DEFAULT false,
  risk_factors jsonb NOT NULL DEFAULT '[]', notes text, next_visit_date date,
  UNIQUE (maternal_id, visit_number)
);

CREATE TABLE child_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      uuid NOT NULL UNIQUE REFERENCES patients(id) ON DELETE RESTRICT,   -- 1:1
  mother_id       uuid REFERENCES patients(id) ON DELETE SET NULL,
  birth_weight_gm int CHECK (birth_weight_gm BETWEEN 300 AND 7000),
  birth_height_cm numeric(4,1), birth_place varchar(200), is_breastfed boolean, delivery_complications text,
  CHECK (mother_id IS NULL OR mother_id <> patient_id)
);

CREATE TABLE growth_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id           uuid NOT NULL REFERENCES child_health(id) ON DELETE CASCADE,
  measurement_date   date NOT NULL,
  age_months         int CHECK (age_months BETWEEN 0 AND 60),
  weight_kg numeric(4,2), height_cm numeric(4,1),
  muac_cm            numeric(3,1) CHECK (muac_cm BETWEEN 6 AND 25),
  oedema             boolean NOT NULL DEFAULT false,
  -- WHO/UNICEF MUAC cut-offs (6–59 months); bilateral oedema = SAM
  nutritional_status nutrition_t GENERATED ALWAYS AS (
    CASE WHEN oedema OR muac_cm < 11.5 THEN 'SAM'::nutrition_t
         WHEN muac_cm < 12.5 THEN 'MAM'::nutrition_t ELSE 'normal'::nutrition_t END) STORED,
  recorded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text
);
CREATE INDEX growth_child_idx ON growth_monitoring(child_id, measurement_date);

-- ---------- public health ----------
CREATE TABLE disease_surveillance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id  uuid REFERENCES hospitals(id) ON DELETE SET NULL,
  disease_name varchar(200) NOT NULL, icd_code varchar(20),
  week_number  int NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  year         int NOT NULL,
  district     varchar(100) NOT NULL,
  total_cases int, new_cases int NOT NULL CHECK (new_cases >= 0),
  deaths int NOT NULL DEFAULT 0 CHECK (deaths >= 0), recovered int, hospitalized int NOT NULL DEFAULT 0,
  age_group varchar(50) NOT NULL DEFAULT 'all', gender varchar(10) NOT NULL DEFAULT 'both',
  report_date date NOT NULL,
  reported_by uuid REFERENCES users(id) ON DELETE SET NULL,
  verified boolean NOT NULL DEFAULT false,
  CHECK (deaths <= new_cases AND hospitalized <= new_cases),
  UNIQUE (disease_name, district, year, week_number, age_group, gender)
);
CREATE INDEX surveillance_week_idx ON disease_surveillance(year, week_number, disease_name);

CREATE TABLE epidemic_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease_name varchar(200) NOT NULL, district varchar(100),
  severity alert_sev_t NOT NULL, cases_count int,
  description text, recommended_actions text,
  reported_by uuid REFERENCES users(id) ON DELETE SET NULL,
  alert_date timestamptz NOT NULL DEFAULT now(),
  is_resolved boolean NOT NULL DEFAULT false, resolved_at timestamptz,
  CHECK (NOT is_resolved OR resolved_at IS NOT NULL)
);

CREATE TABLE ambulances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id    uuid NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
  vehicle_number varchar(50) NOT NULL UNIQUE,
  model varchar(100), type amb_type_t NOT NULL DEFAULT 'basic',
  driver_id uuid REFERENCES users(id) ON DELETE SET NULL, paramedic_id uuid REFERENCES users(id) ON DELETE SET NULL,
  current_lat numeric(10,8), current_lng numeric(11,8),
  status amb_status_t NOT NULL DEFAULT 'available',
  last_service_date date
);

CREATE TABLE emergency_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   uuid REFERENCES patients(id) ON DELETE SET NULL,
  caller_phone varchar(20) NOT NULL, caller_name varchar(200),
  location_text text, district varchar(100), gps_lat numeric(10,8), gps_lng numeric(11,8),
  situation    text NOT NULL,
  triage       triage_t,
  ambulance_id uuid REFERENCES ambulances(id) ON DELETE SET NULL,
  hospital_id  uuid REFERENCES hospitals(id)  ON DELETE SET NULL,
  status       call_status_t NOT NULL DEFAULT 'received',
  received_at timestamptz NOT NULL DEFAULT now(), dispatched_at timestamptz, arrived_at timestamptz, resolved_at timestamptz,
  operator_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  CHECK (dispatched_at IS NULL OR dispatched_at >= received_at),
  CHECK (arrived_at IS NULL OR arrived_at >= dispatched_at)
);
CREATE INDEX calls_active_idx ON emergency_calls(status) WHERE status IN ('received','dispatched','arrived','transported');

CREATE TABLE blood_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id     uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  blood_type      varchar(3) NOT NULL CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  component       varchar(20) NOT NULL DEFAULT 'whole_blood' CHECK (component IN ('whole_blood','RBC','plasma','platelets','FFP')),
  units_available int NOT NULL DEFAULT 0 CHECK (units_available >= 0),
  expiry_date     date,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, blood_type, component)
);

CREATE TABLE bed_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id   uuid NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  department_id int  REFERENCES departments(id) ON DELETE SET NULL,
  bed_number    varchar(20) NOT NULL,
  bed_type      bed_type_t   NOT NULL DEFAULT 'general',
  status        bed_status_t NOT NULL DEFAULT 'available',
  patient_id    uuid REFERENCES patients(id) ON DELETE RESTRICT,
  admitted_at   timestamptz,
  UNIQUE (hospital_id, bed_number),
  CHECK ((status = 'occupied') = (patient_id IS NOT NULL))
);
CREATE UNIQUE INDEX bed_one_patient_uq ON bed_management(patient_id) WHERE patient_id IS NOT NULL;   -- a patient occupies one bed

-- ---------- decision support & audit ----------
CREATE TABLE clinical_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type  varchar(40) NOT NULL,   -- drug_allergy, drug_interaction, critical_lab, critical_vitals, malnutrition, overdue_test …
  patient_id  uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id   uuid REFERENCES doctors(id) ON DELETE SET NULL,
  record_id   uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  priority    cdss_priority_t NOT NULL DEFAULT 'warning',
  message     text NOT NULL,
  detail      jsonb,
  is_acknowledged   boolean NOT NULL DEFAULT false,
  acknowledged_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  acknowledge_reason text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX alerts_open_idx ON clinical_alerts(patient_id) WHERE NOT is_acknowledged;

CREATE TABLE audit_logs (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  role        varchar(50),
  action      audit_action_t NOT NULL,
  table_name  varchar(100) NOT NULL,
  record_id   text,
  label       text,
  changes     jsonb,                      -- {"field": [old, new]}
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)            -- partition key must be part of the PK
) PARTITION BY RANGE (created_at);        -- monthly partitions keep writes fast
CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE audit_logs_2026_10 PARTITION OF audit_logs FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE INDEX audit_table_idx ON audit_logs(table_name, record_id);

-- keep users.updated_at current
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE TRIGGER users_touch BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
