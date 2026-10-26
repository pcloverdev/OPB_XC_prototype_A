import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CONFETTI_COLORS = [colors.orange, colors.blue, colors.purple, colors.green, '#FFD23D'];

/** Celebratory overlay shown when the rep goal is reached. */
export function CompletionOverlay({
  visible,
  goal,
  onRestart,
  onDone,
}: {
  visible: boolean;
  goal: number;
  onRestart: () => void;
  onDone: () => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const confetti = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      badgeScale.setValue(0);
      confetti.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(confetti, {
        toValue: 1,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, fade, badgeScale, confetti]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]}>
      <Confetti progress={confetti} />

      <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
        <Text style={styles.check}>✓</Text>
      </Animated.View>

      <Text style={styles.title}>Workout Complete!</Text>
      <Text style={styles.subtitle}>
        {goal} crossovers — nice handles.
      </Text>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.primary]} onPress={onRestart}>
          <Text style={styles.primaryText}>Do it again</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.secondary]} onPress={onDone}>
          <Text style={styles.secondaryText}>Finish</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/** Lightweight confetti burst driven by a single 0→1 progress value. */
function Confetti({ progress }: { progress: Animated.Value }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        key: i,
        startX: Math.random() * SCREEN_W,
        drift: (Math.random() - 0.5) * 120,
        size: 8 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotations: 2 + Math.random() * 3,
        delay: Math.random() * 0.3,
      })),
    []
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => {
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, SCREEN_H * 0.75],
        });
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.drift],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotations * 360}deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={p.key}
            style={{
              position: 'absolute',
              left: p.startX,
              top: 0,
              width: p.size,
              height: p.size * 0.6,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  check: { color: '#0B0B0F', fontSize: 68, fontWeight: '900', marginTop: -4 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  subtitle: { color: colors.textDim, fontSize: 16, marginTop: 6 },
  actions: { marginTop: 40, width: '100%', gap: 12 },
  button: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primary: { backgroundColor: '#fff' },
  primaryText: { color: '#000', fontSize: 17, fontWeight: '800' },
  secondary: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  secondaryText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
