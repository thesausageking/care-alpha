import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './lib.supabase';

type Doctor = { id: string; name: string; price: number; rating: number; nextSlot: string };

export default function App() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [screen, setScreen] = useState<'welcome' | 'list' | 'profile' | 'booking' | 'confirmed'>('welcome');
  const [status, setStatus] = useState('Connecting...');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const deposit = useMemo(() => Number(((selectedDoctor?.price ?? 0) * 0.15).toFixed(2)), [selectedDoctor]);

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
          .select('id,price_gbp,rating,profiles!inner(full_name)')
          .eq('is_online', true)
          .limit(20);

        if (error) throw error;

        const mapped: Doctor[] = (data ?? []).map((d: any, i: number) => ({
          id: d.id,
          name: d.profiles.full_name,
          price: d.price_gbp,
          rating: Number(d.rating ?? 4.7),
          nextSlot: ['12:15', '12:40', '13:00', '13:20'][i % 4],
        }));

        setDoctors(mapped);
        setStatus(mapped.length ? 'Live data connected ✅' : 'Connected (no online doctors yet)');
      } catch (e: any) {
        setStatus(`Backend not ready: ${e.message}`);
      }
    })();
  }, []);

  const startPayment = async () => {
    if (!selectedDoctor) {
      setStatus('Pick a doctor first');
      return;
    }

    if (!patientId) {
      setStatus('Auth not ready: enable Anonymous sign-in in Supabase Auth > Providers');
      return;
    }

    const paymentsApi = process.env.EXPO_PUBLIC_PAYMENTS_API_URL;
    if (!paymentsApi) {
      setStatus('Missing EXPO_PUBLIC_PAYMENTS_API_URL');
      return;
    }

    try {
      setIsPaying(true);
      const res = await fetch(`${paymentsApi}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          consultationPriceGbp: selectedDoctor.price,
          depositGbp: deposit,
        }),
      });

      if (!res.ok) throw new Error(`Payment API failed: ${res.status}`);
      const data = await res.json();
      if (!data?.url) throw new Error('Missing checkout URL');

      if (Platform.OS === 'web') {
        (globalThis as any).location.href = data.url;
      } else {
        await Linking.openURL(data.url);
      }
      setStatus('Complete payment in Stripe, then return to app');
    } catch (e: any) {
      setStatus(`Payment error: ${e.message}`);
    } finally {
      setIsPaying(false);
    }
  };

  const markPaidAndCreateBooking = async () => {
    if (!selectedDoctor || !patientId) return;
    try {
      await supabase.from('bookings').insert({
        patient_id: patientId,
        doctor_id: selectedDoctor.id,
        consultation_price_gbp: selectedDoctor.price,
        deposit_gbp: deposit,
      });
      setScreen('confirmed');
    } catch (e: any) {
      setStatus(`Booking write failed: ${e.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>Care Alpha</Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {screen === 'welcome' && (
          <Card>
            <Title>Private doctor booking in London</Title>
            <Small>In-person • 15 mins • 18+ only</Small>
            <Btn label="Browse doctors" onPress={() => setScreen('list')} />
          </Card>
        )}

        {screen === 'list' && (
          <Card>
            <Title>Doctors near you</Title>
            {doctors.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.doc}
                onPress={() => {
                  setSelectedDoctor(d);
                  setScreen('profile');
                }}
              >
                <View style={styles.row}><Text style={styles.name}>{d.name}</Text><Text style={styles.price}>£{d.price}</Text></View>
                <Text style={styles.small}>★ {d.rating} • Next {d.nextSlot}</Text>
              </TouchableOpacity>
            ))}
            {!doctors.length && <Small>No doctors online yet. Add doctor rows in Supabase.</Small>}
          </Card>
        )}

        {screen === 'profile' && selectedDoctor && (
          <Card>
            <Title>{selectedDoctor.name}</Title>
            <Small>GMC verified</Small>
            <Small>Price: £{selectedDoctor.price}</Small>
            <Small>Next slot: {selectedDoctor.nextSlot}</Small>
            <Btn label="Book now" onPress={() => setScreen('booking')} />
          </Card>
        )}

        {screen === 'booking' && selectedDoctor && (
          <Card>
            <Title>Booking summary</Title>
            <Small>Consultation: £{selectedDoctor.price}</Small>
            <Small>Deposit now (15%): £{deposit}</Small>
            <Small>Emergency symptoms? Call 999.</Small>
            <Btn label={isPaying ? 'Opening Stripe...' : 'Pay deposit (Stripe Checkout)'} onPress={startPayment} />
            <Btn label="I paid, confirm booking" onPress={markPaidAndCreateBooking} />
          </Card>
        )}

        {screen === 'confirmed' && selectedDoctor && (
          <Card>
            <Title>Booked ✅</Title>
            <Small>{selectedDoctor.name} at {selectedDoctor.nextSlot}</Small>
            <Btn label="Done" onPress={() => setScreen('welcome')} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ children }: { children: React.ReactNode }) { return <View style={styles.card}>{children}</View>; }
function Title({ children }: { children: React.ReactNode }) { return <Text style={styles.title}>{children}</Text>; }
function Small({ children }: { children: React.ReactNode }) { return <Text style={styles.small}>{children}</Text>; }
function Btn({ label, onPress }: { label: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.btn} onPress={onPress}><Text style={styles.btnText}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F8FD' },
  header: { backgroundColor: '#0B1F3A', padding: 16 },
  brand: { color: 'white', fontSize: 22, fontWeight: '700' },
  status: { color: '#cbd5e1', marginTop: 4, fontSize: 12 },
  body: { padding: 14 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  small: { fontSize: 13, color: '#64748B' },
  doc: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 10, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontWeight: '700', color: '#0F172A' },
  price: { fontWeight: '700', color: '#1D4ED8' },
  btn: { marginTop: 6, backgroundColor: '#1D4ED8', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700' },
});
