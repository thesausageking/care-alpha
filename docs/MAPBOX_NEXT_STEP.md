# Mapbox First-Class Integration (Next Step)

Current state:
- Stable map rendering on iOS (Apple provider) + Android (Google provider).
- Branded style fallback active (reduced POI clutter + legible roads/labels).

Next step to make Mapbox primary:
1. Install Mapbox RN SDK (`@rnmapbox/maps`) with native setup.
2. Add `EXPO_PUBLIC_MAPBOX_TOKEN` secret.
3. Build `BrandedMap` abstraction:
   - `MapboxMap` as primary
   - `react-native-maps` fallback when token/module unavailable
4. Implement custom marker layers + clustering in Mapbox source/layer pipeline.
5. Add legal attribution footer per Mapbox requirements.
