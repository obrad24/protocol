import type { UserProfile } from '../entities/UserProfile';

export interface ProfileRepository {
  get(): Promise<UserProfile | null>;
  save(profile: UserProfile): Promise<void>;
}
