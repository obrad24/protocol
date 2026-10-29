import { darkColors, lightColors, type ColorTokens } from './colors';

/** @deprecated Prefer useI18nTheme().colors — kept for gradual migration. */
export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  appName: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export const theme = {
  colors: lightColors,
  spacing,
  typography,
  radii,
  shadows,
} as const;

export type Theme = typeof theme;

export { lightColors, darkColors, type ColorTokens };
