import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompletionOverlay } from '../components/CompletionOverlay';
import { LiveCameraView } from '../components/LiveCameraView';
import { ModeToggle, type CaptureSource } from '../components/ModeToggle';
import { RepCounter } from '../components/RepCounter';
import { VideoPickerView } from '../components/VideoPickerView';
import { useCompletionFeedback } from '../hooks/useCompletionFeedback';
import { useCrossoverReps } from '../hooks/useCrossoverReps';
import { colors } from '../theme/colors';
import { findWorkout } from '../workouts/catalog';
import type { RootScreenProps } from '../navigation/types';

export function CrossoverDrillScreen({
  route,
  navigation,
}: RootScreenProps<'CrossoverDrill'>) {
  const insets = useSafeAreaInsets();
  const workout = findWorkout(route.params.workoutId)?.workout;
  const goal = workout?.goal ?? 10;

  const [mode, setMode] = useState<CaptureSource>('live');
  const [position, setPosition] = useState<'front' | 'back'>('back');
  const [showOverlay, setShowOverlay] = useState(false);
  const { reps, lastDuration, completed, reset } = useCrossoverReps(goal);
  const celebrate = useCompletionFeedback();

  // Fire the celebration once, the moment the goal is reached.
  useEffect(() => {
    if (completed && !showOverlay) {
      setShowOverlay(true);
      celebrate();
    }
  }, [completed, showOverlay, celebrate]);

  const handleRestart = () => {
    reset();
    setShowOverlay(false);
  };
  const handleDone = () => navigation.goBack();

  // Camera runs only in live mode and freezes once the goal overlay appears.
  const liveActive = mode === 'live' && !showOverlay;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {mode === 'live' ? (
        <LiveCameraView active={liveActive} position={position} />
      ) : (
        <VideoPickerView />
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={handleDone} hitSlop={12} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>{workout?.title ?? 'Crossover Counter'}</Text>
        {/* Flip camera — only meaningful in live mode. Flip to the front camera
            to watch the counter climb while you dribble. */}
        {mode === 'live' && !showOverlay ? (
          <Pressable
            onPress={() => setPosition((p) => (p === 'back' ? 'front' : 'back'))}
            hitSlop={12}
            style={styles.flip}>
            <Text style={styles.flipIcon}>🔄</Text>
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
      </View>

      {/* Heads-up rep counter */}
      <View style={[styles.counter, { top: insets.top + 64 }]} pointerEvents="none">
        <RepCounter reps={reps} goal={goal} lastDuration={lastDuration} />
      </View>

      {/* Controls (hidden while celebrating) */}
      {!showOverlay && (
        <View style={[styles.controls, { paddingBottom: insets.bottom + 16 }]}>
          <ModeToggle mode={mode} onChange={setMode} />
          <Pressable style={styles.reset} onPress={reset}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>
      )}

      <CompletionOverlay
        visible={showOverlay}
        goal={goal}
        onRestart={handleRestart}
        onDone={handleDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  back: { width: 64 },
  backText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  flip: { width: 64, alignItems: 'flex-end' },
  flipIcon: {
    fontSize: 22,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
  title: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
  counter: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 12,
  },
  reset: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  resetText: { color: '#fff', fontWeight: '600' },
});
