import type { UserProfile } from '../entities/UserProfile';

export interface ProfileRepository {
  get(): Promise<UserProfile>;
  save(profile: UserProfile): Promise<void>;
}
