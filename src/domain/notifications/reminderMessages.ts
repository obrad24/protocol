import type { AppLocale } from '../entities/UserProfile';

export function buildDailyReminderBody(
  locale: AppLocale,
  remaining: number,
): string | null {
  if (remaining < 0) return null;
  if (remaining === 0) {
    return locale === 'en'
      ? 'Perfect day! 🎉 All tasks are done.'
      : 'Savršen dan! 🎉 Svi zadaci su završeni.';
  }
  if (locale === 'en') {
    if (remaining === 1) {
      return 'You have 1 task left for a perfect day. You’ve got this! 💪';
    }
    return `You have ${remaining} tasks left for a perfect day. You’ve got this! 💪`;
  }
  // Bosnian plural: 1 zadatak/ostao; 2–4 zadatka/ostalo; else zadataka/ostalo
  if (remaining === 1) {
    return 'Ostao vam je još 1 zadatak za savršen dan. Vi to možete! 💪';
  }
  if (remaining >= 2 && remaining <= 4) {
    return `Ostalo vam je još ${remaining} zadatka za savršen dan. Vi to možete! 💪`;
  }
  return `Ostalo vam je još ${remaining} zadataka za savršen dan. Vi to možete! 💪`;
}

export function dailyReminderTitle(locale: AppLocale): string {
  return locale === 'en' ? 'Protocol' : 'Protocol';
}
