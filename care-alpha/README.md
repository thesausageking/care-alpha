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

## Next integrations (in this order)
1. Supabase auth + profile creation
2. Doctor onboarding + GMC verification status
3. Slot search by distance + time
4. Booking creation + Stripe deposit checkout
5. Webhook for booking/payment status
6. Reviews + support flow

## Required keys
Copy `.env.example` to `.env` and fill values:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Note
This is an alpha scaffold to show users and pilot quickly. Compliance, legal docs, and production security hardening still required before public release.
