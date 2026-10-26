import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CategoryCard } from '../components/CategoryCard';
import { colors } from '../theme/colors';
import { CATEGORIES } from '../workouts/catalog';
import type { RootScreenProps } from '../navigation/types';

export function HomeScreen({ navigation }: RootScreenProps<'Home'>) {
  return (
    <FlatList
      style={styles.list}
      data={CATEGORIES}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.greeting}>Let's train</Text>
          <Text style={styles.sub}>Pick a category to get started.</Text>
        </View>
      }
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
        <CategoryCard
          category={item}
          onPress={() =>
            navigation.navigate('Category', { categoryId: item.id })
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  greeting: { color: colors.text, fontSize: 30, fontWeight: '800' },
  sub: { color: colors.textDim, fontSize: 15, marginTop: 4 },
});
