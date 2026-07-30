import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  type BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CreatePlanScreen } from '../features/create-plan/CreatePlanScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { PlansScreen } from '../features/plans/PlansScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { StatsScreen } from '../features/stats/StatsScreen';
import { colors, radii, shadows } from '../theme';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

type TabIconName = ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<
  Exclude<keyof RootTabParamList, 'CreatePlan'>,
  { active: TabIconName; inactive: TabIconName }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Plans: { active: 'albums', inactive: 'albums-outline' },
  Stats: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function CreateTabButton({ onPress, accessibilityState }: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      style={styles.createButtonWrap}
    >
      <View style={[styles.createButton, focused && styles.createButtonFocused]}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'CreatePlan') {
            return null;
          }
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Plans" component={PlansScreen} options={{ title: 'Planovi' }} />
      <Tab.Screen
        name="CreatePlan"
        component={CreatePlanScreen}
        options={{
          title: 'Kreiraj',
          tabBarLabel: () => null,
          tabBarButton: (props) => <CreateTabButton {...props} />,
        }}
      />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  createButtonWrap: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    width: 58,
    height: 58,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
    shadowOpacity: 0.2,
    elevation: 6,
  },
  createButtonFocused: {
    backgroundColor: '#5A4BD1',
  },
});
