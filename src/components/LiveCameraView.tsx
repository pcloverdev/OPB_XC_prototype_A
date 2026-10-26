import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';

import CrossoverDetector, { detectCrossover } from '../../modules/crossover-detector';
import { colors } from '../theme/colors';

/**
 * Full-screen live camera that runs the native MediaPipe crossover frame
 * processor. Owns the native liveStream session lifecycle: it starts when
 * `active` and tears down when paused/unmounted (e.g. once the goal is hit).
 */
export function LiveCameraView({
  active,
  position,
}: {
  active: boolean;
  position: 'front' | 'back';
}) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(position);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (active) {
      CrossoverDetector.startLiveSession().catch(() => {});
    } else {
      CrossoverDetector.stopLiveSession();
    }
    return () => CrossoverDetector.stopLiveSession();
  }, [active]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    // Hands the frame to native MediaPipe + heuristic; nothing returns to JS.
    detectCrossover(frame);
  }, []);

  if (!hasPermission) {
    return (
      <Message text="Camera permission is required for live tracking." />
    );
  }
  if (device == null) {
    return <Message text="No camera device found (are you on a simulator?)." />;
  }

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={active}
      frameProcessor={active ? frameProcessor : undefined}
      // BGRA output so MediaPipe's MPImage can ingest frames directly.
      pixelFormat="rgb"
    />
  );
}

function Message({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },
  text: { color: colors.text, fontSize: 16, textAlign: 'center' },
});
