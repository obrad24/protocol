import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, radii, spacing, typography } from '../theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
};

export function PrimaryButton({
  label,
  loading,
  disabled,
  style,
  ...rest
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        state.pressed && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Text style={styles.label}>{loading ? 'Čuvanje…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.subtitle,
    color: '#FFFFFF',
  },
});
