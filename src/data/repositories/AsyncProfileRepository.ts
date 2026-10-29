import { normalizeProfile, type UserProfile } from '../../domain/entities/UserProfile';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import { STORAGE_KEYS } from '../storage/keys';
import type { KeyValueStore } from '../storage/KeyValueStore';

export function createAsyncProfileRepository(store: KeyValueStore): ProfileRepository {
  return {
    async get(): Promise<UserProfile | null> {
      const raw = await store.getItem(STORAGE_KEYS.profile);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<UserProfile> & {
        id: string;
        displayName: string;
      };
      return normalizeProfile(parsed);
    },

    async save(profile: UserProfile): Promise<void> {
      await store.setItem(STORAGE_KEYS.profile, JSON.stringify(normalizeProfile(profile)));
    },
  };
}
