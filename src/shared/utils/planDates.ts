import {
  addDays,
  formatDateOnly,
  getMonthRange,
  getWeekRange,
  todayDateOnly,
} from '../utils/date';
import type { PlanDuration } from '../../domain/entities/Plan';

export function computePlanEndDate(
  startDate: string,
  duration: PlanDuration,
  customEndDate?: string,
): string | null {
  switch (duration) {
    case 'weekly':
      return addDays(startDate, 6);
    case 'end_of_week':
      return getWeekRange(startDate).end;
    case 'monthly': {
      const [y, m, d] = startDate.split('-').map(Number);
      const end = new Date(y, m - 1 + 1, d);
      end.setDate(end.getDate() - 1);
      return formatDateOnly(end);
    }
    case 'end_of_month':
      return getMonthRange(startDate).end;
    case 'multi_month': {
      const [y, m, d] = startDate.split('-').map(Number);
      const end = new Date(y, m - 1 + 3, d);
      end.setDate(end.getDate() - 1);
      return formatDateOnly(end);
    }
    case 'custom': {
      if (!customEndDate) {
        throw new Error('Custom duration requires an end date.');
      }
      return customEndDate;
    }
    case 'unlimited':
      return null;
    default:
      return startDate;
  }
}

/** Bound used for progress “so far” when the plan has no end date. */
export function effectivePlanEndDate(endDate: string | null, asOf: string): string {
  return endDate ?? asOf;
}

export function defaultPlanStartDate(): string {
  return todayDateOnly();
}

export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = formatDateOnly(
    new Date(
      Number(value.slice(0, 4)),
      Number(value.slice(5, 7)) - 1,
      Number(value.slice(8, 10)),
    ),
  );
  return parsed === value;
}
