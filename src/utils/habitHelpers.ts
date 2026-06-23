import type { Habit, HabitLog, HabitType } from '../types';

export function isScheduledForDate(habit: Habit, date: string): boolean {
  const d = new Date(date + 'T12:00:00');
  const dow = d.getDay(); // 0=Sun
  switch (habit.frequency) {
    case 'daily': return true;
    case 'weekdays': return dow >= 1 && dow <= 5;
    case 'weekends': return dow === 0 || dow === 6;
    case 'custom': return (habit.daysOfWeek ?? []).includes(dow);
  }
}

export function isHabitCompleted(habit: Habit, log: HabitLog | undefined): boolean {
  if (!log) return false;
  if (habit.type === 'boolean') return log.done;
  return log.count >= (habit.targetCount ?? 1);
}

export function getHabitLog(logs: HabitLog[], habitId: string, date: string): HabitLog | undefined {
  return logs.find(l => l.habitId === habitId && l.date === date);
}

export function getStreak(habit: Habit, logs: HabitLog[], todayStr: string): number {
  let streak = 0;
  const d = new Date(todayStr + 'T12:00:00');

  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split('T')[0];
    if (isScheduledForDate(habit, dateStr)) {
      const log = getHabitLog(logs, habit.id, dateStr);
      if (!isHabitCompleted(habit, log)) break;
      streak++;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function getCompletionRate(habit: Habit, logs: HabitLog[], todayStr: string, days: number): number {
  let scheduled = 0;
  let completed = 0;
  const d = new Date(todayStr + 'T12:00:00');

  for (let i = 0; i < days; i++) {
    const dateStr = d.toISOString().split('T')[0];
    if (isScheduledForDate(habit, dateStr)) {
      scheduled++;
      const log = getHabitLog(logs, habit.id, dateStr);
      if (isHabitCompleted(habit, log)) completed++;
    }
    d.setDate(d.getDate() - 1);
  }
  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
}

export function getTodayHabits(habits: Habit[], todayStr: string): Habit[] {
  return habits
    .filter(h => !h.isArchived && isScheduledForDate(h, todayStr))
    .sort((a, b) => {
      const order = { morning: 0, afternoon: 1, evening: 2, anytime: 3 };
      return (order[a.timeOfDay] - order[b.timeOfDay]) || (a.order - b.order);
    });
}

export function formatHabitType(type: HabitType): string {
  return type;
}
