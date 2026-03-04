-- 002_rls.sql
-- Least-privilege RLS starter

alter table profiles enable row level security;
alter table doctors enable row level security;
alter table availability_slots enable row level security;
alter table booking_holds enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table chat_threads enable row level security;
alter table chat_messages enable row level security;
alter table reviews enable row level security;
alter table audit_logs enable row level security;

-- PROFILES
create policy "profile_self_select" on profiles for select using (id = auth.uid());
create policy "profile_self_update" on profiles for update using (id = auth.uid());

-- DOCTORS: patients can view live doctors; doctors can manage self
create policy "doctor_live_public" on doctors for select using (status = 'live');
create policy "doctor_self_manage" on doctors for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- SLOTS: view only for live doctors
create policy "slots_live_doctors_view" on availability_slots for select
using (exists (select 1 from doctors d where d.profile_id = doctor_id and d.status = 'live'));

-- HOLDS: patient own only
create policy "hold_patient_select" on booking_holds for select using (patient_id = auth.uid());
create policy "hold_patient_insert" on booking_holds for insert with check (patient_id = auth.uid());

-- BOOKINGS
create policy "booking_patient_select" on bookings for select using (patient_id = auth.uid());
create policy "booking_doctor_select" on bookings for select using (doctor_id = auth.uid());
create policy "booking_patient_insert" on bookings for insert with check (patient_id = auth.uid());

-- PAYMENTS: participants read only
create policy "payments_participant_read" on payments for select
using (exists (select 1 from bookings b where b.id = booking_id and (b.patient_id = auth.uid() or b.doctor_id = auth.uid())));

-- CHAT THREADS & MESSAGES: booking participants only
create policy "thread_participant_read" on chat_threads for select using (
  exists (select 1 from bookings b where b.id = booking_id and (b.patient_id = auth.uid() or b.doctor_id = auth.uid()))
);

create policy "message_participant_read" on chat_messages for select using (
  exists (
    select 1 from chat_threads t
    join bookings b on b.id = t.booking_id
    where t.id = thread_id and (b.patient_id = auth.uid() or b.doctor_id = auth.uid())
  )
);

create policy "message_participant_insert" on chat_messages for insert with check (
  exists (
    select 1 from chat_threads t
    join bookings b on b.id = t.booking_id
    where t.id = thread_id and (b.patient_id = auth.uid() or b.doctor_id = auth.uid())
  ) and sender_id = auth.uid()
);

-- REVIEWS: patient creates own completed booking review
create policy "review_patient_insert" on reviews for insert with check (
  patient_id = auth.uid() and exists (
    select 1 from bookings b where b.id = booking_id and b.patient_id = auth.uid() and b.status = 'completed'
  )
);
create policy "review_public_read" on reviews for select using (true);

-- AUDIT LOGS: no direct user access
-- (admin/internal service role only)
