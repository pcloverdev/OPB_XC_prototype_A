import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Route + params for the root native stack. */
export type RootStackParamList = {
  Home: undefined;
  Category: { categoryId: string };
  CrossoverDrill: { workoutId: string };
  ComingSoon: { title: string; note?: string };
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
