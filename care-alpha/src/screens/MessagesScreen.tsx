import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { light, radii, spacing } from '../theme/tokens';

export function MessagesScreen() {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<string[]>(['Hi doctor, adding context for my appointment.']);

  return (
    <View style={styles.wrap}>
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 90 }}>
        {messages.map((m, i) => (
          <View key={`${m}-${i}`} style={styles.bubble}>
            <Text style={styles.bubbleText}>{m}</Text>
            <Text style={styles.time}>now</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.composer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: light.bg },
  list: { flex: 1, padding: spacing.md },
  bubble: { alignSelf: 'flex-end', backgroundColor: '#DBEAFE', borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm, maxWidth: '90%' },
  bubbleText: { color: light.text },
  time: { marginTop: 4, color: '#94A3B8', fontSize: 11, textAlign: 'right' },
  composer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.sm, backgroundColor: light.surface, borderTopWidth: 1, borderTopColor: light.border, flexDirection: 'row', gap: spacing.sm },
  input: { flex: 1, backgroundColor: light.bg, borderRadius: radii.md, paddingHorizontal: spacing.md, minHeight: 44, color: light.text },
  send: { backgroundColor: light.primary, borderRadius: radii.md, justifyContent: 'center', paddingHorizontal: spacing.md },
  sendText: { color: '#fff', fontWeight: '700' },
});
