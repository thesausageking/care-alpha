-- Care Alpha (London) - MVP schema

create table if not exists profiles (
  id uuid primary key,
  role text not null check (role in ('patient','doctor')),
  full_name text not null,
  date_of_birth date,
  is_verified boolean default false,
  created_at timestamptz default now()
);

create table if not exists doctors (
  id uuid primary key references profiles(id) on delete cascade,
  gmc_number text unique not null,
  gmc_status text not null default 'pending', -- pending|verified|rejected
  clinic_address text not null,
  price_gbp integer not null,
  is_online boolean default false,
  rating numeric(2,1) default 0,
  review_count integer default 0,
  created_at timestamptz default now()
);

create table if not exists availability_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean default false
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  doctor_id uuid not null references doctors(id) on delete cascade,
  slot_id uuid not null references availability_slots(id),
  status text not null default 'confirmed', -- confirmed|cancelled|completed|no_show
  consultation_price_gbp integer not null,
  deposit_gbp integer not null,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique not null references bookings(id) on delete cascade,
  patient_id uuid not null references profiles(id),
  doctor_id uuid not null references doctors(id),
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- index essentials
create index if not exists idx_doctors_online on doctors(is_online);
create index if not exists idx_slots_doctor_time on availability_slots(doctor_id, starts_at);
create index if not exists idx_bookings_patient on bookings(patient_id, created_at desc);
