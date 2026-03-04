import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { light, radii, spacing } from '../theme/tokens';

type Props<T extends string> = {
  value: T;
  options: T[];
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o === value;
        return (
          <TouchableOpacity
            key={o}
            style={[styles.item, active && styles.active]}
            onPress={() => onChange(o)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, active && styles.textActive]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: light.surface, borderRadius: radii.pill, padding: 4 },
  item: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.pill },
  active: { backgroundColor: light.primary },
  text: { color: light.text, fontWeight: '600' },
  textActive: { color: '#fff' },
});
