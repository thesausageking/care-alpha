import { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  price: number;
  label: string;
};

type Props = {
  points: MapPoint[];
  onSelect: (id: string) => void;
};

Mapbox.setTelemetryEnabled(false);
const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (token) {
  Mapbox.setAccessToken(token);
}

export function MapSurface({ points, onSelect }: Props) {
  const hasToken = !!token;

  const center = useMemo(() => {
    if (!points.length) return [-0.09, 51.515] as [number, number];
    return [points[0].lng, points[0].lat] as [number, number];
  }, [points]);

  if (!hasToken) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Mapbox token missing</Text>
        <Text style={styles.fallbackText}>Set EXPO_PUBLIC_MAPBOX_TOKEN to enable premium map style.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Mapbox.MapView
        style={styles.map}
        logoEnabled={false}
        attributionEnabled
        styleURL={Mapbox.StyleURL.Street}
        compassEnabled
        scaleBarEnabled={false}
      >
        <Mapbox.Camera zoomLevel={12.5} centerCoordinate={center} animationMode="easeTo" />

        {points.map((p) => (
          <Mapbox.PointAnnotation key={p.id} id={p.id} coordinate={[p.lng, p.lat]} onSelected={() => onSelect(p.id)}>
            <View style={styles.markerWrap}>
              <View style={styles.pricePill}><Text style={styles.priceText}>£{p.price}</Text></View>
              <View style={styles.pin}><Text style={styles.pinText}>✚</Text></View>
            </View>
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
      <View style={styles.attributionPill}><Text style={styles.attrText}>Mapbox</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 18, overflow: 'hidden' },
  map: { flex: 1 },
  markerWrap: { alignItems: 'center' },
  pricePill: { backgroundColor: '#0B1F3A', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 4 },
  priceText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  pin: { width: 26, height: 26, borderRadius: 999, backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center' },
  pinText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  attributionPill: { position: 'absolute', bottom: 8, right: 8, backgroundColor: '#ffffffdd', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  attrText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  fallback: { flex: 1, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', padding: 16 },
  fallbackTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  fallbackText: { marginTop: 6, color: '#475569', textAlign: 'center' },
});
