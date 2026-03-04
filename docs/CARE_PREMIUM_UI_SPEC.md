# CARE Premium UI Prototype (React Native + Expo + TypeScript)

## File structure
- `App.tsx` (app shell, splash, tabs, app states)
- `src/theme/tokens.ts` (light/dark tokens)
- `src/types/index.ts` (shared app types)
- `src/data/mock.ts` (mock doctor data)
- `src/components/SegmentedControl.tsx`
- `src/components/StateViews.tsx`
- `src/screens/HomeScreen.tsx` (map, filters, discovery + book)
- `src/screens/MessagesScreen.tsx` (full-screen chat)
- `src/screens/BookingsScreen.tsx` (confirmation/receipt state)
- `src/screens/ProfileScreen.tsx` (simple profile)

## Run
```bash
cd care-alpha
npm install
npm run ios   # or npm run android
```

## States included
- Splash (branded CARE animation)
- Loading state
- Empty state component
- Error state component
- Offline state placeholder

## Motion specs
- Splash letter reveal: 700–1000ms total
- Dot slide-in: ~260ms
- Tab transitions: native immediate for responsiveness
- Marker tap feedback: immediate card focus

## Interaction specs
- Home: Now/Schedule mode switch
- Schedule: time chip filters
- Marker tap: focuses doctor card
- Book now: routes to bookings experience
- Messages: full-screen thread + bottom composer
- Bookings: confirmed state + deposit/remainder visibility

## Accessibility
- Minimum touch targets around 44px on core controls
- Tab buttons with labels
- High contrast text + semantic colors
- Clear loading/empty/error copy

## Map choice
- Uses `react-native-map-clustering` wrapper + `react-native-maps` markers.
- Supports custom marker visuals, clustering, and map styling path for premium brand.
