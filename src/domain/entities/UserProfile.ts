export type AppLocale = 'bs' | 'en';
export type ThemePreference = 'light' | 'dark' | 'system';

/** HH:mm local time, e.g. "19:00". */
export type ReminderTime = string;

export type DailyReminderSettings = {
  enabled: boolean;
  /** First daily reminder time (HH:mm). */
  time1: ReminderTime;
  /** When true, also fire at time2. */
  time2Enabled: boolean;
  /** Second daily reminder time (HH:mm). */
  time2: ReminderTime;
};

export const DEFAULT_DAILY_REMINDERS: DailyReminderSettings = {
  enabled: false,
  time1: '19:00',
  time2Enabled: false,
  time2: '12:00',
};

export type UserProfile = {
  id: string;
  displayName: string;
  avatarUri: string | null;
  locale: AppLocale;
  themePreference: ThemePreference;
  dailyReminders: DailyReminderSettings;
  /** e.g. 2026-W33 — last weekly overview shown */
  lastShownWeekId?: string | null;
  /** e.g. 2026-08 — last monthly overview shown */
  lastShownMonthId?: string | null;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
};

function normalizeReminderTime(value: unknown, fallback: ReminderTime): ReminderTime {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return fallback;
  const [h, m] = value.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return fallback;
  return value;
}

export function normalizeDailyReminders(
  raw: Partial<DailyReminderSettings> | null | undefined,
): DailyReminderSettings {
  return {
    enabled: raw?.enabled === true,
    time1: normalizeReminderTime(raw?.time1, DEFAULT_DAILY_REMINDERS.time1),
    time2Enabled: raw?.time2Enabled === true,
    time2: normalizeReminderTime(raw?.time2, DEFAULT_DAILY_REMINDERS.time2),
  };
}

export function createDefaultProfile(displayName: string): UserProfile {
  const now = new Date().toISOString();
  return {
    id: 'profile-local',
    displayName,
    avatarUri: null,
    locale: 'bs',
    themePreference: 'system',
    dailyReminders: { ...DEFAULT_DAILY_REMINDERS },
    lastShownWeekId: null,
    lastShownMonthId: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Normalize legacy profiles missing settings fields. */
export function normalizeProfile(
  raw: Partial<UserProfile> & { id: string; displayName: string },
): UserProfile {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    displayName: raw.displayName,
    avatarUri: raw.avatarUri ?? null,
    locale: raw.locale === 'en' ? 'en' : 'bs',
    themePreference:
      raw.themePreference === 'light' || raw.themePreference === 'dark'
        ? raw.themePreference
        : 'system',
    dailyReminders: normalizeDailyReminders(raw.dailyReminders),
    lastShownWeekId: raw.lastShownWeekId ?? null,
    lastShownMonthId: raw.lastShownMonthId ?? null,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}
