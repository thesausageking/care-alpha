import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { light, radii, spacing } from '../theme/tokens';

type Props = {
  booked?: boolean;
};

export function MessagesScreen({ booked = true }: Props) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<string[]>(['Hi doctor, adding context for my appointment.']);

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Support</Text>
        <Text style={styles.sub}>Always available</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Doctor Messages</Text>
        {!booked ? (
          <Text style={styles.sub}>Book an appointment to message your doctor.</Text>
        ) : (
          <Text style={styles.sub}>Unlocked</Text>
        )}
      </View>

      {!booked ? null : (
        <>
          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 90 }}>
            {messages.map((m, i) => (
              <View key={`${m}-${i}`} style={styles.bubble}>
                <Text style={styles.bubbleText}>{m}</Text>
                <Text style={styles.time}>now • delivered</Text>
              </View>
            ))}
            <Text style={styles.safety}>For emergencies, call local emergency services.</Text>
          </ScrollView>
          <View style={styles.composer}>
            <TouchableOpacity style={styles.attach}><Text style={styles.attachText}>＋</Text></TouchableOpacity>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message"
              placeholderTextColor={light.subtext}
              accessibilityLabel="Type a message"
            />
            <TouchableOpacity
              style={styles.send}
              onPress={() => {
                const t = draft.trim();
                if (!t) return;
                setMessages((p) => [...p, t]);
                setDraft('');
              }}
            >
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: light.bg, padding: spacing.md },
  sectionCard: { backgroundColor: light.surface, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: light.text },
  sub: { color: light.subtext, marginTop: 4 },
  list: { flex: 1 },
  bubble: { alignSelf: 'flex-end', backgroundColor: '#DBEAFE', borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm, maxWidth: '90%' },
  bubbleText: { color: light.text },
  time: { marginTop: 4, color: '#94A3B8', fontSize: 11, textAlign: 'right' },
  safety: { color: '#64748B', marginTop: spacing.sm, fontSize: 12 },
  composer: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: 58, padding: spacing.sm, backgroundColor: light.surface, borderWidth: 1, borderColor: light.border, borderRadius: radii.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  attach: { width: 36, height: 36, borderRadius: 999, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  attachText: { color: light.text, fontWeight: '700', fontSize: 18 },
  input: { flex: 1, backgroundColor: light.bg, borderRadius: radii.md, paddingHorizontal: spacing.md, minHeight: 42, color: light.text },
  send: { backgroundColor: light.primary, borderRadius: radii.md, justifyContent: 'center', paddingHorizontal: spacing.md, minHeight: 42 },
  sendText: { color: '#fff', fontWeight: '700' },
});
