import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AchievementsScreen } from '../features/achievements/AchievementsScreen';
import { colors } from '../theme';
import { RootTabs } from './RootTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={RootTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          title: 'Dostignuća',
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}
