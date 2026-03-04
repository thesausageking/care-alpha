import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { BookingsScreen } from './src/screens/BookingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { dark, light } from './src/theme/tokens';
import { TabKey } from './src/types';

type AppState = 'splash' | 'loading' | 'ready' | 'offline' | 'error';

export default function App() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? dark : light;
  const [tab, setTab] = useState<TabKey>('map');
  const [state, setState] = useState<AppState>('splash');
  const [bookedOnce, setBookedOnce] = useState(false);

  const line = useRef(new Animated.Value(0)).current;
  const pin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(line, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pin, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setState('loading');
      setTimeout(() => setState('ready'), 700);
    });
  }, [line, pin]);

  const body = useMemo(() => {
    if (state === 'offline') return <Center label="You’re offline. Reconnect to continue." />;
    if (state === 'error') return <Center label="Something went wrong. Please retry." />;
    if (state === 'loading') return <Center label="Loading nearby doctors…" />;

    switch (tab) {
      case 'map':
        return (
          <HomeScreen
            onBooked={() => {
              setBookedOnce(true);
              setTab('bookings');
            }}
          />
        );
      case 'messages':
        return <MessagesScreen />;
      case 'bookings':
        return <BookingsScreen />;
      case 'profile':
        return <ProfileScreen />;
    }
  }, [state, tab]);

  if (state === 'splash') {
    return (
      <SafeAreaView style={[styles.splash, { backgroundColor: '#0B1F3A' }]}>
        <StatusBar style="light" />
        <View style={styles.splashRow}>
          <Animated.View style={{ transform: [{ scaleX: line }], opacity: line }}>
            <Text style={styles.splashWord}>CARE</Text>
          </Animated.View>
          <Animated.Text style={[styles.splashDot, { opacity: pin, transform: [{ translateX: pin.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>.</Animated.Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.wrap, { backgroundColor: theme.bg }]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>{body}</View>

      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Tab icon="map-outline" label="Map" active={tab === 'map'} onPress={() => setTab('map')} />
        <Tab icon="chatbubble-ellipses-outline" label="Messages" active={tab === 'messages'} onPress={() => setTab('messages')} />
        <Tab icon="calendar-outline" label="Bookings" active={tab === 'bookings'} onPress={() => setTab('bookings')} badge={bookedOnce ? '1' : undefined} />
        <Tab icon="person-outline" label="Profile" active={tab === 'profile'} onPress={() => setTab('profile')} />
      </View>
    </SafeAreaView>
  );
}

function Tab({ icon, label, active, onPress, badge }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; onPress: () => void; badge?: string }) {
  return (
    <TouchableOpacity style={styles.tabItem} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View>
        <Ionicons name={icon} size={19} color={active ? '#0F766E' : '#64748B'} />
        {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View> : null}
      </View>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Center({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <Text style={{ color: '#64748B' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  splashRow: { flexDirection: 'row', alignItems: 'flex-end' },
  splashWord: { fontSize: 54, letterSpacing: 4, color: '#E2F7F3', fontFamily: 'AvenirNext-Thin' },
  splashDot: { fontSize: 54, color: '#E2F7F3', fontFamily: 'AvenirNext-Thin' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8 },
  tabItem: { flex: 1, alignItems: 'center', gap: 2 },
  tabText: { fontSize: 12, color: '#64748B' },
  tabTextActive: { color: '#0F766E', fontWeight: '700' },
  badge: { position: 'absolute', top: -4, right: -9, backgroundColor: '#EF4444', borderRadius: 999, minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
