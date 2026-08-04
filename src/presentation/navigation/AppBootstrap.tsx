import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { useUseCases } from '../providers/AppProviders';
import { colors } from '../theme';
import { RootNavigator } from './RootNavigator';

export function AppBootstrap() {
  const { getProfile } = useUseCases();
  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const profile = await getProfile();
        if (!cancelled) {
          setNeedsOnboarding(profile === null);
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
  }, [getProfile]);

  const onOnboardingCompleted = useCallback(() => {
    setNeedsOnboarding(false);
  }, []);

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
