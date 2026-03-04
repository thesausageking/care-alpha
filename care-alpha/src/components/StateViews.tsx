import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { light, spacing } from '../theme/tokens';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={light.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

export function ErrorState({ label }: { label: string }) {
  return (
    <View style={styles.center}>
      <Text style={[styles.text, { color: light.error }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  text: { marginTop: spacing.sm, color: light.subtext },
});
