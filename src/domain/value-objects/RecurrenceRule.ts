/**
 * Weekday: 1 = Monday … 7 = Sunday (ISO-8601 style).
 */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RecurrenceRule =
  | { type: 'daily' }
  | { type: 'weekly_count'; timesPerWeek: number }
  | { type: 'weekdays'; days: Weekday[] }
  | { type: 'monthly_count'; timesPerMonth: number };

export function isRecurrenceRuleValid(rule: RecurrenceRule): boolean {
  switch (rule.type) {
    case 'daily':
      return true;
    case 'weekly_count':
      return Number.isInteger(rule.timesPerWeek) && rule.timesPerWeek >= 1 && rule.timesPerWeek <= 7;
    case 'weekdays':
      return rule.days.length > 0 && rule.days.every((d) => d >= 1 && d <= 7);
    case 'monthly_count':
      return (
        Number.isInteger(rule.timesPerMonth) &&
        rule.timesPerMonth >= 1 &&
        rule.timesPerMonth <= 31
      );
    default:
      return false;
  }
}
