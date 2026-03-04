# CARE Premium Mobile UI Prototype

React Native + Expo + TypeScript prototype for CARE (on-demand doctors nearby).

## Run
```bash
cd care-alpha
npm install
npm run ios
# or
npm run android
```

## What is implemented
- Tabs: Map, Messages, Bookings, Profile
- Map-first discovery with marker price pills and clustering
- Now/Schedule mode (30-min schedule chips)
- Doctor profile sheet style surface
- Booking handoff and confirmation path
- Messages lock/unlock behavior (support always available)
- Bookings segmented view (Upcoming/Past/Cancelled)
- Profile settings groups
- Splash + loading choreography
- Edge states:
  - No doctors nearby
  - No doctors at selected time
  - Offline mode
  - Location denied
  - Payment failure + retry toast
  - Messaging unavailable until booking
  - Session timeout simulation + re-auth state

## Architecture
- `src/theme/tokens.ts` design tokens (color, spacing, radius)
- `src/theme/motion.ts` motion constants
- `src/data/mock.ts` mock doctors data model
- `src/screens/*` screen-level modules
- `src/components/*` reusable UI primitives

## Notes
- Map uses `react-native-map-clustering` + `react-native-maps` marker overlays.
- Haptics implemented via `expo-haptics`, reduced-motion aware fallback.
- Current build is investor-demo focused; backend wiring remains separate.
