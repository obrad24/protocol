import {
  createDefaultProfile,
  type UserProfile,
} from '../../domain/entities/UserProfile';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';

export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileValidationError';
  }
}

export function createGetProfile(profileRepo: ProfileRepository) {
  return async function getProfile(): Promise<UserProfile | null> {
    return profileRepo.get();
  };
}

export function createCompleteOnboarding(profileRepo: ProfileRepository) {
  return async function completeOnboarding(displayName: string): Promise<UserProfile> {
    const trimmed = displayName.trim();
    if (!trimmed) {
      throw new ProfileValidationError('Ime ne može biti prazno.');
    }

    const existing = await profileRepo.get();
    if (existing) {
      return existing;
    }

    const profile = createDefaultProfile(trimmed);
    await profileRepo.save(profile);
    return profile;
  };
}

export type UpdateProfileInput = {
  displayName?: string;
  avatarUri?: string | null;
};

export function createUpdateProfile(profileRepo: ProfileRepository) {
  return async function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    const current = await profileRepo.get();
    if (!current) {
      throw new ProfileValidationError('Profil nije pronađen. Završi onboarding.');
    }

    if (input.displayName !== undefined && !input.displayName.trim()) {
      throw new ProfileValidationError('Ime ne može biti prazno.');
    }

    const next: UserProfile = {
      ...current,
      displayName:
        input.displayName !== undefined ? input.displayName.trim() : current.displayName,
      avatarUri: input.avatarUri !== undefined ? input.avatarUri : current.avatarUri,
      updatedAt: new Date().toISOString(),
    };
    await profileRepo.save(next);
    return next;
  };
}
