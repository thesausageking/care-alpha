import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './lib.supabase';

type Doctor = {
  id: string;
  name: string;
  price: number;
  rating: number;
  nextSlot: string;
  address: string;
  lat: number;
  lng: number;
  availableTimes: string[];
};

const LONDON_REGION: Region = {
  latitude: 51.515,
  longitude: -0.09,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr Khan', price: 65, rating: 4.8, nextSlot: '12:15', address: 'Liverpool Street Clinic', lat: 51.5176, lng: -0.0826, availableTimes: ['09:00', '10:30', '12:15', '14:00', '16:30'] },
  { id: 'd2', name: 'Dr Chen', price: 60, rating: 4.7, nextSlot: '12:30', address: 'Bank Medical Centre', lat: 51.5139, lng: -0.089, availableTimes: ['08:15', '10:00', '12:30', '13:45', '17:00'] },
  { id: 'd3', name: 'Dr Ahmed', price: 70, rating: 4.9, nextSlot: '13:00', address: 'Moorgate Practice', lat: 51.5187, lng: -0.0886, availableTimes: ['08:30', '11:00', '13:00', '15:30', '18:00'] },
];

const TIME_OPTIONS = buildTimeOptions('08:00', '20:00', 15);

export default function App() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [status, setStatus] = useState('Loading map...');
  const [region, setRegion] = useState<Region>(LONDON_REGION);
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [screen, setScreen] = useState<'map' | 'confirmed'>('map');
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.signInAnonymously();
        const uid = auth.user?.id;
        if (uid) {
          setPatientId(uid);
          await supabase.from('profiles').upsert({ id: uid, role: 'patient', full_name: 'Care User', is_verified: true });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('Location denied • defaulting to London');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      setStatus('');
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    (async () => {
      const url = new URL((globalThis as any).location.href);
      if (url.searchParams.get('payment') !== 'success') return;
      const raw = (globalThis as any).localStorage?.getItem('care_pending_booking');
      if (!raw) return;

      try {
        const p = JSON.parse(raw);
        await supabase.from('bookings').insert({
          patient_id: p.patientId,
          doctor_id: p.doctorId,
          consultation_price_gbp: p.consultationPriceGbp,
          deposit_gbp: p.depositGbp,
        });
        const doc = doctors.find((d) => d.id === p.doctorId) ?? null;
        setSelectedDoctor(doc);
        setScreen('confirmed');
      } finally {
        (globalThis as any).localStorage?.removeItem('care_pending_booking');
        url.searchParams.delete('payment');
        (globalThis as any).history.replaceState({}, '', url.toString());
      }
    })();
  }, [doctors]);

  const filteredDoctors = useMemo(() => doctors.filter((d) => d.availableTimes.includes(selectedTime)), [doctors, selectedTime]);
  const deposit = useMemo(() => Number((((selectedDoctor?.price ?? 0) * 0.15).toFixed(2)),), [selectedDoctor]);

  const startPayment = async () => {
    if (!selectedDoctor) return;
    if (!patientId) return setStatus('Please wait, loading account...');

    const api = process.env.EXPO_PUBLIC_PAYMENTS_API_URL;
    if (!api) return setStatus('Payments API missing');

    try {
      setIsPaying(true);
      const returnUrl = Platform.OS === 'web' ? `${(globalThis as any).location.origin}?payment=success` : 'care://payment-success';
      if (Platform.OS === 'web') {
        (globalThis as any).localStorage?.setItem('care_pending_booking', JSON.stringify({
          patientId,
          doctorId: selectedDoctor.id,
          consultationPriceGbp: selectedDoctor.price,
          depositGbp: deposit,
        }));
      }

      const res = await fetch(`${api}/create-checkout-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId, doctorId: selectedDoctor.id, doctorName: selectedDoctor.name,
          consultationPriceGbp: selectedDoctor.price, depositGbp: deposit, returnUrl,
        }),
      });
      const data = await res.json();
      if (!data?.url) throw new Error('No checkout URL');

      if (Platform.OS === 'web') (globalThis as any).location.href = data.url;
      else await Linking.openURL(data.url);
    } catch (e: any) {
      setStatus(`Payment error: ${e.message}`);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {screen === 'map' && (
        <View style={styles.container}>
          <MapView style={styles.map} region={region} showsUserLocation showsMyLocationButton>
            {filteredDoctors.map((d) => (
              <Marker key={d.id} coordinate={{ latitude: d.lat, longitude: d.lng }} onPress={() => setSelectedDoctor(d)}>
                <View style={[styles.markerChip, selectedDoctor?.id === d.id && styles.markerChipActive]}>
                  <Text style={styles.markerText}>£{d.price}</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          <View style={styles.floatingTop}>
            <View style={styles.iconRow}>
              <CircleIcon name="chevron-back" />
              <CircleIcon name="locate" onPress={() => setRegion({ ...region })} />
            </View>
            <Text style={styles.brand}>Care</Text>
            {!!status && <Text style={styles.status}>{status}</Text>}
            <Text style={styles.subtitle}>GP appointments</Text>

            <TouchableOpacity style={styles.timeBtn} onPress={() => setShowTimeMenu((v) => !v)}>
              <Text style={styles.timeBtnText}>Time {selectedTime} ▾</Text>
            </TouchableOpacity>

            {showTimeMenu && (
              <View style={styles.menu}>
                {TIME_OPTIONS.map((t) => (
                  <TouchableOpacity key={t} style={styles.menuItem} onPress={() => { setSelectedTime(t); setShowTimeMenu(false); }}>
                    <Text style={[styles.menuText, t === selectedTime && styles.menuTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choose appointment</Text>
            {selectedDoctor ? (
              <>
                <View style={styles.docCard}>
                  <View style={styles.row}><Text style={styles.docName}>{selectedDoctor.name}</Text><Text style={styles.docPrice}>£{selectedDoctor.price}</Text></View>
                  <Text style={styles.docMeta}>GP • ★ {selectedDoctor.rating} • {selectedDoctor.nextSlot}</Text>
                  <Text style={styles.docMeta}>{selectedDoctor.address}</Text>
                </View>
                <View style={styles.payRow}><Text style={styles.apple}> Pay deposit</Text><Text style={styles.docPrice}>£{deposit}</Text></View>
                <TouchableOpacity style={styles.cta} onPress={startPayment}>
                  <Text style={styles.ctaText}>{isPaying ? 'Opening Apple Pay...' : `Choose ${selectedDoctor.name}`}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.docMeta}>Tap a GP marker to continue</Text>
            )}
          </View>
        </View>
      )}

      {screen === 'confirmed' && selectedDoctor && (
        <View style={styles.confirmWrap}>
          <Text style={styles.confirmTitle}>Booking Confirmed</Text>
          <Text style={styles.confirmText}>{selectedDoctor.name}</Text>
          <Text style={styles.confirmText}>{selectedTime} • {selectedDoctor.address}</Text>
          <Text style={styles.confirmText}>Arrive 5 mins early. Bring photo ID.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => setScreen('map')}><Text style={styles.ctaText}>Back to map</Text></TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function CircleIcon({ name, onPress }: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.circle} onPress={onPress}>
      <Ionicons name={name} size={18} color="#0F172A" />
    </TouchableOpacity>
  );
}

function buildTimeOptions(start: string, end: string, step: number) {
  const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const fromMin = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  const out: string[] = [];
  for (let t = toMin(start); t <= toMin(end); t += step) out.push(fromMin(t));
  return out;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  map: { flex: 1 },
  floatingTop: { position: 'absolute', top: 10, left: 12, right: 12 },
  iconRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  circle: { width: 38, height: 38, borderRadius: 999, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 12, fontWeight: '700', color: '#1D4ED8', marginTop: 2 },
  status: { fontSize: 11, color: '#475569' },
  timeBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  timeBtnText: { fontWeight: '700', color: '#0F172A' },
  menu: { marginTop: 6, maxHeight: 190, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' },
  menuItem: { paddingHorizontal: 12, paddingVertical: 8 },
  menuText: { color: '#334155' },
  menuTextActive: { color: '#0F172A', fontWeight: '800' },
  markerChip: { backgroundColor: '#0B1F3A', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  markerChipActive: { backgroundColor: '#1D4ED8' },
  markerText: { color: 'white', fontWeight: '800', fontSize: 12 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 14, gap: 8,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  docCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 10, gap: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  docName: { fontWeight: '800', color: '#0F172A' },
  docPrice: { fontWeight: '800', color: '#1D4ED8' },
  docMeta: { color: '#475569', fontSize: 13 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10 },
  apple: { fontWeight: '700', color: '#0F172A' },
  cta: { backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ctaText: { color: 'white', fontWeight: '800' },
  confirmWrap: { flex: 1, padding: 20, justifyContent: 'center', gap: 8 },
  confirmTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  confirmText: { fontSize: 16, color: '#334155' },
});
