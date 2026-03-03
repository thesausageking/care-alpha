import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Mode = 'patient' | 'doctor';
type Screen =
  | 'welcome'
  | 'list'
  | 'profile'
  | 'booking'
  | 'confirmed'
  | 'doctorOnboarding'
  | 'doctorPricing'
  | 'doctorOnline';

type Doctor = {
  id: string;
  name: string;
  price: number;
  rating: number;
  distanceMiles: number;
  nextSlot: string;
  verified: boolean;
};

const DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr Khan',
    price: 65,
    rating: 4.8,
    distanceMiles: 0.2,
    nextSlot: '12:15',
    verified: true,
  },
  {
    id: 'd2',
    name: 'Dr Patel',
    price: 55,
    rating: 4.7,
    distanceMiles: 0.4,
    nextSlot: '12:40',
    verified: true,
  },
  {
    id: 'd3',
    name: 'Dr Williams',
    price: 75,
    rating: 4.9,
    distanceMiles: 0.5,
    nextSlot: '13:00',
    verified: true,
  },
];

export default function App() {
  const [mode, setMode] = useState<Mode>('patient');
  const [screen, setScreen] = useState<Screen>('welcome');
  const [selectedDoctorId, setSelectedDoctorId] = useState('d2');
  const [doctorPrice, setDoctorPrice] = useState('65');

  const selectedDoctor = useMemo(
    () => DOCTORS.find((d) => d.id === selectedDoctorId) ?? DOCTORS[0],
    [selectedDoctorId],
  );

  const deposit = useMemo(() => Number((selectedDoctor.price * 0.15).toFixed(2)), [selectedDoctor.price]);

  const resetToMode = (newMode: Mode) => {
    setMode(newMode);
    setScreen('welcome');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.brand}>Care Alpha</Text>
        <View style={styles.pills}>
          <TouchableOpacity
            style={[styles.pill, mode === 'patient' && styles.pillActive]}
            onPress={() => resetToMode('patient')}
          >
            <Text style={[styles.pillText, mode === 'patient' && styles.pillTextActive]}>Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, mode === 'doctor' && styles.pillActive]}
            onPress={() => resetToMode('doctor')}
          >
            <Text style={[styles.pillText, mode === 'doctor' && styles.pillTextActive]}>Doctor</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {mode === 'patient' && screen === 'welcome' && (
          <Card>
            <Title>Find a private doctor nearby</Title>
            <Small>City of London • In-person • 15 mins • 18+ only</Small>
            <PrimaryButton label="Browse doctors" onPress={() => setScreen('list')} />
          </Card>
        )}

        {mode === 'patient' && screen === 'list' && (
          <Card>
            <Title>Doctors near you</Title>
            <Small>Sorted by earliest availability</Small>
            {DOCTORS.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.doctorCard}
                onPress={() => {
                  setSelectedDoctorId(d.id);
                  setScreen('profile');
                }}
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.doctorName}>{d.name}</Text>
                  <Text style={styles.price}>£{d.price}</Text>
                </View>
                <Text style={styles.meta}>
                  {d.distanceMiles} miles • ★ {d.rating} • Next {d.nextSlot}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {mode === 'patient' && screen === 'profile' && (
          <Card>
            <Title>{selectedDoctor.name}</Title>
            <Small>GMC verified • City of London clinic</Small>
            <InfoRow left="Price" right={`£${selectedDoctor.price}`} />
            <InfoRow left="Duration" right="15 mins" />
            <InfoRow left="Nearest slot" right={selectedDoctor.nextSlot} />
            <InfoRow left="Rating" right={`★ ${selectedDoctor.rating}`} />
            <PrimaryButton label="Book now" onPress={() => setScreen('booking')} />
          </Card>
        )}

        {mode === 'patient' && screen === 'booking' && (
          <Card>
            <Title>Booking summary</Title>
            <InfoRow left="Consultation" right={`£${selectedDoctor.price}`} />
            <InfoRow left="Deposit now (15%)" right={`£${deposit}`} />
            <InfoRow left="Pay at clinic" right={`£${(selectedDoctor.price - deposit).toFixed(2)}`} />
            <Small>Emergency symptoms? Call 999 or go to A&E.</Small>
            <PrimaryButton label="Pay deposit (Apple Pay)" onPress={() => setScreen('confirmed')} />
          </Card>
        )}

        {mode === 'patient' && screen === 'confirmed' && (
          <Card>
            <Title>Booked ✅</Title>
            <Small>
              {selectedDoctor.name} • Today {selectedDoctor.nextSlot}
              {'\n'}City of London Clinic
            </Small>
            <PrimaryButton label="Book another" onPress={() => setScreen('list')} />
          </Card>
        )}

        {mode === 'doctor' && screen === 'welcome' && (
          <Card>
            <Title>Doctor onboarding</Title>
            <Small>GMC verification required before going live.</Small>
            <PrimaryButton label="Start verification" onPress={() => setScreen('doctorOnboarding')} />
          </Card>
        )}

        {mode === 'doctor' && screen === 'doctorOnboarding' && (
          <Card>
            <Title>Verification submitted</Title>
            <Small>GMC checked • Good standing • Clinic location confirmed</Small>
            <PrimaryButton label="Set pricing" onPress={() => setScreen('doctorPricing')} />
          </Card>
        )}

        {mode === 'doctor' && screen === 'doctorPricing' && (
          <Card>
            <Title>Set your 15-min fee</Title>
            <TextInput
              style={styles.input}
              value={doctorPrice}
              onChangeText={setDoctorPrice}
              keyboardType="numeric"
              placeholder="65"
            />
            <Small>Patients see your price, rating, and nearest slot.</Small>
            <PrimaryButton label="Save + go online" onPress={() => setScreen('doctorOnline')} />
          </Card>
        )}

        {mode === 'doctor' && screen === 'doctorOnline' && (
          <Card>
            <Title>Status: Online</Title>
            <Small>Visible to nearby patients now</Small>
            <InfoRow left="Your price" right={`£${doctorPrice}`} />
            <InfoRow left="New booking" right="12:40 today" />
            <PrimaryButton label="Back to dashboard" onPress={() => setScreen('welcome')} />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

function Small({ children }: { children: React.ReactNode }) {
  return <Text style={styles.small}>{children}</Text>;
}

function InfoRow({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.small}>{left}</Text>
      <Text style={styles.infoValue}>{right}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F8FD' },
  header: {
    backgroundColor: '#0B1F3A',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  brand: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 10 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ffffff40',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff14',
  },
  pillActive: { backgroundColor: 'white' },
  pillText: { color: 'white', fontWeight: '600' },
  pillTextActive: { color: '#0B1F3A' },
  body: { padding: 14 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  small: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  doctorName: { fontWeight: '700', color: '#0F172A' },
  price: { fontWeight: '700', color: '#1D4ED8' },
  meta: { fontSize: 12, color: '#64748B' },
  infoValue: { fontWeight: '700', color: '#0F172A' },
  primaryButton: {
    marginTop: 6,
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
