import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ClusteredMapView from 'react-native-map-clustering';
import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

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

let Mapbox: any = null;
try {
  // Optional native module; may not exist in Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Mapbox = require('@rnmapbox/maps').default;
} catch {
  Mapbox = null;
}

const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (Mapbox && token) {
  try {
    Mapbox.setTelemetryEnabled(false);
    Mapbox.setAccessToken(token);
  } catch {
    // no-op
  }
}

export function MapSurface({ points, onSelect }: Props) {
  const center = useMemo(() => {
    if (!points.length) return { latitude: 51.515, longitude: -0.09, latitudeDelta: 0.06, longitudeDelta: 0.06 };
    return { latitude: points[0].lat, longitude: points[0].lng, latitudeDelta: 0.06, longitudeDelta: 0.06 };
  }, [points]);

  if (Mapbox && token) {
    return (
      <View style={styles.wrap}>
        <Mapbox.MapView style={styles.map} logoEnabled={false} attributionEnabled styleURL={Mapbox.StyleURL.Street}>
          <Mapbox.Camera zoomLevel={12.5} centerCoordinate={[center.longitude, center.latitude]} animationMode="easeTo" />
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

  // Safe fallback for Expo Go / no native Mapbox build.
  return (
    <View style={styles.wrap}>
      <ClusteredMapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={center}
        clusterColor="#0F766E"
      >
        {points.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} onPress={() => onSelect(p.id)}>
            <View style={styles.markerWrap}>
              <View style={styles.pricePill}><Text style={styles.priceText}>£{p.price}</Text></View>
              <View style={styles.pin}><Text style={styles.pinText}>✚</Text></View>
            </View>
          </Marker>
        ))}
      </ClusteredMapView>
      <View style={styles.attributionPill}><Text style={styles.attrText}>Fallback map</Text></View>
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
});
