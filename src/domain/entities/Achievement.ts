export type AchievementCategory = 'daily' | 'weekly' | 'monthly' | 'streak' | 'plan';

export type AchievementType =
  | 'perfect_day'
  | 'perfect_week'
  | 'perfect_month'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'plan_completed_weekly'
  | 'plan_completed_monthly'
  | 'plan_completed_multi_month';

export type AchievementDefinition = {
  type: AchievementType;
  category: AchievementCategory;
  title: string;
  description: string;
};

export type Achievement = {
  type: AchievementType;
  unlockedAt: string | null; // ISO-8601 when unlocked; null = locked
};

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    type: 'perfect_day',
    category: 'daily',
    title: 'Perfect Day',
    description: 'Završi 100% dnevnih zadataka u jednom danu.',
  },
  {
    type: 'perfect_week',
    category: 'weekly',
    title: 'Perfect Week',
    description: 'Završi 100% zadataka u tekućoj sedmici.',
  },
  {
    type: 'perfect_month',
    category: 'monthly',
    title: 'Perfect Month',
    description: 'Završi 100% zadataka u tekućem mjesecu.',
  },
  {
    type: 'streak_3',
    category: 'streak',
    title: 'Streak 3',
    description: 'Tri uzastopna dana sa 100% dnevnim progresom.',
  },
  {
    type: 'streak_7',
    category: 'streak',
    title: 'Streak 7',
    description: 'Sedam uzastopnih dana sa 100% dnevnim progresom.',
  },
  {
    type: 'streak_30',
    category: 'streak',
    title: 'Streak 30',
    description: 'Trideset uzastopnih dana sa 100% dnevnim progresom.',
  },
  {
    type: 'plan_completed_weekly',
    category: 'plan',
    title: 'Sedmični plan',
    description: 'Završi sedmični plan.',
  },
  {
    type: 'plan_completed_monthly',
    category: 'plan',
    title: 'Mjesečni plan',
    description: 'Završi mjesečni plan.',
  },
  {
    type: 'plan_completed_multi_month',
    category: 'plan',
    title: 'Višemjesečni plan',
    description: 'Završi višemjesečni plan.',
  },
];
