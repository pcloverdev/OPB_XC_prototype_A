import { requireNativeModule, type EventSubscription } from 'expo-modules-core';
import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';

import type { CrossoverDetectorEvents } from './src/CrossoverDetector.types';

/** Typed surface of the native `CrossoverDetector` Expo module. */
interface CrossoverDetectorModule {
  addListener<E extends keyof CrossoverDetectorEvents>(
    event: E,
    listener: CrossoverDetectorEvents[E]
  ): EventSubscription;
  /** Start the live-camera MediaPipe session (liveStream mode). */
  startLiveSession(): Promise<void>;
  /** Tear down the live-camera session. */
  stopLiveSession(): void;
  /** Reset the rep counter + heuristic state. */
  resetCount(): void;
  /** Process a local video file natively; resolves with the final rep count. */
  processVideo(uri: string): Promise<number>;
}

// Requiring the native module runs its `OnCreate`, which registers the
// "detectCrossover" VisionCamera frame processor plugin. This line MUST execute
// before `initFrameProcessorPlugin` below — keeping both in this one file
// guarantees that ordering.
const CrossoverDetector = requireNativeModule<CrossoverDetectorModule>('CrossoverDetector');

// Grab the native plugin we just registered.
const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectCrossover', {});

/**
 * VisionCamera frame processor worklet. Pass this to `useFrameProcessor`.
 * Executes on the camera's frame-processor thread and hands the frame to the
 * native MediaPipe engine; returns nothing to JS.
 */
export function detectCrossover(frame: Frame): void {
  'worklet';
  if (plugin == null) {
    throw new Error('Failed to load Frame Processor Plugin "detectCrossover"!');
  }
  plugin.call(frame);
}

export * from './src/CrossoverDetector.types';
export default CrossoverDetector;
