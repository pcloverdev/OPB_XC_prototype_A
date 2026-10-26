import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { HomeScreen } from '../screens/HomeScreen';
import { CategoryScreen } from '../screens/CategoryScreen';
import { CrossoverDrillScreen } from '../screens/CrossoverDrillScreen';
import { ComingSoonScreen } from '../screens/ComingSoonScreen';
import { getCategory } from '../workouts/catalog';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Workouts' }}
      />
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={({ route }) => ({
          title: getCategory(route.params.categoryId)?.title ?? 'Category',
        })}
      />
      <Stack.Screen
        name="CrossoverDrill"
        component={CrossoverDrillScreen}
        // Full-screen camera experience — hide the header.
        options={{ headerShown: false, orientation: 'portrait' }}
      />
      <Stack.Screen
        name="ComingSoon"
        component={ComingSoonScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
