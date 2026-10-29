import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { AppLocale, DailyReminderSettings } from '../../domain/entities/UserProfile';
import {
  buildDailyReminderBody,
  dailyReminderTitle,
} from '../../domain/notifications/reminderMessages';
import type { DailyReminderProgress } from '../../application/notifications/getDailyReminderProgress';

export const REMINDER_ID_PREFIX = 'protocol-daily-reminder-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function parseHm(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

/** Next Date for HH:mm in local timezone (today if still ahead, else tomorrow). */
export function nextOccurrenceDate(time: string, from = new Date()): Date {
  const { hour, minute } = parseHm(time);
  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function cancelReminderNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.identifier.startsWith(REMINDER_ID_PREFIX))
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

/**
 * Cancels previous reminder schedules and books the next 1–2 upcoming slots.
 * Body uses current Perfect Day remaining so content matches latest progress at sync time.
 * Call again on app open / task toggle / settings change to refresh bodies and times.
 */
export async function syncScheduledDailyReminders(input: {
  settings: DailyReminderSettings;
  progress: DailyReminderProgress;
  locale: AppLocale;
}): Promise<void> {
  if (Platform.OS === 'web') return;

  await cancelReminderNotifications();

  const { settings, progress, locale } = input;
  if (!settings.enabled) return;

  // No daily (Perfect Day) tasks → nothing to remind about.
  if (progress.total <= 0) return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const times: string[] = [settings.time1];
  if (settings.time2Enabled) {
    times.push(settings.time2);
  }

  const body = buildDailyReminderBody(locale, progress.remaining);
  if (!body) return;

  // Skip "tasks left" style when nothing left — body is the perfect-day message.
  // User asked not to send incomplete reminders when remaining is 0; positive OK.
  const title = dailyReminderTitle(locale);
  const now = new Date();

  // Schedule each configured clock time for the next occurrence only (today or tomorrow).
  // Content is recomputed on every sync so it stays close to real progress.
  for (let index = 0; index < times.length; index += 1) {
    const time = times[index]!;
    const when = nextOccurrenceDate(time, now);

    // If remaining is 0 and the slot is still today, send positive. If slot is tomorrow,
    // we don't yet know tomorrow's progress — use a light nudge only when remaining > 0 today
    // for today's slots; for tomorrow always schedule a check-style message that sync will refresh.
    const isToday =
      when.getFullYear() === now.getFullYear() &&
      when.getMonth() === now.getMonth() &&
      when.getDate() === now.getDate();

    let notificationBody = body;
    if (!isToday) {
      // Placeholder until next sync refreshes; avoid stale "4 left" overnight.
      notificationBody =
        locale === 'en'
          ? 'Check your plan — keep your streak going! 💪'
          : 'Provjeri svoj plan — nastavi streak! 💪';
    } else if (progress.remaining === 0) {
      notificationBody = body; // perfect day
    }

    await Notifications.scheduleNotificationAsync({
      identifier: `${REMINDER_ID_PREFIX}${index}-${time}`,
      content: {
        title,
        body: notificationBody,
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'daily-reminders' } : null),
        data: { type: 'daily-reminder', remaining: progress.remaining },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
      },
    });
  }
}
