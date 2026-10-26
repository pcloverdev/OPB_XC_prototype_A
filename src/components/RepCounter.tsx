import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

/** Large heads-up rep counter with a goal progress bar. */
export function RepCounter({
  reps,
  goal,
  lastDuration,
}: {
  reps: number;
  goal: number;
  lastDuration: number | null;
}) {
  const shown = Math.min(reps, goal);
  const pct = Math.max(0, Math.min(1, reps / goal));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.countRow}>
        <Text style={styles.count}>{shown}</Text>
        <Text style={styles.goal}>/ {goal}</Text>
      </View>
      <Text style={styles.label}>CROSSOVERS</Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
      </View>

      {lastDuration != null && (
        <Text style={styles.duration}>last rep: {lastDuration.toFixed(2)}s</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  countRow: { flexDirection: 'row', alignItems: 'flex-end' },
  count: {
    color: '#fff',
    fontSize: 120,
    fontWeight: '800',
    lineHeight: 124,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 8,
  },
  goal: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 18,
    marginLeft: 6,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: '600',
    marginTop: -6,
  },
  barTrack: {
    width: 220,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 16,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.success },
  duration: { color: '#ddd', fontSize: 14, marginTop: 10 },
});
