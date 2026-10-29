import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AchievementsScreen } from '../features/achievements/AchievementsScreen';
import { EditPlanScreen } from '../features/plans/EditPlanScreen';
import { PlanOverviewScreen } from '../features/plans/PlanOverviewScreen';
import { PlanStatsScreen } from '../features/stats/PlanStatsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useI18nTheme } from '../i18n/I18nThemeProvider';
import { RootTabs } from './RootTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, t } = useI18nTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="Tabs" component={RootTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: t('achievementsTitle') }}
      />
      <Stack.Screen
        name="EditPlan"
        component={EditPlanScreen}
        options={{ title: t('editPlanTitle') }}
      />
      <Stack.Screen
        name="PlanOverview"
        component={PlanOverviewScreen}
        options={{ title: t('planOverviewTitle') }}
      />
      <Stack.Screen
        name="PlanStats"
        component={PlanStatsScreen}
        options={{ title: t('statsTitle') }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settingsTitle') }}
      />
    </Stack.Navigator>
  );
}
