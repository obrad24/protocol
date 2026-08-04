import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileValidationError } from '../../../application/profile/profileUseCases';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useUseCases } from '../../providers/AppProviders';
import { colors, radii, spacing, typography } from '../../theme';

type OnboardingScreenProps = {
  onCompleted: () => void;
};

export function OnboardingScreen({ onCompleted }: OnboardingScreenProps) {
  const { completeOnboarding } = useUseCases();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onContinue = async () => {
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding(name);
      onCompleted();
    } catch (err) {
      setError(
        err instanceof ProfileValidationError
          ? err.message
          : 'Nije moguće sačuvati ime.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.brand}>Protocol</Text>
          <Text style={styles.title}>Kako se zoveš?</Text>
          <Text style={styles.subtitle}>
            Ime ćemo koristiti za pozdrav na početnom ekranu. Možeš ga kasnije
            promijeniti u profilu.
          </Text>

          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError(null);
            }}
            placeholder="Tvoje ime"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              void onContinue();
            }}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label="Nastavi"
            onPress={() => {
              void onContinue();
            }}
            loading={saving}
            disabled={!name.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  brand: {
    ...typography.appName,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 6,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
});
