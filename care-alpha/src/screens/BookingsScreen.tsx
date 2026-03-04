import { View, Text, StyleSheet } from 'react-native';
import { light, radii, spacing } from '../theme/tokens';

export function BookingsScreen() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.title}>Booking confirmed</Text>
        <Text style={styles.meta}>Confirmation email sent.</Text>
        <Text style={styles.meta}>Deposit paid • £25.50</Text>
        <Text style={styles.meta}>Remainder pending after appointment completion</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: light.bg, padding: spacing.md },
  card: { backgroundColor: light.surface, borderRadius: radii.lg, padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: light.text },
  meta: { marginTop: 8, color: light.subtext },
});
