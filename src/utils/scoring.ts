import type { Task, ActiveContext } from '../types';
import { isOverdue, isToday, isTomorrow, isThisWeek, daysSince, effectiveUrgency } from './dateHelpers';

export interface ScoredTask {
  task: Task;
  score: number;
  reasons: string[];
}

const PRIORITY_SCORES: Record<string, number> = { high: 40, medium: 25, low: 8 };

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

      // Importance (priority)
      score += PRIORITY_SCORES[task.priority] ?? 8;
      reasons.push(`priority_${task.priority}`);

      // Urgency (effective)
      const urg = effectiveUrgency(task);
      if (urg === 'today') { score += 50; reasons.push('urgency_today'); }
      else if (urg === 'week') { score += 20; reasons.push('urgency_week'); }
      else if (urg === 'month') { score += 8; }

      // Deadline (additive bonus on top of urgency if explicit date)
      if (task.dueDate) {
        if (isOverdue(task.dueDate)) reasons.push('due_overdue');
        else if (isToday(task.dueDate)) reasons.push('due_today');
        else if (isTomorrow(task.dueDate)) reasons.push('due_tomorrow');
        else if (isThisWeek(task.dueDate)) reasons.push('due_week');
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
  const skip = (r: string) => r.startsWith('priority_');
  const topReasons = reasons.filter(r => !skip(r)).slice(0, 2);
  return topReasons.map(r => t(`reasons.${r}`)).filter(Boolean).join(' · ');
}
