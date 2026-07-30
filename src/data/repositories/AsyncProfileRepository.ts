import { createDefaultProfile, type UserProfile } from '../../domain/entities/UserProfile';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import { STORAGE_KEYS } from '../storage/keys';
import type { KeyValueStore } from '../storage/KeyValueStore';

export function createAsyncProfileRepository(store: KeyValueStore): ProfileRepository {
  return {
    async get(): Promise<UserProfile> {
      const raw = await store.getItem(STORAGE_KEYS.profile);
      if (!raw) {
        const profile = createDefaultProfile('Janko');
        await store.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
        return profile;
      }
      return JSON.parse(raw) as UserProfile;
    },

    async save(profile: UserProfile): Promise<void> {
      await store.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    },
  };
}
