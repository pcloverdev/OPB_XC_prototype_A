import { FlatList, StyleSheet, Text, View } from 'react-native';

import { WorkoutRow } from '../components/WorkoutRow';
import { colors } from '../theme/colors';
import { getCategory, type Workout } from '../workouts/catalog';
import type { RootScreenProps } from '../navigation/types';

export function CategoryScreen({ route, navigation }: RootScreenProps<'Category'>) {
  const category = getCategory(route.params.categoryId);
  if (!category) return null;

  const openWorkout = (workout: Workout) => {
    if (workout.kind === 'crossover') {
      navigation.navigate('CrossoverDrill', { workoutId: workout.id });
      return;
    }
    navigation.navigate('ComingSoon', {
      title: workout.title,
      note:
        workout.capture === 'none'
          ? 'This session runs without camera capture. Tracking for it is coming soon.'
          : 'On-device tracking for this drill is coming soon.',
    });
  };

  return (
    <FlatList
      style={styles.list}
      data={category.workouts}
      keyExtractor={(w) => w.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <Text style={styles.blurb}>{category.blurb}</Text>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <WorkoutRow
          workout={item}
          accent={category.accent}
          onPress={() => openWorkout(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  blurb: { color: colors.textDim, fontSize: 15, marginBottom: 18 },
});
