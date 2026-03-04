import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { light, radii, shadows, spacing } from '../theme/tokens';

export function ProfileScreen({ onSessionTimeout }: { onSessionTimeout?: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.avatar} />
      <Text style={styles.name}>Silas</Text>
      <Text style={styles.meta}>silas@example.com</Text>

      <Group title="Settings" items={['Account info', 'Notifications', 'Payment methods', 'Insurance']} />
      <Group title="Privacy & Security" items={['Privacy settings', 'Security']} />
      <Group title="Support & Legal" items={['Help', 'Terms', 'Privacy Policy']} />
      <TouchableOpacity style={styles.sessionBtn} onPress={onSessionTimeout}>
        <Text style={styles.sessionBtnText}>Simulate session timeout</Text>
      </TouchableOpacity>
    </View>
  );
}

function Group({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {items.map((i) => (
        <TouchableOpacity key={i} style={styles.item}>
          <Text style={styles.itemText}>{i}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: light.bg, padding: spacing.lg },
  avatar: { width: 84, height: 84, borderRadius: 999, backgroundColor: light.surface, borderWidth: 1, borderColor: light.border, alignSelf: 'center' },
  name: { marginTop: spacing.md, fontSize: 26, fontWeight: '700', color: light.text, textAlign: 'center' },
  meta: { marginTop: 6, color: light.subtext, textAlign: 'center' },
  group: { marginTop: spacing.lg, backgroundColor: light.surface, borderRadius: radii.lg, padding: spacing.md, ...shadows.soft },
  groupTitle: { color: light.text, fontWeight: '700', marginBottom: spacing.sm },
  item: { paddingVertical: spacing.sm },
  itemText: { color: light.subtext },
  sessionBtn: { marginTop: spacing.md, alignSelf: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: '#EEF2FF' },
  sessionBtnText: { color: light.navy, fontWeight: '700' },
});
