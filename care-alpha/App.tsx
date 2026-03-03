import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'home' | 'bookings' | 'messages' | 'profile';
type CareMode = 'ASAP' | 'Today' | 'Schedule';
type VisitType = 'Video' | 'Home visit' | 'Clinic';
type Availability = 'available' | 'limited' | 'unavailable' | 'offline';
type FilterKey = 'mode' | 'visitType' | 'priceCap' | 'distance';

type Doctor = {
  id: string;
  name: string;
  specialty: string;
  verified: boolean;
  insured: boolean;
  availabilityLabel: string;
  availability: Availability;
  etaMin: number;
  priceFrom: number;
  deposit: number;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
};

const LONDON_REGION: Region = {
  latitude: 51.515,
  longitude: -0.09,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr Khan',
    specialty: 'GP',
    verified: true,
    insured: true,
    availabilityLabel: 'Available now',
    availability: 'available',
    etaMin: 8,
    priceFrom: 65,
    deposit: 15,
    rating: 4.9,
    reviewCount: 212,
    lat: 51.5176,
    lng: -0.0826,
  },
  {
    id: 'd2',
    name: 'Dr Chen',
    specialty: 'GP',
    verified: true,
    insured: true,
    availabilityLabel: 'In 15 min',
    availability: 'limited',
    etaMin: 12,
    priceFrom: 60,
    deposit: 15,
    rating: 4.8,
    reviewCount: 161,
    lat: 51.5139,
    lng: -0.089,
  },
  {
    id: 'd3',
    name: 'Dr Ahmed',
    specialty: 'GP',
    verified: true,
    insured: true,
    availabilityLabel: 'Next: 18:40',
    availability: 'limited',
    etaMin: 14,
    priceFrom: 70,
    deposit: 20,
    rating: 4.9,
    reviewCount: 98,
    lat: 51.5187,
    lng: -0.0886,
  },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [mode, setMode] = useState<CareMode>('ASAP');
  const [distanceKm, setDistanceKm] = useState(3);
  const [priceCap, setPriceCap] = useState(120);
  const [visitType, setVisitType] = useState<VisitType>('Clinic');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(DOCTORS[0].id);
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);

  const doctors = useMemo(
    () =>
      DOCTORS.filter(
        (d) =>
          d.verified &&
          d.insured &&
          d.priceFrom <= priceCap &&
          (visitType === 'Clinic' ? true : true) &&
          distanceKm >= 1,
      ),
    [distanceKm, priceCap, visitType],
  );


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {tab === 'home' ? (
        <View style={styles.homeWrap}>
          <View style={styles.header}>
            <Text style={styles.brand}>Care.</Text>
            <View style={styles.headerIcons}>
              <CircleIcon name="shield-checkmark-outline" />
              <CircleIcon name="person-circle-outline" />
            </View>
          </View>

          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowGap}>
              <FilterChip label={mode} active={activeFilter === 'mode'} onPress={() => setActiveFilter(activeFilter === 'mode' ? null : 'mode')} />
              <FilterChip label={visitType} active={activeFilter === 'visitType'} onPress={() => setActiveFilter(activeFilter === 'visitType' ? null : 'visitType')} />
              <FilterChip label={`≤ £${priceCap}`} active={activeFilter === 'priceCap'} onPress={() => setActiveFilter(activeFilter === 'priceCap' ? null : 'priceCap')} />
              <FilterChip label={`${distanceKm}km`} active={activeFilter === 'distance'} onPress={() => setActiveFilter(activeFilter === 'distance' ? null : 'distance')} />
            </ScrollView>

            {activeFilter === 'mode' && (
              <View style={styles.dropdownRow}>
                {(['ASAP', 'Today', 'Schedule'] as CareMode[]).map((item) => (
                  <SmallButton key={item} label={item} primary={item === mode} onPress={() => { setMode(item); setActiveFilter(null); }} />
                ))}
              </View>
            )}

            {activeFilter === 'visitType' && (
              <View style={styles.dropdownRow}>
                {(['Clinic', 'Video', 'Home visit'] as VisitType[]).map((item) => (
                  <SmallButton key={item} label={item} primary={item === visitType} onPress={() => { setVisitType(item); setActiveFilter(null); }} />
                ))}
              </View>
            )}

            {activeFilter === 'priceCap' && (
              <View style={styles.dropdownRow}>
                {[60, 80, 120, 160].map((item) => (
                  <SmallButton key={item} label={`≤ £${item}`} primary={item === priceCap} onPress={() => { setPriceCap(item); setActiveFilter(null); }} />
                ))}
              </View>
            )}

            {activeFilter === 'distance' && (
              <View style={styles.dropdownRow}>
                {[3, 5, 10, 20].map((item) => (
                  <SmallButton key={item} label={`${item}km`} primary={item === distanceKm} onPress={() => { setDistanceKm(item); setActiveFilter(null); }} />
                ))}
              </View>
            )}

            <Text style={styles.filterMeta}>Only verified + insured</Text>
          </View>

          <MapView style={styles.map} initialRegion={LONDON_REGION}>
            {doctors.map((d) => (
              <Marker key={d.id} coordinate={{ latitude: d.lat, longitude: d.lng }} onPress={() => setSelectedDoctorId(d.id)}>
                <View style={[styles.marker, markerColor(d.availability), selectedDoctorId === d.id && styles.markerActive]}>
                  <Text style={styles.markerText}>£{d.priceFrom} • {d.etaMin}m</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          <View style={styles.listWrap}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {doctors.map((d) => (
                <View key={d.id} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.name}>{d.name}</Text>
                    <Text style={styles.price}>from £{d.priceFrom}</Text>
                  </View>
                  <Text style={styles.meta}>{d.specialty}</Text>
                  <Text style={styles.badge}>GMC registered</Text>
                  <Text style={styles.meta}>{d.availabilityLabel}</Text>
                  <Text style={styles.meta}>Deposit today: {d.deposit}%</Text>
                  <Text style={styles.meta}>{d.rating} • {d.reviewCount} reviews</Text>
                  <View style={styles.rowGap}>
                    <SmallButton label="View" onPress={() => setSelectedDoctorId(d.id)} />
                    <SmallButton label="Book" primary onPress={() => setSelectedDoctorId(d.id)} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>


        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>{tab[0].toUpperCase() + tab.slice(1)}</Text>
          <Text style={styles.placeholderText}>M1 shell ready. This module is next.</Text>
        </View>
      )}

      <View style={styles.nav}>
        <NavItem label="Home" icon="home-outline" active={tab === 'home'} onPress={() => setTab('home')} />
        <NavItem label="Bookings" icon="calendar-outline" active={tab === 'bookings'} onPress={() => setTab('bookings')} />
        <NavItem label="Messages" icon="chatbubble-ellipses-outline" active={tab === 'messages'} onPress={() => setTab('messages')} />
        <NavItem label="Profile" icon="person-outline" active={tab === 'profile'} onPress={() => setTab('profile')} />
      </View>
    </SafeAreaView>
  );
}

function markerColor(a: Availability) {
  if (a === 'available') return { backgroundColor: '#10B981' };
  if (a === 'limited') return { backgroundColor: '#F59E0B' };
  if (a === 'unavailable') return { backgroundColor: '#EF4444' };
  return { backgroundColor: '#94A3B8' };
}

function FilterChip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label} ▾</Text>
    </TouchableOpacity>
  );
}

function SmallButton({ label, primary, onPress }: { label: string; primary?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.smallBtn, primary && styles.smallBtnPrimary]} onPress={onPress}>
      <Text style={[styles.smallBtnText, primary && styles.smallBtnTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CircleIcon({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.circle}>
      <Ionicons name={name} size={18} color="#0F172A" />
    </View>
  );
}

function NavItem({ label, icon, active, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; active?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={18} color={active ? '#1D4ED8' : '#64748B'} />
      <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  homeWrap: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 40, fontWeight: '300', color: '#0F172A' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  circle: { width: 38, height: 38, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  filterBar: { paddingHorizontal: 16, paddingBottom: 8 },
  rowGap: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999 },
  chipActive: { backgroundColor: '#1D4ED8' },
  chipText: { color: '#0F172A', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  dropdownRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  filterMeta: { marginTop: 8, color: '#0F172A', fontSize: 12, fontWeight: '600' },
  map: { height: 260, marginHorizontal: 16, borderRadius: 16 },
  marker: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
  markerActive: { borderWidth: 2, borderColor: '#0F172A' },
  markerText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  listWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  price: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  badge: { color: '#0F172A', fontWeight: '600', marginTop: 4 },
  meta: { color: '#475569', marginTop: 2 },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: '#EEF2FF' },
  smallBtnPrimary: { backgroundColor: '#1D4ED8' },
  smallBtnText: { color: '#0F172A', fontWeight: '700' },
  smallBtnTextPrimary: { color: '#fff' },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navText: { fontSize: 12, color: '#64748B' },
  navTextActive: { color: '#1D4ED8', fontWeight: '700' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  placeholderTitle: { fontSize: 26, fontWeight: '700', color: '#0F172A' },
  placeholderText: { marginTop: 6, color: '#64748B' },
});
