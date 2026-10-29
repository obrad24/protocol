import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import type { AppLocale, ThemePreference, UserProfile } from '../../domain/entities/UserProfile';
import { useUseCases } from '../providers/AppProviders';
import { darkColors, lightColors, type ColorTokens } from '../theme/colors';
import { motivationKey, translate, type TranslationKey } from './translations';

type I18nThemeContextValue = {
  locale: AppLocale;
  themePreference: ThemePreference;
  colors: ColorTokens;
  isDark: boolean;
  t: (key: TranslationKey) => string;
  motivation: (bucket: 'great' | 'solid' | 'restart', seed: string) => string;
  setLocale: (locale: AppLocale) => Promise<void>;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
  refreshFromProfile: (profile: UserProfile | null) => void;
};

const I18nThemeContext = createContext<I18nThemeContextValue | null>(null);

export function I18nThemeProvider({ children }: { children: ReactNode }) {
  const { getProfile, updateSettings } = useUseCases();
  const systemScheme = useColorScheme();
  const [locale, setLocaleState] = useState<AppLocale>('bs');
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    void (async () => {
      const profile = await getProfile();
      if (profile) {
        setLocaleState(profile.locale);
        setThemePreferenceState(profile.themePreference);
      }
    })();
  }, [getProfile]);

  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  const motivation = useCallback(
    (bucket: 'great' | 'solid' | 'restart', seed: string) =>
      translate(locale, motivationKey(bucket, seed)),
    [locale],
  );

  const setLocale = useCallback(
    async (next: AppLocale) => {
      setLocaleState(next);
      await updateSettings({ locale: next });
    },
    [updateSettings],
  );

  const setThemePreference = useCallback(
    async (next: ThemePreference) => {
      setThemePreferenceState(next);
      await updateSettings({ themePreference: next });
    },
    [updateSettings],
  );

  const refreshFromProfile = useCallback((profile: UserProfile | null) => {
    if (!profile) return;
    setLocaleState(profile.locale);
    setThemePreferenceState(profile.themePreference);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      themePreference,
      colors,
      isDark,
      t,
      motivation,
      setLocale,
      setThemePreference,
      refreshFromProfile,
    }),
    [
      locale,
      themePreference,
      colors,
      isDark,
      t,
      motivation,
      setLocale,
      setThemePreference,
      refreshFromProfile,
    ],
  );

  return <I18nThemeContext.Provider value={value}>{children}</I18nThemeContext.Provider>;
}

export function useI18nTheme(): I18nThemeContextValue {
  const ctx = useContext(I18nThemeContext);
  if (!ctx) {
    throw new Error('useI18nTheme must be used within I18nThemeProvider');
  }
  return ctx;
}
