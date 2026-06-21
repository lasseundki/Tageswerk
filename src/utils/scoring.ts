import type { Task, ActiveContext } from '../types';
import { isOverdue, isToday, isTomorrow, isThisWeek, daysSince } from './dateHelpers';

export interface ScoredTask {
  task: Task;
  score: number;
  reasons: string[];
}

const PRIORITY_SCORES: Record<string, number> = { p1: 40, p2: 30, p3: 15, p4: 5 };

export function scoreTasks(
  tasks: Task[],
  context: ActiveContext,
  skippedIds: Set<string>
): ScoredTask[] {
  const active = tasks.filter(t => t.status === 'active' && !skippedIds.has(t.id));

  return active
    .map(task => {
      let score = 0;
      const reasons: string[] = [];

      // Priority
      score += PRIORITY_SCORES[task.priority] ?? 5;
      reasons.push(`priority_${task.priority}`);

      // Deadline
      if (task.dueDate) {
        if (isOverdue(task.dueDate)) {
          score += 50; reasons.push('due_overdue');
        } else if (isToday(task.dueDate)) {
          score += 40; reasons.push('due_today');
        } else if (isTomorrow(task.dueDate)) {
          score += 25; reasons.push('due_tomorrow');
        } else if (isThisWeek(task.dueDate)) {
          score += 10; reasons.push('due_week');
        }
      }

      // Effort
      if (task.estimatedMinutes != null) {
        if (task.estimatedMinutes <= 30) {
          score += 10; reasons.push('effort_quick');
        } else if (task.estimatedMinutes > 90) {
          score -= 5;
        }
      }

      // Context: category
      if (context.selectedCategoryId && task.categoryId === context.selectedCategoryId) {
        score += 20; reasons.push('context_category');
      }

      // Context: mode
      if (context.selectedMode && task.mode === context.selectedMode) {
        score += 15; reasons.push('context_mode');
      }

      // Context: location
      if (context.selectedLocation && task.location === context.selectedLocation) {
        score += 10; reasons.push('context_location');
      }

      // Last contact
      const referenceDate = task.lastWorkedOn ?? task.createdAt?.split('T')[0];
      if (referenceDate && daysSince(referenceDate) > 3) {
        score += 8; reasons.push('not_touched');
      }

      return { task, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

export function formatReasons(reasons: string[], t: (k: string) => string): string {
  const topReasons = reasons
    .filter(r => !r.startsWith('priority_'))
    .slice(0, 2);
  const priority = reasons.find(r => r.startsWith('priority_'));
  const all = [
    priority ? t(`reasons.${priority}`) : null,
    ...topReasons.map(r => t(`reasons.${r}`)),
  ].filter(Boolean);
  return all.join(' · ');
}
