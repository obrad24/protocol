import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import * as Notifications from 'expo-notifications';

import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { useUseCases } from '../providers/AppProviders';
import { colors } from '../theme';
import { RootNavigator } from './RootNavigator';

export function AppBootstrap() {
  const { getProfile, syncDailyReminders } = useUseCases();
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await getProfile();
        if (!cancelled) {
          setNeedsOnboarding(profile === null);
          if (profile) {
            void syncDailyReminders();
          }
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getProfile, syncDailyReminders]);

  // Refresh reminder bodies when app returns or a reminder fires (keeps content current).
  useEffect(() => {
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncDailyReminders();
      }
    });
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      void syncDailyReminders();
    });
    return () => {
      appSub.remove();
      receivedSub.remove();
    };
  }, [syncDailyReminders]);

  const onOnboardingCompleted = useCallback(() => {
    setNeedsOnboarding(false);
    void syncDailyReminders();
  }, [syncDailyReminders]);

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (needsOnboarding) {
    return <OnboardingScreen onCompleted={onOnboardingCompleted} />;
  }

  return <RootNavigator />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
