import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { light, radii, spacing } from '../theme/tokens';

type Segment = 'Upcoming' | 'Past' | 'Cancelled';

export function BookingsScreen() {
  const [segment, setSegment] = useState<Segment>('Upcoming');

  return (
    <View style={styles.wrap}>
      <View style={styles.segmentWrap}>
        {(['Upcoming', 'Past', 'Cancelled'] as Segment[]).map((s) => (
          <TouchableOpacity key={s} style={[styles.seg, segment === s && styles.segActive]} onPress={() => setSegment(s)}>
            <Text style={[styles.segText, segment === s && styles.segTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {segment === 'Upcoming' ? (
        <View style={styles.card}>
          <Text style={styles.title}>Dr Khan • GP</Text>
          <Text style={styles.meta}>Today 15:30 • Liverpool Street Clinic</Text>
          <Text style={styles.meta}>Status: Confirmed</Text>
          <View style={styles.row}>
            <Action label="Directions" />
            <Action label="Reschedule" />
            <Action label="Cancel" />
            <Action label="Message" primary />
          </View>
          <Text style={styles.next}>Next step: arrive 5 mins early.</Text>
        </View>
      ) : (
        <View style={styles.card}><Text style={styles.meta}>No {segment.toLowerCase()} bookings yet.</Text></View>
      )}
    </View>
  );
}

function Action({ label, primary }: { label: string; primary?: boolean }) {
  return (
    <TouchableOpacity style={[styles.action, primary && styles.actionPrimary]}>
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: light.bg, padding: spacing.md },
  segmentWrap: { flexDirection: 'row', backgroundColor: light.surface, borderRadius: radii.pill, padding: 4, marginBottom: spacing.md },
  seg: { flex: 1, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  segActive: { backgroundColor: light.primary },
  segText: { color: light.text, fontWeight: '600' },
  segTextActive: { color: '#fff' },
  card: { backgroundColor: light.surface, borderRadius: radii.lg, padding: spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: light.text },
  meta: { marginTop: 6, color: light.subtext },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  action: { paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: radii.pill, backgroundColor: '#EEF2FF' },
  actionPrimary: { backgroundColor: light.primary },
  actionText: { color: light.text, fontWeight: '700', fontSize: 12 },
  actionTextPrimary: { color: '#fff' },
  next: { marginTop: spacing.md, color: light.text, fontWeight: '600' },
});
