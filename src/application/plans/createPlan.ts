import type { Plan, PlanDuration } from '../../domain/entities/Plan';
import type { Task } from '../../domain/entities/Task';
import {
  isRecurrenceRuleValid,
  type RecurrenceRule,
} from '../../domain/value-objects/RecurrenceRule';
import type { PlanRepository, PlanWithTasks } from '../../domain/repositories/PlanRepository';
import { createId } from '../../shared/utils/id';
import { computePlanEndDate, defaultPlanStartDate } from '../../shared/utils/planDates';

export type CreatePlanTaskInput = {
  title: string;
  recurrence: RecurrenceRule;
};

export type CreatePlanInput = {
  name: string;
  description: string;
  duration: PlanDuration;
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

export function createCreatePlan(planRepo: PlanRepository) {
  return async function createPlan(input: CreatePlanInput): Promise<PlanWithTasks> {
    const name = input.name.trim();
    if (!name) {
      throw new ValidationError('Naziv plana je obavezan.');
    }
    if (!input.tasks.length) {
      throw new ValidationError('Dodaj barem jedan zadatak.');
    }

    const now = new Date().toISOString();
    const startDate = input.startDate ?? defaultPlanStartDate();
    const endDate = computePlanEndDate(startDate, input.duration);
    const planId = createId('plan');

    const tasks: Task[] = input.tasks.map((t, index) => {
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
        recurrence: t.recurrence,
        sortOrder: index,
        createdAt: now,
      };
    });

    const existing = await planRepo.list();
    const setAsActive = input.setAsActive !== false || existing.length === 0;

    const plan: Plan = {
      id: planId,
      name,
      description: input.description.trim(),
      duration: input.duration,
      startDate,
      endDate,
      isActive: setAsActive,
      createdAt: now,
      updatedAt: now,
    };

    await planRepo.save(plan, tasks);

    if (setAsActive) {
      await planRepo.setActive(plan.id);
    }

    return { ...plan, isActive: setAsActive, tasks };
  };
}

export function createSetActivePlan(planRepo: PlanRepository) {
  return async function setActivePlan(planId: string): Promise<void> {
    await planRepo.setActive(planId);
  };
}
