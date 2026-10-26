import { useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

// Bundled celebratory chime (synthesized 16-bit PCM WAV).
const COMPLETE_SOUND = require('../../assets/sounds/complete.wav');

/**
 * Returns a `celebrate()` callback that plays the completion chime and fires a
 * success haptic — used when a drill's rep goal is reached.
 */
export function useCompletionFeedback() {
  const player = useAudioPlayer(COMPLETE_SOUND);

  return useCallback(() => {
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // Non-fatal — audio is a nice-to-have on top of the visual celebration.
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
  }, [player]);
}
