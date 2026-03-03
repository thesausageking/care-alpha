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
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
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

const DEFAULT_REGION: Region = {
  latitude: 51.515,
  longitude: -0.09,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const GP_DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr Khan',
    price: 65,
    rating: 4.8,
    nextSlot: '12:15',
    address: 'Liverpool Street Clinic',
    lat: 51.5176,
    lng: -0.0826,
    availableTimes: ['10:00', '11:30', '12:15', '13:00', '14:15', '16:30'],
  },
  {
    id: 'd2',
    name: 'Dr Chen',
    price: 60,
    rating: 4.7,
    nextSlot: '12:30',
    address: 'Bank Medical Centre',
    lat: 51.5139,
    lng: -0.089,
    availableTimes: ['09:15', '10:45', '12:30', '13:30', '15:00', '17:45'],
  },
  {
    id: 'd3',
    name: 'Dr Ahmed',
    price: 70,
    rating: 4.9,
    nextSlot: '13:00',
    address: 'Moorgate Private Practice',
    lat: 51.5187,
    lng: -0.0886,
    availableTimes: ['08:30', '10:00', '11:00', '13:00', '14:45', '18:00'],
  },
];

const TIME_OPTIONS = buildTimeOptions('08:00', '20:00', 15);

export default function App() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [status, setStatus] = useState('Connecting...');
  const [doctors, setDoctors] = useState<Doctor[]>(GP_DOCTORS);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [screen, setScreen] = useState<'map' | 'confirmed'>('map');
  const [isPaying, setIsPaying] = useState(false);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [showTimeMenu, setShowTimeMenu] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: auth } = await supabase.auth.signInAnonymously();
        const uid = auth.user?.id;
        if (uid) {
          setPatientId(uid);
          await supabase.from('profiles').upsert({
            id: uid,
            role: 'patient',
            full_name: 'Care User',
            is_verified: true,
          });
        }

        const { data, error } = await supabase
          .from('doctors')
          .select('id,price_gbp,rating,clinic_address,profiles!inner(full_name)')
          .eq('is_online', true)
          .limit(40);

        if (error) throw error;

        if (data?.length) {
          const mapped: Doctor[] = data.map((d: any, i: number) => ({
            id: d.id,
            name: d.profiles.full_name,
            price: Number(d.price_gbp ?? 60),
            rating: Number(d.rating ?? 4.7),
            nextSlot: ['10:00', '11:30', '12:15', '13:00', '14:30'][i % 5],
            address: d.clinic_address ?? 'City of London Clinic',
            lat: 51.512 + i * 0.004,
            lng: -0.095 + i * 0.004,
            availableTimes: ['10:00', '11:30', '12:15', '13:00', '14:30', '16:00'],
          }));
          setDoctors(mapped);
        }

        setStatus('Live data connected');
      } catch (e: any) {
        setDoctors(GP_DOCTORS);
        setStatus(`Using GP demo data (${e.message})`);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus((s) => `${s} • Location off`);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      });
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    (async () => {
      const url = new URL((globalThis as any).location.href);
      const payment = url.searchParams.get('payment');
      if (payment !== 'success') return;

      const raw = (globalThis as any).localStorage?.getItem('care_pending_booking');
      if (!raw) return;

      try {
        const pending = JSON.parse(raw);
        await supabase.from('bookings').insert({
          patient_id: pending.patientId,
          doctor_id: pending.doctorId,
          consultation_price_gbp: pending.consultationPriceGbp,
          deposit_gbp: pending.depositGbp,
        });

        const chosen = doctors.find((d) => d.id === pending.doctorId) ?? null;
        setSelectedDoctor(chosen);
        setScreen('confirmed');
        setStatus('Payment complete ✅ Booking confirmed');
      } catch (e: any) {
        setStatus(`Return handling failed: ${e.message}`);
      } finally {
        (globalThis as any).localStorage?.removeItem('care_pending_booking');
        url.searchParams.delete('payment');
        (globalThis as any).history.replaceState({}, '', url.toString());
      }
    })();
  }, [doctors]);

  const filteredDoctors = useMemo(
    () => doctors.filter((d) => d.availableTimes.includes(selectedTime)),
    [doctors, selectedTime],
  );

  const deposit = useMemo(() => {
    if (!selectedDoctor) return 0;
    return Number((selectedDoctor.price * 0.15).toFixed(2));
  }, [selectedDoctor]);

  const startPayment = async () => {
    if (!selectedDoctor) return setStatus('Tap a GP pin first');
    if (!patientId) return setStatus('Auth not ready yet');

    const api = process.env.EXPO_PUBLIC_PAYMENTS_API_URL;
    if (!api) return setStatus('Missing EXPO_PUBLIC_PAYMENTS_API_URL');

    try {
      setIsPaying(true);
      const returnUrl =
        Platform.OS === 'web'
          ? `${(globalThis as any).location.origin}?payment=success`
          : 'care://payment-success';

      if (Platform.OS === 'web') {
        (globalThis as any).localStorage?.setItem(
          'care_pending_booking',
          JSON.stringify({
            patientId,
            doctorId: selectedDoctor.id,
            consultationPriceGbp: selectedDoctor.price,
            depositGbp: deposit,
          }),
        );
      }

      const res = await fetch(`${api}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          consultationPriceGbp: selectedDoctor.price,
          depositGbp: deposit,
          returnUrl,
        }),
      });

      if (!res.ok) throw new Error(`Payment API failed ${res.status}`);
      const data = await res.json();
      if (!data?.url) throw new Error('No checkout URL');

      if (Platform.OS === 'web') {
        (globalThis as any).location.href = data.url;
      } else {
        await Linking.openURL(data.url);
      }
    } catch (e: any) {
      setStatus(`Payment error: ${e.message}`);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {screen === 'map' && (
        <View style={styles.container}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={region}
            region={region}
            showsUserLocation
            showsMyLocationButton
          >
            {filteredDoctors.map((d) => (
              <Marker
                key={d.id}
                coordinate={{ latitude: d.lat, longitude: d.lng }}
                onPress={() => setSelectedDoctor(d)}
              >
                <View style={[styles.pin, selectedDoctor?.id === d.id && styles.pinActive]}>
                  <Text style={styles.pinText}>£{d.price}</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          <View style={styles.topOverlay}>
            <Text style={styles.logo}>Care</Text>
            <Text style={styles.status}>{status}</Text>
            <Text style={styles.gpOnly}>GP only</Text>

            <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimeMenu((v) => !v)}>
              <Text style={styles.timeButtonText}>Time: {selectedTime} ▾</Text>
            </TouchableOpacity>

            {showTimeMenu && (
              <View style={styles.timeMenu}>
                {TIME_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeOption, selectedTime === t && styles.timeOptionActive]}
                    onPress={() => {
                      setSelectedTime(t);
                      setShowTimeMenu(false);
                    }}
                  >
                    <Text style={styles.timeOptionText}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {selectedDoctor ? (
            <View style={styles.bottomSheet}>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{selectedDoctor.name}</Text>
                <Text style={styles.price}>£{selectedDoctor.price}</Text>
              </View>
              <Text style={styles.meta}>★ {selectedDoctor.rating} • GP • Next {selectedDoctor.nextSlot}</Text>
              <Text style={styles.meta}>{selectedDoctor.address}</Text>
              <TouchableOpacity style={styles.bookBtn} onPress={startPayment}>
                <Text style={styles.bookBtnText}>{isPaying ? 'Opening Apple Pay…' : `Book now • Pay £${deposit} deposit`}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomHint}>
              <Text style={styles.meta}>Pick time, then tap a GP pin</Text>
            </View>
          )}
        </View>
      )}

      {screen === 'confirmed' && selectedDoctor && (
        <View style={styles.confirmScreen}>
          <Text style={styles.confirmTitle}>Booking Confirmed ✅</Text>
          <Text style={styles.confirmText}>{selectedDoctor.name}</Text>
          <Text style={styles.confirmText}>{selectedTime} • GP appointment</Text>
          <Text style={styles.confirmText}>{selectedDoctor.address}</Text>
          <Text style={styles.confirmText}>Arrive 5 minutes early. Bring photo ID.</Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => setScreen('map')}>
            <Text style={styles.bookBtnText}>Back to map</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function buildTimeOptions(start: string, end: string, stepMin: number) {
  const toMin = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
  const fromMin = (m: number) => {
    const h = Math.floor(m / 60).toString().padStart(2, '0');
    const mm = (m % 60).toString().padStart(2, '0');
    return `${h}:${mm}`;
  };

  const out: string[] = [];
  for (let t = toMin(start); t <= toMin(end); t += stepMin) out.push(fromMin(t));
  return out;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1F3A' },
  container: { flex: 1 },
  map: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    top: 6,
    left: 10,
    right: 10,
    zIndex: 20,
    backgroundColor: '#ffffffee',
    borderRadius: 14,
    padding: 10,
  },
  logo: { fontSize: 24, fontWeight: '800', color: '#0B1F3A' },
  status: { fontSize: 11, color: '#334155' },
  gpOnly: { fontSize: 12, fontWeight: '700', color: '#1D4ED8', marginTop: 4 },
  timeButton: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  timeButtonText: { fontSize: 13, color: '#0B1F3A', fontWeight: '700' },
  timeMenu: {
    marginTop: 6,
    maxHeight: 180,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  timeOption: { paddingHorizontal: 10, paddingVertical: 8 },
  timeOptionActive: { backgroundColor: '#DBEAFE' },
  timeOptionText: { color: '#0F172A', fontSize: 13 },
  pin: {
    backgroundColor: '#0B1F3A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pinActive: { backgroundColor: '#1D4ED8' },
  pinText: { color: 'white', fontWeight: '800', fontSize: 12 },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 14,
    gap: 6,
  },
  bottomHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 14,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  price: { fontSize: 18, fontWeight: '800', color: '#1D4ED8' },
  meta: { color: '#475569', fontSize: 13 },
  bookBtn: {
    marginTop: 8,
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  bookBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  confirmScreen: { flex: 1, backgroundColor: 'white', padding: 20, justifyContent: 'center', gap: 8 },
  confirmTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  confirmText: { color: '#334155', fontSize: 16 },
});
