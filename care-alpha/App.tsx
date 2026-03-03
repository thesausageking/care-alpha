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
import { supabase } from './lib.supabase';

type Doctor = {
  id: string;
  name: string;
  price: number;
  rating: number;
  type: 'GP' | 'ENT' | 'Dermatology';
  etaMin: number;
  nextSlot: string;
  address: string;
};

const MOCK_DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr Khan', price: 65, rating: 4.8, type: 'GP', etaMin: 6, nextSlot: '12:15', address: 'Liverpool Street Clinic' },
  { id: 'd2', name: 'Dr Patel', price: 55, rating: 4.7, type: 'ENT', etaMin: 9, nextSlot: '12:40', address: 'Bank Medical Centre' },
  { id: 'd3', name: 'Dr Williams', price: 75, rating: 4.9, type: 'Dermatology', etaMin: 11, nextSlot: '13:00', address: 'Moorgate Private Practice' },
  { id: 'd4', name: 'Dr Chen', price: 60, rating: 4.6, type: 'GP', etaMin: 8, nextSlot: '13:15', address: 'City Clinic EC2' },
  { id: 'd5', name: 'Dr Ali', price: 70, rating: 4.9, type: 'ENT', etaMin: 5, nextSlot: '13:30', address: 'Aldgate Health Rooms' },
];

export default function App() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [status, setStatus] = useState('Connecting...');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedType, setSelectedType] = useState<'All' | 'GP' | 'ENT' | 'Dermatology'>('All');
  const [selectedTime, setSelectedTime] = useState<'Now' | '12:30' | '13:00' | '13:30'>('Now');
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

        const mapped: Doctor[] = (data?.length ? data : MOCK_DOCTORS).map((d: any, i: number) => ({
          id: d.id,
          name: d.profiles?.full_name ?? d.name,
          price: Number(d.price_gbp ?? d.price),
          rating: Number(d.rating ?? 4.7),
          type: (['GP', 'ENT', 'Dermatology'][i % 3] as Doctor['type']),
          etaMin: [5, 7, 8, 10, 12][i % 5],
          nextSlot: ['12:15', '12:40', '13:00', '13:15', '13:30'][i % 5],
          address: d.clinic_address ?? d.address ?? 'City of London Clinic',
        }));

        setDoctors(mapped);
        setStatus('Live data connected ✅');
      } catch (e: any) {
        setDoctors(MOCK_DOCTORS);
        setStatus(`Using local doctor data (${e.message})`);
      }
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

        const chosen = doctors.find((d) => d.id === pending.doctorId) ?? selectedDoctor;
        setSelectedDoctor(chosen ?? null);
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
  }, [doctors, selectedDoctor]);

  const filteredDoctors = useMemo(() => {
    let list = doctors;
    if (selectedType !== 'All') list = list.filter((d) => d.type === selectedType);
    if (selectedTime !== 'Now') list = list.filter((d) => d.nextSlot <= selectedTime);
    return list;
  }, [doctors, selectedType, selectedTime]);

  const deposit = useMemo(() => {
    if (!selectedDoctor) return 0;
    return Number((selectedDoctor.price * 0.15).toFixed(2));
  }, [selectedDoctor]);

  const startPayment = async () => {
    if (!selectedDoctor) return setStatus('Select a doctor pin first');
    if (!patientId) return setStatus('Auth not ready yet');

    const api = process.env.EXPO_PUBLIC_PAYMENTS_API_URL;
    if (!api) return setStatus('Missing EXPO_PUBLIC_PAYMENTS_API_URL');

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
      if (!data?.url) throw new Error('No checkout url');

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
        <View style={styles.mapScreen}>
          <View style={styles.topOverlay}>
            <Text style={styles.logo}>Care</Text>
            <Text style={styles.subStatus}>{status}</Text>

            <View style={styles.filterRow}>
              <FilterPill label={selectedType} onPress={() => cycleType(setSelectedType)} />
              <FilterPill label={`Time: ${selectedTime}`} onPress={() => cycleTime(setSelectedTime)} />
            </View>
          </View>

          <View style={styles.mapArea}>
            <View style={styles.userDot} />
            {filteredDoctors.map((d, i) => {
              const active = selectedDoctor?.id === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.pin,
                    { left: `${12 + ((i * 19) % 75)}%`, top: `${16 + ((i * 17) % 68)}%` },
                    active && styles.pinActive,
                  ]}
                  onPress={() => setSelectedDoctor(d)}
                >
                  <Text style={styles.pinText}>£{d.price}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedDoctor ? (
            <View style={styles.bottomSheet}>
              <View style={styles.rowBetween}>
                <Text style={styles.docName}>{selectedDoctor.name}</Text>
                <Text style={styles.price}>£{selectedDoctor.price}</Text>
              </View>
              <Text style={styles.meta}>★ {selectedDoctor.rating} • {selectedDoctor.type} • {selectedDoctor.etaMin} min away</Text>
              <Text style={styles.meta}>{selectedDoctor.address} • Next {selectedDoctor.nextSlot}</Text>
              <TouchableOpacity style={styles.bookBtn} onPress={startPayment}>
                <Text style={styles.bookBtnText}>{isPaying ? 'Opening Apple Pay…' : `Book now • Pay £${deposit} deposit`}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.bottomHint}>
              <Text style={styles.meta}>Tap a doctor pin to book</Text>
            </View>
          )}
        </View>
      )}

      {screen === 'confirmed' && selectedDoctor && (
        <View style={styles.confirmScreen}>
          <Text style={styles.confirmTitle}>Booking Confirmed ✅</Text>
          <Text style={styles.confirmText}>{selectedDoctor.name}</Text>
          <Text style={styles.confirmText}>{selectedDoctor.nextSlot} • {selectedDoctor.type}</Text>
          <Text style={styles.confirmText}>{selectedDoctor.address}</Text>
          <Text style={styles.confirmText}>Bring photo ID. Arrive 5 minutes early.</Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => setScreen('map')}>
            <Text style={styles.bookBtnText}>Back to map</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function FilterPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.filterPill} onPress={onPress}>
      <Text style={styles.filterText}>{label}</Text>
    </TouchableOpacity>
  );
}

function cycleType(setter: (v: any) => void) {
  setter((prev: string) => (prev === 'All' ? 'GP' : prev === 'GP' ? 'ENT' : prev === 'ENT' ? 'Dermatology' : 'All'));
}

function cycleTime(setter: (v: any) => void) {
  setter((prev: string) => (prev === 'Now' ? '12:30' : prev === '12:30' ? '13:00' : prev === '13:00' ? '13:30' : 'Now'));
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1F3A' },
  mapScreen: { flex: 1, backgroundColor: '#0B1F3A' },
  topOverlay: {
    position: 'absolute',
    zIndex: 20,
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  logo: { color: 'white', fontSize: 28, fontWeight: '800' },
  subStatus: { color: '#BFDBFE', fontSize: 11, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterPill: {
    backgroundColor: 'white',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: { color: '#0B1F3A', fontWeight: '700', fontSize: 12 },
  mapArea: {
    flex: 1,
    backgroundColor: '#93C5FD',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    marginTop: 86,
    overflow: 'hidden',
  },
  userDot: {
    position: 'absolute',
    left: '50%',
    top: '45%',
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: 'white',
  },
  pin: {
    position: 'absolute',
    backgroundColor: '#0B1F3A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  docName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
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
  confirmScreen: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
    gap: 8,
  },
  confirmTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  confirmText: { color: '#334155', fontSize: 16 },
});
