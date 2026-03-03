import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'home' | 'bookings' | 'messages' | 'profile';
type HomeStage = 'home' | 'doctorProfile' | 'booking1' | 'booking2' | 'booking4' | 'bookingConfirmed';
type CareMode = 'ASAP' | 'Today' | 'Schedule';
type VisitType = 'Video' | 'Home visit' | 'Clinic';
type Availability = 'available' | 'limited' | 'unavailable' | 'offline';


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
  const mapRef = useRef<MapView | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(LONDON_REGION);
  const [showIntro, setShowIntro] = useState(true);
  const [introStep, setIntroStep] = useState(0);
  const [tab, setTab] = useState<Tab>('home');
  const [mode, setMode] = useState<CareMode>('ASAP');
  const [distanceKm, setDistanceKm] = useState(3);
  const [priceCap, setPriceCap] = useState(120);
  const [visitType, setVisitType] = useState<VisitType>('Clinic');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(DOCTORS[0].id);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [homeStage, setHomeStage] = useState<HomeStage>('home');
  const [reason, setReason] = useState<'Ear pain' | 'Fever' | 'Skin issue' | 'Other'>('Ear pain');
  const [triageSafe, setTriageSafe] = useState(true);
  const [appointmentType, setAppointmentType] = useState<VisitType>('Clinic');
  const [reasonText, setReasonText] = useState('');
  const [bookingStatus, setBookingStatus] = useState<'confirmed' | 'starting_soon' | 'completed'>('confirmed');
  const [reviewStars, setReviewStars] = useState(0);
  const [activeChatDoctor, setActiveChatDoctor] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState('');

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

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) ?? doctors[0] ?? null;

  useEffect(() => {
    const steps = [350, 650, 950, 1250, 1600];
    const timers = steps.map((ms, i) => setTimeout(() => setIntroStep(i + 1), ms));
    const done = setTimeout(() => setShowIntro(false), 2300);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, []);

  const bookingProgress =
    homeStage === 'booking1' ? 0.34 :
    homeStage === 'booking2' ? 0.67 :
    homeStage === 'booking4' ? 1 : 0;


  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {showIntro ? (
        <View style={styles.introWrap}>
          <View style={styles.introRow}>
            <Text style={[styles.introLetter, introStep >= 1 && styles.introLetterOn]}>C</Text>
            <Text style={styles.introUnderscore}>_</Text>
            <Text style={[styles.introLetter, introStep >= 2 && styles.introLetterOn]}>a</Text>
            <Text style={styles.introUnderscore}>_</Text>
            <Text style={[styles.introLetter, introStep >= 3 && styles.introLetterOn]}>r</Text>
            <Text style={styles.introUnderscore}>_</Text>
            <Text style={[styles.introLetter, introStep >= 4 && styles.introLetterOn]}>e</Text>
            <Text style={[styles.introDot, introStep >= 5 && styles.introDotOn]}>.</Text>
          </View>
        </View>
      ) : tab === 'home' ? (
        <View style={styles.homeWrap}>
          <View style={styles.header}>
            <Text style={styles.brand}>Care.</Text>
            <View style={styles.headerIcons}>
              <CircleIcon name="options-outline" onPress={() => setFiltersOpen((v) => !v)} />
              <CircleIcon name="shield-checkmark-outline" />
              <CircleIcon name="person-circle-outline" />
            </View>
          </View>

          {filtersOpen && (
            <View style={styles.filterSheetWrap}>
              <View style={styles.dropdownPanel}>
                <Text style={styles.panelLabel}>Time</Text>
                <View style={styles.dropdownRow}>
                  {(['ASAP', 'Today', 'Schedule'] as CareMode[]).map((item) => (
                    <SmallButton key={item} label={item} primary={item === mode} onPress={() => setMode(item)} />
                  ))}
                </View>

                <Text style={styles.panelLabel}>Type</Text>
                <View style={styles.dropdownRow}>
                  {(['Clinic', 'Video', 'Home visit'] as VisitType[]).map((item) => (
                    <SmallButton key={item} label={item} primary={item === visitType} onPress={() => setVisitType(item)} />
                  ))}
                </View>

                <Text style={styles.panelLabel}>Price</Text>
                <View style={styles.dropdownRow}>
                  {[60, 80, 120, 160].map((item) => (
                    <SmallButton key={item} label={`≤ £${item}`} primary={item === priceCap} onPress={() => setPriceCap(item)} />
                  ))}
                </View>

                <Text style={styles.panelLabel}>Distance</Text>
                <View style={styles.dropdownRow}>
                  {[3, 5, 10, 20].map((item) => (
                    <SmallButton key={item} label={`${item}km`} primary={item === distanceKm} onPress={() => setDistanceKm(item)} />
                  ))}
                </View>

                <View style={styles.rowGap}>
                  <BackButton onPress={() => setFiltersOpen(false)} />
                </View>
              </View>
            </View>
          )}

          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            {doctors.map((d) => (
              <Marker
                key={d.id}
                coordinate={{ latitude: d.lat, longitude: d.lng }}
                onPress={() => {
                  setSelectedDoctorId(d.id);
                  setHomeStage('doctorProfile');
                }}
              >
                <View style={[styles.marker, selectedDoctorId === d.id && styles.markerActive]}>
                  <View style={styles.priceBubble}>
                    <Text style={styles.priceBubbleText}>£{d.priceFrom}</Text>
                  </View>
                  <View style={styles.stethPin}>
                    <Ionicons name="medical" size={12} color="#fff" />
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>

          <View style={styles.listWrap}>
            {homeStage === 'home' && (
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
                    <Text style={styles.meta}>{d.rating} • {d.reviewCount} reviews</Text>
                    <View style={styles.rowGap}>
                      <SmallButton label="View" onPress={() => { setSelectedDoctorId(d.id); setHomeStage('doctorProfile'); }} />
                      <SmallButton label="Book" primary onPress={() => { setSelectedDoctorId(d.id); setHomeStage('booking1'); }} />
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {homeStage === 'doctorProfile' && selectedDoctor && (
              <View style={[styles.card, styles.stageCard]}>
                <Text style={styles.name}>{selectedDoctor.name}</Text>
                <Text style={styles.badge}>Verified clinician • GMC registered • Insured</Text>
                <Text style={styles.meta}>Available: {selectedDoctor.availabilityLabel}</Text>
                <Text style={styles.meta}>Appointment types: Clinic, Video, Home visit</Text>
                <Text style={styles.meta}>Deposit now: {selectedDoctor.deposit}%</Text>
                <Text style={styles.meta}>Remainder after appointment</Text>
                <Text style={styles.meta}>Cancellation cutoff: 2h before appointment</Text>
                <Text style={styles.meta}>Not for emergencies. Urgent symptoms → NHS 111 / 999.</Text>
                <View style={styles.rowGap}>
                  <SmallButton label="Back" onPress={() => setHomeStage('home')} />
                  <SmallButton label="Book now" primary onPress={() => setHomeStage('booking1')} />
                </View>
              </View>
            )}

            {homeStage === 'booking1' && (
              <View style={[styles.card, styles.stageCard]}>
                <ProgressBar progress={bookingProgress} />
                <Text style={styles.meta}>Confirm appointment type</Text>
                <View style={styles.rowGap}>
                  {(['Clinic', 'Video', 'Home visit'] as VisitType[]).map((v) => (
                    <PillButton key={v} label={v} selected={appointmentType === v} onPress={() => setAppointmentType(v)} />
                  ))}
                </View>
                <View style={styles.rowGap}>
                  <BackButton onPress={() => setHomeStage('home')} />
                  <NextButton onPress={() => setHomeStage('booking2')} />
                </View>
              </View>
            )}

            {homeStage === 'booking2' && (
              <View style={[styles.card, styles.stageCard]}>
                <ProgressBar progress={bookingProgress} />
                <Text style={styles.meta}>What is the reason for your visit?</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="Describe your reason for visiting"
                  placeholderTextColor="#94A3B8"
                  value={reasonText}
                  onChangeText={setReasonText}
                  multiline
                />

                <View style={styles.rowGap}>
                  <BackButton onPress={() => setHomeStage('booking1')} />
                  <NextButton onPress={() => setHomeStage('booking4')} />
                </View>
              </View>
            )}


            {homeStage === 'booking4' && selectedDoctor && (
              <View style={[styles.card, styles.stageCard]}>
                <ProgressBar progress={bookingProgress} />
                <Text style={styles.meta}>Deposit today: £{Math.round((selectedDoctor.priceFrom * selectedDoctor.deposit) / 100)}</Text>
                <Text style={styles.meta}>Remainder after appointment</Text>
                <Text style={styles.meta}>Cancellation terms shown before payment</Text>
                <View style={styles.rowGap}>
                  <BackButton onPress={() => setHomeStage('booking2')} />
                  <NextButton label="Pay deposit" onPress={() => {
                    setHomeStage('bookingConfirmed');
                    setBookingStatus('confirmed');
                    setActiveChatDoctor(selectedDoctor?.name ?? null);
                    setTab('messages');
                  }} />
                </View>
              </View>
            )}

            {homeStage === 'bookingConfirmed' && selectedDoctor && (
              <View style={[styles.card, styles.stageCard]}>
                <Text style={styles.name}>Booking confirmed</Text>
                <Text style={styles.meta}>What happens next:</Text>
                <Text style={styles.meta}>• Appointment confirmed</Text>
                <Text style={styles.meta}>• Status updates: confirmed → starting soon</Text>
                <Text style={styles.meta}>• Messaging is enabled with safety guidelines</Text>
                <Text style={styles.meta}>• Pricing + cancellation terms were shown before payment</Text>
                <View style={styles.rowGap}>
                  <SmallButton label="Done" primary onPress={() => setHomeStage('home')} />
                </View>
              </View>
            )}
          </View>


        </View>
      ) : tab === 'bookings' ? (
        <View style={styles.placeholder}>
          <View style={styles.card}>
            <Text style={styles.placeholderTitle}>Booking status</Text>
            <Text style={styles.meta}>{selectedDoctor?.name ?? 'Dr Khan'} • Today 12:40</Text>
            <Text style={styles.meta}>Status: {bookingStatus === 'confirmed' ? 'Confirmed' : bookingStatus === 'starting_soon' ? 'Starting soon' : 'Completed'}</Text>
            <Text style={styles.meta}>Deposit paid: £{selectedDoctor ? Math.round((selectedDoctor.priceFrom * selectedDoctor.deposit) / 100) : 0}</Text>
            <Text style={styles.meta}>Remainder after appointment</Text>
            <Text style={styles.meta}>Receipt: Download PDF (placeholder)</Text>
          </View>

          {bookingStatus === 'completed' && (
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.placeholderTitle}>Leave review</Text>
              <View style={styles.rowGap}>
                {[1,2,3,4,5].map((n) => (
                  <TouchableOpacity key={n} onPress={() => setReviewStars(n)}>
                    <Ionicons name={n <= reviewStars ? 'star' : 'star-outline'} size={22} color="#F59E0B" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : tab === 'messages' ? (
        <View style={styles.placeholder}>
          <View style={styles.card}>
            <Text style={styles.placeholderTitle}>Messages</Text>
            <Text style={styles.meta}>{activeChatDoctor ? `Chat with ${activeChatDoctor}` : 'No active chats yet'}</Text>
            <View style={[styles.reasonInput, { minHeight: 120 }]}> 
              <Text style={styles.meta}>You: Hi, I’ve booked for later today.</Text>
              <Text style={styles.meta}>Doctor: Thanks, please share any additional details here.</Text>
            </View>
            <TextInput
              style={styles.reasonInput}
              placeholder="Type a message"
              placeholderTextColor="#94A3B8"
              value={chatDraft}
              onChangeText={setChatDraft}
            />
            <View style={styles.rowGap}>
              <SmallButton label="Send" primary onPress={() => setChatDraft('')} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <View style={[styles.card, { width: '100%' }]}>
            <View style={styles.profileAvatar}>
              <Ionicons name="camera-outline" size={22} color="#64748B" />
            </View>
            <Text style={styles.placeholderTitle}>Patient profile</Text>
            <Text style={styles.meta}>Name: Silas</Text>
            <Text style={styles.meta}>Email: silas@example.com</Text>
            <Text style={styles.meta}>Phone: +44...</Text>
            <View style={styles.rowGap}>
              <SmallButton label="Settings" />
              <SmallButton label="Help" />
              <SmallButton label="Stats" />
            </View>
          </View>
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


function SmallButton({ label, primary, onPress }: { label: string; primary?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.smallBtn, primary && styles.smallBtnPrimary]} onPress={onPress}>
      <Text style={[styles.smallBtnText, primary && styles.smallBtnTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PillButton({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return <SmallButton label={label} primary={selected} onPress={onPress} />;
}

function BackButton({ onPress }: { onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.backBtn} onPress={onPress}>
      <Ionicons name="arrow-back" size={14} color="#0F172A" />
      <Text style={styles.backBtnText}>Back</Text>
    </TouchableOpacity>
  );
}

function NextButton({ onPress, label = 'Next' }: { onPress?: () => void; label?: string }) {
  return (
    <TouchableOpacity style={styles.nextBtn} onPress={onPress}>
      <Text style={styles.nextBtnText}>{label}</Text>
      <Ionicons name="arrow-forward" size={14} color="#fff" />
    </TouchableOpacity>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress * 100))}%` }]} />
    </View>
  );
}

function CircleIcon({ name, onPress }: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.circle} onPress={onPress}>
      <Ionicons name={name} size={18} color="#0F172A" />
    </TouchableOpacity>
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
  introWrap: { flex: 1, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  introRow: { flexDirection: 'row', alignItems: 'flex-end' },
  introLetter: {
    fontSize: 52,
    fontWeight: '300',
    color: '#DBEAFE',
    marginHorizontal: 2,
    opacity: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : undefined,
  },
  introUnderscore: {
    fontSize: 46,
    color: '#BFDBFE',
    marginHorizontal: 2,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : undefined,
  },
  introLetterOn: { color: '#fff', opacity: 1 },
  introDot: {
    fontSize: 52,
    fontWeight: '300',
    color: '#93C5FD',
    marginLeft: 2,
    opacity: 0,
    transform: [{ translateX: 14 }],
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : undefined,
  },
  introDotOn: { opacity: 1, transform: [{ translateX: 0 }], color: '#fff' },
  homeWrap: { flex: 1, paddingHorizontal: 4 },
  header: { paddingHorizontal: 0, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 40, fontWeight: '300', color: '#0F172A' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  circle: { width: 38, height: 38, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  rowGap: { flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 4 },
  filterSheetWrap: {
    position: 'absolute',
    top: 68,
    left: 8,
    right: 8,
    zIndex: 20,
  },
  dropdownPanel: { marginTop: 8, backgroundColor: '#fff', borderRadius: 14, padding: 10 },
  panelLabel: { marginTop: 2, color: '#334155', fontWeight: '700', fontSize: 12 },
  dropdownRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6, marginBottom: 6 },
  filterMeta: { marginTop: 8, color: '#0F172A', fontSize: 12, fontWeight: '600' },
  map: { height: 230, marginHorizontal: 0, borderRadius: 16 },
  marker: { alignItems: 'center' },
  markerActive: { transform: [{ scale: 1.03 }] },
  priceBubble: { backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 4 },
  priceBubbleText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  stethPin: { width: 26, height: 26, borderRadius: 999, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  listWrap: { flex: 1, paddingHorizontal: 0, paddingTop: 8, paddingBottom: 62 },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  stageCard: {
    flex: 1,
    marginBottom: 0,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  price: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  badge: { color: '#0F172A', fontWeight: '600', marginTop: 4 },
  meta: { color: '#475569', marginTop: 2 },
  alert: { color: '#B45309', marginTop: 6, fontWeight: '600' },
  reasonInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  progressFill: { height: 6, borderRadius: 999, backgroundColor: '#1D4ED8' },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
    marginBottom: 2,
  },
  backBtnText: { color: '#0F172A', fontWeight: '700' },
  nextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 2,
    marginBottom: 2,
  },
  nextBtnText: { color: '#fff', fontWeight: '700' },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: '#EEF2FF', marginRight: 2, marginBottom: 2 },
  smallBtnPrimary: { backgroundColor: '#1D4ED8' },
  smallBtnText: { color: '#0F172A', fontWeight: '700' },
  smallBtnTextPrimary: { color: '#fff' },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
  navText: { fontSize: 12, color: '#64748B' },
  navTextActive: { color: '#1D4ED8', fontWeight: '700' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 12, paddingBottom: 80, width: '100%' },
  placeholderTitle: { fontSize: 26, fontWeight: '700', color: '#0F172A' },
  placeholderText: { marginTop: 6, color: '#64748B' },
  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
  },
});
