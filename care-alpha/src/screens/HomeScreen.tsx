import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MapView from 'react-native-map-clustering';
import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Doctor, AvailabilityMode } from '../types';
import { doctors as mockDoctors } from '../data/mock';
import { light, radii, spacing } from '../theme/tokens';
import { SegmentedControl } from '../components/SegmentedControl';

type Props = {
  onBooked: (doctor: Doctor) => void;
};

export function HomeScreen({ onBooked }: Props) {
  const [mode, setMode] = useState<AvailabilityMode>('Now');
  const [time, setTime] = useState('15:00');
  const [selected, setSelected] = useState<Doctor | null>(null);

  const doctors = useMemo(() => {
    if (mode === 'Now') return mockDoctors.filter((d) => d.availableNow);
    return mockDoctors.filter((d) => d.availableTimes.includes(time));
  }, [mode, time]);

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Care.</Text>
        <SegmentedControl value={mode} options={['Now', 'Schedule']} onChange={setMode} />
        {mode === 'Schedule' && (
          <View style={styles.timeRow}>
            {['15:00', '15:30', '16:00'].map((t) => (
              <TouchableOpacity key={t} style={[styles.timePill, time === t && styles.timePillActive]} onPress={() => setTime(t)}>
                <Text style={[styles.timeText, time === t && styles.timeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: 51.515, longitude: -0.09, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
        clusterColor={light.primary}
      >
        {doctors.map((d) => (
          <Marker key={d.id} coordinate={{ latitude: d.lat, longitude: d.lng }} onPress={() => setSelected(d)}>
            <View style={styles.marker}>
              <Text style={styles.markerPrice}>£{d.price}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <ScrollView style={styles.sheet} contentContainerStyle={{ paddingBottom: 90 }}>
        {(selected ? [selected] : doctors).map((d) => (
          <View key={d.id} style={styles.card}>
            <Text style={styles.name}>{d.name}</Text>
            <Text style={styles.meta}>{d.specialty} • ★ {d.rating} ({d.reviews}) • {d.etaMin} min</Text>
            <Text style={styles.meta}>From £{d.price}</Text>
            <TouchableOpacity style={styles.cta} onPress={() => onBooked(d)}>
              <Text style={styles.ctaText}>Book now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: light.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  brand: { fontSize: 38, fontFamily: 'AvenirNext-Thin', color: light.text },
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  timePill: { backgroundColor: light.surface, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  timePillActive: { backgroundColor: light.primary },
  timeText: { color: light.text, fontWeight: '600' },
  timeTextActive: { color: '#fff' },
  map: { height: 300, margin: spacing.md, borderRadius: radii.lg },
  marker: { backgroundColor: light.navy, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  markerPrice: { color: '#fff', fontWeight: '700' },
  sheet: { flex: 1, paddingHorizontal: spacing.md },
  card: { backgroundColor: light.surface, borderRadius: radii.md, padding: spacing.lg, marginBottom: spacing.md },
  name: { fontSize: 18, fontWeight: '700', color: light.text },
  meta: { color: light.subtext, marginTop: 4 },
  cta: { marginTop: spacing.md, backgroundColor: light.primary, borderRadius: radii.md, alignItems: 'center', paddingVertical: 12 },
  ctaText: { color: '#fff', fontWeight: '700' },
});
