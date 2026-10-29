import type {
  AppLocale,
  DailyReminderSettings,
  ThemePreference,
  UserProfile,
} from '../../domain/entities/UserProfile';
import { normalizeDailyReminders } from '../../domain/entities/UserProfile';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import {
  createUpdateProfile,
  ProfileValidationError,
  type UpdateProfileInput,
} from './profileUseCases';

export type UpdateSettingsInput = {
  locale?: AppLocale;
  themePreference?: ThemePreference;
  dailyReminders?: Partial<DailyReminderSettings>;
};

export function createUpdateSettings(profileRepo: ProfileRepository) {
  return async function updateSettings(input: UpdateSettingsInput): Promise<UserProfile> {
    const current = await profileRepo.get();
    if (!current) {
      throw new ProfileValidationError('Profil nije pronađen. Završi onboarding.');
    }
    const next: UserProfile = {
      ...current,
      locale: input.locale ?? current.locale,
      themePreference: input.themePreference ?? current.themePreference,
      dailyReminders: input.dailyReminders
        ? normalizeDailyReminders({ ...current.dailyReminders, ...input.dailyReminders })
        : current.dailyReminders,
      updatedAt: new Date().toISOString(),
    };
    await profileRepo.save(next);
    return next;
  };
}

export type { UpdateProfileInput };
export { createUpdateProfile, ProfileValidationError };
