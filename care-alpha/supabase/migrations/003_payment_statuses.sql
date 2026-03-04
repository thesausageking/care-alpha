-- 003_payment_statuses.sql
-- Small hardening for payment/booking workflow.

alter table payments
  add column if not exists updated_at timestamptz default now();

create unique index if not exists ux_payments_stripe_pi on payments(stripe_payment_intent_id)
where stripe_payment_intent_id is not null;

create index if not exists idx_bookings_status_updated on bookings(status, updated_at desc);
