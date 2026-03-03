# Care Alpha (iOS MVP)

Working alpha for "Uber for private doctor appointments" in London.

## What is included
- React Native (Expo + TypeScript) app shell
- Click-through patient + doctor core flows in native UI
- Deep navy brand style
- Supabase SQL schema for profiles/doctors/availability/bookings/reviews
- Env template for Supabase + Stripe

## Run
```bash
cd care-alpha
npm install
npm run ios
```

## Current integration status
1. Supabase anonymous auth + patient profile upsert ✅
2. Live doctor list pulled from Supabase (`doctors` + `profiles`) ✅
3. Booking insert on confirm (deposit + price) ✅
4. Stripe payment is still mocked in-app (next step)

## Next integrations (in order)
1. Real Stripe PaymentSheet + backend intent endpoint
2. Doctor onboarding + GMC verification workflow
3. Slot search by distance + time
4. Webhooks for payment/booking status
5. Reviews + support flow

## Required keys
Copy `.env.example` to `.env` and fill values:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Note
This is an alpha scaffold to show users and pilot quickly. Compliance, legal docs, and production security hardening still required before public release.
