export type ColorTokens = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryMuted: string;
  success: string;
  streak: string;
  warning: string;
  border: string;
  danger: string;
  tabInactive: string;
  locked: string;
  overlay: string;
};

export const lightColors: ColorTokens = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textMuted: '#8B8FA3',
  primary: '#6C5CE7',
  primaryMuted: '#EDE9FE',
  success: '#22C55E',
  streak: '#FB923C',
  warning: '#F59E0B',
  border: '#E8EAF0',
  danger: '#EF4444',
  tabInactive: '#9CA3AF',
  locked: '#C4C8D4',
  overlay: 'rgba(26, 26, 46, 0.4)',
};

export const darkColors: ColorTokens = {
  background: '#12121A',
  surface: '#1C1C28',
  text: '#F2F3F7',
  textMuted: '#9AA0B4',
  primary: '#8B7CFF',
  primaryMuted: '#2A2550',
  success: '#34D399',
  streak: '#FB923C',
  warning: '#FBBF24',
  border: '#2E3140',
  danger: '#F87171',
  tabInactive: '#6B7280',
  locked: '#4B5063',
  overlay: 'rgba(0, 0, 0, 0.55)',
};
