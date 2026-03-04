-- 001_core.sql
-- Core schema for Care. v1

create table if not exists profiles (
  id uuid primary key,
  role text not null check (role in ('patient','doctor','admin')),
  full_name text,
  email text,
  phone text,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists doctors (
  profile_id uuid primary key references profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','pending','verified','live','suspended')),
  gmc_number text,
  gmc_verified_at timestamptz,
  dbs_status text default 'pending',
  insurance_status text default 'pending',
  clinic_address text,
  clinic_lat double precision,
  clinic_lng double precision,
  radius_km int default 5,
  min_notice_min int default 30,
  default_price_gbp numeric(10,2),
  special_interests text[] default '{}',
  rating_avg numeric(2,1) default 0,
  review_count int default 0,
  created_at timestamptz default now()
);

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(profile_id) on delete cascade,
  starts_at_utc timestamptz not null,
  ends_at_utc timestamptz not null,
  slot_status text not null default 'open' check (slot_status in ('open','held','booked','blocked'))
);

create table if not exists booking_holds (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references availability_slots(id) on delete cascade,
  doctor_id uuid not null references doctors(profile_id) on delete cascade,
  patient_id uuid not null references profiles(id) on delete cascade,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active','expired','converted','cancelled')),
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  doctor_id uuid not null references doctors(profile_id) on delete cascade,
  slot_id uuid not null references availability_slots(id),
  status text not null default 'pending_payment' check (status in ('pending_payment','confirmed','starting_soon','in_progress','completed','cancelled','no_show','refunded')),
  appointment_type text not null default 'clinic',
  reason_structured text,
  reason_text text,
  red_flag_result text default 'clear' check (red_flag_result in ('clear','blocked','override_required')),
  price_gbp numeric(10,2) not null,
  deposit_gbp numeric(10,2) not null,
  remainder_gbp numeric(10,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  payment_type text not null check (payment_type in ('deposit','remainder','refund')),
  stripe_payment_intent_id text,
  stripe_setup_intent_id text,
  amount_gbp numeric(10,2) not null,
  status text not null,
  idempotency_key text,
  receipt_url text,
  created_at timestamptz default now()
);

create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references chat_threads(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  message_type text not null default 'text' check (message_type in ('text','image')),
  body text,
  attachment_path text,
  moderation_status text not null default 'ok',
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  patient_id uuid not null references profiles(id),
  doctor_id uuid not null references doctors(profile_id),
  rating int not null check (rating between 1 and 5),
  tags_json jsonb default '[]'::jsonb,
  review_text text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_doctors_status on doctors(status);
create index if not exists idx_slots_doctor_time on availability_slots(doctor_id, starts_at_utc);
create index if not exists idx_holds_slot_status_exp on booking_holds(slot_id, status, expires_at);
create index if not exists idx_bookings_patient_created on bookings(patient_id, created_at desc);
create index if not exists idx_bookings_doctor_status on bookings(doctor_id, status);
create index if not exists idx_messages_thread_time on chat_messages(thread_id, created_at);
