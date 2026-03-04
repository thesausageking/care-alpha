# Care. Production Build Spec (v1)

## Scope (Frozen)
- Region: London only
- Appointment type: Clinic only
- Pricing: Doctor sets own price, Care takes platform fee %
- Payments: Deposit at booking (Apple Pay), remainder after completion
- Verification: GMC + DBS + identity + insurance + admin approval
- Messaging: Text + optional image

## Delivery Sequence
1. Backend foundation (schema, RLS, role claims)
2. Booking hold + confirm transaction safety
3. Stripe webhook-confirmed booking
4. Patient + doctor auth flows
5. Doctor onboarding + approval
6. Messaging safety + moderation hooks
7. Launch hardening + App Store submission

## Non-negotiables
- No secrets in client
- Webhook is payment source-of-truth
- Booking blocked on emergency red flags
- Doctors not discoverable unless approved/live
- Full audit logging on critical actions
