import { colors } from '../theme/colors';

/**
 * Static catalog describing the workout categories and the drills inside them.
 * In the real product this would come from an API; keeping it as typed data here
 * lets the navigation + screens be fully generic.
 */

export type WorkoutKind = 'crossover' | 'coming-soon';
export type CaptureMode = 'camera' | 'none';

export interface Workout {
  id: string;
  title: string;
  subtitle: string;
  kind: WorkoutKind;
  /** For rep-based drills — the target rep count to complete the exercise. */
  goal?: number;
  /** Whether this workout uses on-device video capture. */
  capture: CaptureMode;
}

export interface Category {
  id: string;
  title: string;
  blurb: string;
  emoji: string;
  accent: string;
  workouts: Workout[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'ball-handling',
    title: 'Ball Handling',
    blurb: 'Dribble drills tracked live with your camera',
    emoji: '🏀',
    accent: colors.orange,
    workouts: [
      {
        id: 'crossover-counter',
        title: 'Crossover Counter',
        subtitle: 'Hit 10 clean crossovers',
        kind: 'crossover',
        goal: 10,
        capture: 'camera',
      },
      {
        id: 'between-the-legs',
        title: 'Between-the-Legs',
        subtitle: 'Coming soon',
        kind: 'coming-soon',
        capture: 'camera',
      },
    ],
  },
  {
    id: 'shooting',
    title: 'Shooting',
    blurb: 'Form and catch-and-shoot reps',
    emoji: '🎯',
    accent: colors.blue,
    workouts: [
      {
        id: 'form-shooting',
        title: 'Form Shooting',
        subtitle: 'Coming soon',
        kind: 'coming-soon',
        capture: 'camera',
      },
      {
        id: 'catch-and-shoot',
        title: 'Catch & Shoot',
        subtitle: 'Coming soon',
        kind: 'coming-soon',
        capture: 'camera',
      },
    ],
  },
  {
    id: 'weight-room',
    title: 'Weight Room',
    blurb: 'Strength sessions — no camera needed',
    emoji: '🏋️',
    accent: colors.purple,
    workouts: [
      {
        id: 'lower-body',
        title: 'Lower Body Strength',
        subtitle: 'Coming soon',
        kind: 'coming-soon',
        capture: 'none',
      },
      {
        id: 'upper-body',
        title: 'Upper Body Strength',
        subtitle: 'Coming soon',
        kind: 'coming-soon',
        capture: 'none',
      },
    ],
  },
  {
    id: 'plyometrics',
    title: 'Plyometrics',
    blurb: 'Explosive jump and agility work',
    emoji: '⚡',
    accent: colors.green,
    workouts: [
      {
        id: 'box-jumps',
        title: 'Box Jump Circuit',
        subtitle: 'Coming soon',
        kind: 'coming-soon',
        capture: 'none',
      },
      {
        id: 'bounds',
        title: 'Bounding Series',
        subtitle: 'Coming soon',
        kind: 'coming-soon',
        capture: 'none',
      },
    ],
  },
];

export function getCategory(categoryId: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === categoryId);
}

export function findWorkout(
  workoutId: string
): { workout: Workout; category: Category } | undefined {
  for (const category of CATEGORIES) {
    const workout = category.workouts.find((w) => w.id === workoutId);
    if (workout) return { workout, category };
  }
  return undefined;
}
