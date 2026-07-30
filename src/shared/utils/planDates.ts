import { addDays, formatDateOnly, todayDateOnly } from '../utils/date';
import type { PlanDuration } from '../../domain/entities/Plan';

export function computePlanEndDate(startDate: string, duration: PlanDuration): string {
  switch (duration) {
    case 'weekly':
      return addDays(startDate, 6);
    case 'monthly': {
      const [y, m, d] = startDate.split('-').map(Number);
      const end = new Date(y, m - 1 + 1, d);
      end.setDate(end.getDate() - 1);
      return formatDateOnly(end);
    }
    case 'multi_month': {
      const [y, m, d] = startDate.split('-').map(Number);
      const end = new Date(y, m - 1 + 3, d);
      end.setDate(end.getDate() - 1);
      return formatDateOnly(end);
    }
    default:
      return startDate;
  }
}

export function defaultPlanStartDate(): string {
  return todayDateOnly();
}
