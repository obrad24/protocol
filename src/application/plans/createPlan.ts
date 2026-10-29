import {
  countsTowardActiveLimit,
  MAX_ACTIVE_PLANS,
  type Plan,
  type PlanDuration,
} from '../../domain/entities/Plan';
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  type Task,
} from '../../domain/entities/Task';
import {
  isRecurrenceRuleValid,
  type RecurrenceRule,
} from '../../domain/value-objects/RecurrenceRule';
import type { PlanRepository, PlanWithTasks } from '../../domain/repositories/PlanRepository';
import { createId } from '../../shared/utils/id';
import { todayDateOnly } from '../../shared/utils/date';
import {
  computePlanEndDate,
  defaultPlanStartDate,
  isValidDateOnly,
} from '../../shared/utils/planDates';

export const ACTIVE_PLAN_LIMIT_CODE = 'ACTIVE_PLAN_LIMIT';

export type CreatePlanTaskInput = {
  title: string;
  description?: string;
  recurrence: RecurrenceRule;
  /** Allow logging more completions than the planned period target. */
  allowOverPlan?: boolean;
};

export type CreatePlanInput = {
  name: string;
  description: string;
  duration: PlanDuration;
  /** Required when duration is `custom`. */
  customEndDate?: string;
  tasks: CreatePlanTaskInput[];
  setAsActive?: boolean;
  startDate?: string;
};

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function normalizeTaskDescription(raw: string | undefined): string | undefined {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return undefined;
  if (trimmed.length > TASK_DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(
      `Opis zadatka može imati najviše ${TASK_DESCRIPTION_MAX_LENGTH} znakova.`,
    );
  }
  return trimmed;
}

function resolveEndDate(
  startDate: string,
  duration: PlanDuration,
  customEndDate?: string,
): string | null {
  if (duration === 'unlimited') {
    return null;
  }
  if (duration === 'custom') {
    const end = (customEndDate ?? '').trim();
    if (!isValidDateOnly(end)) {
      throw new ValidationError('Unesi ispravan datum završetka (YYYY-MM-DD).');
    }
    if (end < startDate) {
      throw new ValidationError('Datum završetka ne može biti prije početka.');
    }
    return end;
  }
  return computePlanEndDate(startDate, duration);
}

export function buildTasksFromInput(
  planId: string,
  inputs: CreatePlanTaskInput[],
  now: string,
): Task[] {
  if (!inputs.length) {
    throw new ValidationError('Dodaj barem jedan zadatak.');
  }
  return inputs.map((t, index) => {
    const title = t.title.trim();
    if (!title) {
      throw new ValidationError('Svaki zadatak mora imati naziv.');
    }
    if (!isRecurrenceRuleValid(t.recurrence)) {
      throw new ValidationError(`Neispravno pravilo ponavljanja za „${title}”.`);
    }
    return {
      id: createId('task'),
      planId,
      title,
      description: normalizeTaskDescription(t.description),
      recurrence: t.recurrence,
      allowOverPlan: t.allowOverPlan === true,
      sortOrder: index,
      createdAt: now,
    };
  });
}

export function createCreatePlan(planRepo: PlanRepository) {
  return async function createPlan(input: CreatePlanInput): Promise<PlanWithTasks> {
    const name = input.name.trim();
    if (!name) {
      throw new ValidationError('Naziv plana je obavezan.');
    }

    const now = new Date().toISOString();
    const startDate = input.startDate ?? defaultPlanStartDate();
    const endDate = resolveEndDate(startDate, input.duration, input.customEndDate);
    const planId = createId('plan');
    const tasks = buildTasksFromInput(planId, input.tasks, now);

    const existing = await planRepo.list();
    const today = todayDateOnly();
    const activeCount = existing.filter((p) => countsTowardActiveLimit(p, today)).length;
    const wantsActive = input.setAsActive !== false || existing.length === 0;

    if (wantsActive && activeCount >= MAX_ACTIVE_PLANS) {
      throw new ValidationError(ACTIVE_PLAN_LIMIT_CODE);
    }

    const setAsActive = wantsActive;

    const plan: Plan = {
      id: planId,
      name,
      description: input.description.trim(),
      duration: input.duration,
      startDate,
      endDate,
      isActive: setAsActive,
      overviewSeenAt: null,
      createdAt: now,
      updatedAt: now,
    };

    // Save with isActive flag directly — do not deactivate other active plans.
    await planRepo.save(plan, tasks);

    return { ...plan, isActive: setAsActive, tasks };
  };
}

export function createSetActivePlan(planRepo: PlanRepository) {
  return async function setActivePlan(planId: string): Promise<void> {
    try {
      await planRepo.setActive(planId);
    } catch (error) {
      if (error instanceof Error && error.message === ACTIVE_PLAN_LIMIT_CODE) {
        throw new ValidationError(ACTIVE_PLAN_LIMIT_CODE);
      }
      throw error;
    }
  };
}

export function createDeactivatePlan(planRepo: PlanRepository) {
  return async function deactivatePlan(planId: string): Promise<void> {
    await planRepo.deactivate(planId);
  };
}

export { resolveEndDate, normalizeTaskDescription };
