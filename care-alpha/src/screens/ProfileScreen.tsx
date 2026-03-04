import { View, Text, StyleSheet } from 'react-native';
import { light, radii, spacing } from '../theme/tokens';

export function ProfileScreen() {
  return (
    <View style={styles.wrap}>
      <View style={styles.avatar} />
      <Text style={styles.name}>Silas</Text>
      <Text style={styles.meta}>silas@example.com</Text>
      <Text style={styles.meta}>+44 ...</Text>
      <View style={styles.card}><Text style={styles.meta}>Settings</Text></View>
      <View style={styles.card}><Text style={styles.meta}>Help</Text></View>
      <View style={styles.card}><Text style={styles.meta}>Stats</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: light.bg, padding: spacing.lg, alignItems: 'center' },
  avatar: { width: 84, height: 84, borderRadius: 999, backgroundColor: light.surface, borderWidth: 1, borderColor: light.border },
  name: { marginTop: spacing.md, fontSize: 26, fontWeight: '700', color: light.text },
  meta: { marginTop: 6, color: light.subtext },
  card: { marginTop: spacing.md, width: '100%', backgroundColor: light.surface, borderRadius: radii.md, padding: spacing.md },
});
