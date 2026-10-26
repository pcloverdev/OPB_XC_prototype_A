import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { Workout } from '../workouts/catalog';

export function WorkoutRow({
  workout,
  accent,
  onPress,
}: {
  workout: Workout;
  accent: string;
  onPress: () => void;
}) {
  const isReady = workout.kind !== 'coming-soon';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{workout.title}</Text>
          {isReady ? (
            <View style={[styles.badge, { backgroundColor: accent }]}>
              <Text style={styles.badgeText}>
                {workout.goal ? `${workout.goal} reps` : 'Ready'}
              </Text>
            </View>
          ) : (
            <View style={styles.badgeMuted}>
              <Text style={styles.badgeMutedText}>Soon</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>{workout.subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700' },
  subtitle: { color: colors.textDim, fontSize: 13, marginTop: 3 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#0B0B0F', fontSize: 11, fontWeight: '800' },
  badgeMuted: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: colors.surfaceAlt,
  },
  badgeMutedText: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  chevron: { color: colors.textDim, fontSize: 28, marginLeft: 8 },
});
