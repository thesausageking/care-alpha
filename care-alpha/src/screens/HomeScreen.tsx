import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  const [movedArea, setMovedArea] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [offline, setOffline] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

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
              <TouchableOpacity
                key={t}
                style={[styles.timePill, time === t && styles.timePillActive]}
                onPress={() => setTime(t)}
                accessibilityRole="button"
                accessibilityLabel={`Schedule for ${t}`}
              >
                <Text style={[styles.timeText, time === t && styles.timeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.statusRow}>
          <TouchableOpacity style={styles.statusPill} onPress={() => setOffline((v) => !v)}>
            <Text style={styles.statusText}>{offline ? 'Offline mode' : 'Online'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statusPill} onPress={() => setLocationDenied((v) => !v)}>
            <Text style={styles.statusText}>{locationDenied ? 'Location denied' : 'Location on'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {locationDenied ? (
        <View style={[styles.map, styles.mapState]}>
          <Text style={styles.name}>Location required</Text>
          <Text style={styles.meta}>Enable location to find doctors nearby.</Text>
        </View>
      ) : offline ? (
        <View style={[styles.map, styles.mapState]}>
          <Text style={styles.name}>You are offline</Text>
          <Text style={styles.meta}>Reconnect to search and book doctors.</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{ latitude: 51.515, longitude: -0.09, latitudeDelta: 0.06, longitudeDelta: 0.06 }}
          onRegionChangeComplete={() => setMovedArea(true)}
          clusterColor={light.primary}
        >
          {doctors.map((d) => (
            <Marker
              key={d.id}
              coordinate={{ latitude: d.lat, longitude: d.lng }}
              onPress={() => {
                if (!reduceMotion) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(d);
              }}
              accessibilityLabel={`${d.name}, ${d.specialty}, price ${d.price} pounds`}
            >
              <View style={styles.marker}>
                <Text style={styles.markerPrice}>£{d.price}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {movedArea && (
        <TouchableOpacity style={styles.searchAreaBtn} onPress={() => setMovedArea(false)}>
          <Text style={styles.searchAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.sheet} contentContainerStyle={{ paddingBottom: 90 }}>
        {selected ? (
          <View style={styles.profileSheet}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{selected.name}</Text>
                <Text style={styles.meta}>{selected.specialty} • ★ {selected.rating} ({selected.reviews})</Text>
                <Text style={styles.meta}>Verified clinician • {selected.etaMin} min away</Text>
              </View>
            </View>

            <View style={styles.chipsRow}>
              {selected.interests.slice(0, 3).map((i) => (
                <View key={i} style={styles.interestChip}><Text style={styles.interestText}>{i}</Text></View>
              ))}
            </View>

            <Text style={styles.meta}>Consultation fee: £{selected.price}</Text>
            <Text style={styles.meta}>Deposit today: £{Math.round(selected.price * 0.3)}</Text>
            <Text style={styles.meta}>Cancellation: 50% fee for no-show/late cancel</Text>

            <View style={styles.slotRow}>
              {['Now', '15:30', '16:00'].map((s) => (
                <TouchableOpacity key={s} style={styles.slotPill}><Text style={styles.slotText}>{s}</Text></TouchableOpacity>
              ))}
            </View>

            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setSelected(null)}>
                <Text style={styles.secondaryText}>Back to map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cta, styles.rowCta]}
                onPress={() => {
                  if (offline) {
                    setPaymentFailed(true);
                    return;
                  }
                  if (!reduceMotion) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  onBooked(selected);
                }}
                accessibilityRole="button"
                accessibilityLabel="Book now"
              >
                <Text style={styles.ctaText}>Book now</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : doctors.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.name}>No doctors available</Text>
            <Text style={styles.meta}>{mode === 'Now' ? 'No nearby doctors right now.' : `No doctors available at ${time}.`}</Text>
          </View>
        ) : (
          doctors.map((d) => (
            <View key={d.id} style={styles.card}>
              <Text style={styles.name}>{d.name}</Text>
              <Text style={styles.meta}>{d.specialty} • ★ {d.rating} ({d.reviews}) • {d.etaMin} min</Text>
              <Text style={styles.meta}>From £{d.price}</Text>
              <TouchableOpacity style={styles.cta} onPress={() => setSelected(d)}>
                <Text style={styles.ctaText}>View profile</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {paymentFailed && (
        <View style={styles.errorToast}>
          <Text style={styles.errorText}>Payment failed. Please retry.</Text>
          <TouchableOpacity onPress={() => setPaymentFailed(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: light.bg },
  topBar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  brand: { fontSize: 38, fontFamily: 'AvenirNext-Thin', color: light.text },
  timeRow: { flexDirection: 'row', gap: spacing.sm },
  statusRow: { flexDirection: 'row', gap: spacing.sm },
  statusPill: { backgroundColor: light.surface, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  statusText: { color: light.subtext, fontSize: 12, fontWeight: '600' },
  timePill: { backgroundColor: light.surface, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  timePillActive: { backgroundColor: light.primary },
  timeText: { color: light.text, fontWeight: '600' },
  timeTextActive: { color: '#fff' },
  map: { height: 300, margin: spacing.md, borderRadius: radii.lg },
  mapState: { backgroundColor: light.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: light.border },
  searchAreaBtn: {
    position: 'absolute',
    top: 170,
    alignSelf: 'center',
    zIndex: 20,
    backgroundColor: light.navy,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchAreaText: { color: '#fff', fontWeight: '700' },
  marker: { backgroundColor: light.navy, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  markerPrice: { color: '#fff', fontWeight: '700' },
  sheet: { flex: 1, paddingHorizontal: spacing.md },
  card: { backgroundColor: light.surface, borderRadius: radii.md, padding: spacing.lg, marginBottom: spacing.md },
  profileSheet: { backgroundColor: light.surface, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md },
  profileHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 999, backgroundColor: light.primarySoft },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  interestChip: { backgroundColor: light.primarySoft, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  interestText: { color: light.primary, fontWeight: '600', fontSize: 12 },
  slotRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  slotPill: { backgroundColor: '#EEF2FF', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 8 },
  slotText: { color: light.text, fontWeight: '600' },
  rowActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: light.border, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', minHeight: 46 },
  secondaryText: { color: light.text, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: light.text },
  meta: { color: light.subtext, marginTop: 4 },
  cta: { marginTop: spacing.md, backgroundColor: light.primary, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', minHeight: 46, paddingHorizontal: 14 },
  rowCta: { flex: 1, marginTop: 0 },
  ctaText: { color: '#fff', fontWeight: '700' },
  errorToast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 86,
    backgroundColor: '#FEE2E2',
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: { color: '#991B1B', fontWeight: '600' },
  retryText: { color: light.navy, fontWeight: '700' },
});
