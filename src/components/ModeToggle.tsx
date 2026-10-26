import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export type CaptureSource = 'live' | 'video';

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: CaptureSource;
  onChange: (m: CaptureSource) => void;
}) {
  return (
    <View style={styles.toggle}>
      {(['live', 'video'] as CaptureSource[]).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          style={[styles.item, mode === m && styles.itemActive]}>
          <Text style={[styles.text, mode === m && styles.textActive]}>
            {m === 'live' ? 'Live Camera' : 'Local Video'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
  },
  item: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 9 },
  itemActive: { backgroundColor: '#fff' },
  text: { color: colors.text, fontWeight: '600' },
  textActive: { color: '#000' },
});
