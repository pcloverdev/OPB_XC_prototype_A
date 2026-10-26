import { useCallback, useEffect, useState } from 'react';

import CrossoverDetector, {
  type RepCompleteEvent,
} from '../../modules/crossover-detector';

/**
 * Mirrors the native `onRepComplete` pulses into React state and reports whether
 * the drill's rep `goal` has been reached. All counting happens natively.
 */
export function useCrossoverReps(goal: number) {
  const [reps, setReps] = useState(0);
  const [lastDuration, setLastDuration] = useState<number | null>(null);

  useEffect(() => {
    const sub = CrossoverDetector.addListener(
      'onRepComplete',
      (event: RepCompleteEvent) => {
        setReps(event.totalReps);
        setLastDuration(event.duration);
      }
    );
    return () => sub.remove();
  }, []);

  const reset = useCallback(() => {
    CrossoverDetector.resetCount();
    setReps(0);
    setLastDuration(null);
  }, []);

  return {
    reps,
    lastDuration,
    completed: reps >= goal,
    reset,
  };
}
