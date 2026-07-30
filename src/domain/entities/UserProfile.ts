export type UserProfile = {
  id: string;
  displayName: string;
  avatarUri: string | null;
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
};

export function createDefaultProfile(displayName = 'Janko'): UserProfile {
  const now = new Date().toISOString();
  return {
    id: 'profile-local',
    displayName,
    avatarUri: null,
    createdAt: now,
    updatedAt: now,
  };
}
