# Care. Engineering Tickets (Execution Starter)

## T1 — Core schema migration
- Owner: backend
- Depends: none
- Description: Apply 001_core.sql to dev/staging; validate all tables/indexes.
- Acceptance: migrations pass; schema introspection matches spec.

## T2 — RLS enforcement
- Owner: backend/security
- Depends: T1
- Description: Apply 002_rls.sql; add policy tests for patient/doctor/admin scenarios.
- Acceptance: unauthorized cross-user reads fail; expected reads pass.

## T3 — Role claims strategy
- Owner: backend
- Depends: T1
- Description: Implement custom JWT claim mapping (`app_role`) and admin role assignment flow.
- Acceptance: role-specific RLS behavior verified.

## T4 — Booking hold edge function
- Owner: backend
- Depends: T1,T2
- Description: Transaction-safe hold creation with TTL + slot lock.
- Acceptance: no double-holds on same slot under concurrency test.

## T5 — Deposit payment intent edge function
- Owner: backend/payments
- Depends: T4
- Description: Create Stripe PI with idempotency and off-session setup capture.
- Acceptance: returns client secret only for valid active hold.

## T6 — Stripe webhook handler
- Owner: backend/payments
- Depends: T5
- Description: Verify signature, process deposit success, finalize booking.
- Acceptance: booking confirmed only after webhook success.

## T7 — Patient auth + onboarding
- Owner: frontend
- Depends: T2
- Description: Apple/Google/email auth, terms/privacy acceptance, lightweight identity checks.
- Acceptance: new patient account completes onboarding and can browse doctors.

## T8 — Doctor onboarding + verification
- Owner: frontend/backend/admin
- Depends: T1,T2,T3
- Description: GMC/DBS/insurance/identity uploads + admin review workflow.
- Acceptance: only `live` doctors visible/bookable.

## T9 — Messaging safety layer
- Owner: backend/frontend/security
- Depends: T1,T2
- Description: Booking-bound chat, optional images, basic phone/email leakage detection + report hooks.
- Acceptance: only participants can message; leak warnings trigger.

## T10 — Launch hardening pack
- Owner: devops/compliance
- Depends: T1..T9
- Description: Sentry, audit log checks, legal docs hooks, TestFlight checklist.
- Acceptance: release candidate meets DoD launch gate.
