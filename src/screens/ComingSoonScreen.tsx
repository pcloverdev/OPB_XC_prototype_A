import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { RootScreenProps } from '../navigation/types';

export function ComingSoonScreen({ route, navigation }: RootScreenProps<'ComingSoon'>) {
  const { title, note } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🚧</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>
        {note ?? 'This workout is coming soon.'}
      </Text>
      <Pressable style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  note: {
    color: colors.textDim,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  button: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
