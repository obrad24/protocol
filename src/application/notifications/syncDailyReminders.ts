import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import { syncScheduledDailyReminders } from '../../data/notifications/dailyReminderScheduler';
import type { createGetDailyReminderProgress } from './getDailyReminderProgress';

export function createSyncDailyReminders(
  profileRepo: ProfileRepository,
  getDailyReminderProgress: ReturnType<typeof createGetDailyReminderProgress>,
) {
  return async function syncDailyReminders(): Promise<void> {
    const profile = await profileRepo.get();
    if (!profile) {
      await syncScheduledDailyReminders({
        settings: {
          enabled: false,
          time1: '19:00',
          time2Enabled: false,
          time2: '12:00',
        },
        progress: { date: '', total: 0, remaining: 0, completed: 0 },
        locale: 'bs',
      });
      return;
    }

    const progress = await getDailyReminderProgress();
    await syncScheduledDailyReminders({
      settings: profile.dailyReminders,
      progress,
      locale: profile.locale,
    });
  };
}
