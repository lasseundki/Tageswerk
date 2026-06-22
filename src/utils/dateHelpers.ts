import type { Task, Urgency } from '../types';

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function isToday(date: string): boolean {
  return date === today();
}

export function isTomorrow(date: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return date === d.toISOString().split('T')[0];
}

export function isThisWeek(date: string): boolean {
  const d = new Date(date + 'T12:00:00');
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(now.getDate() + 7);
  return d > now && d <= weekFromNow;
}

export function isOverdue(date: string): boolean {
  return date < today();
}

export function daysSince(date: string): number {
  const d = new Date(date + 'T12:00:00');
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(date: string, locale = 'de-DE'): string {
  return new Date(date + 'T12:00:00').toLocaleDateString(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function formatRelative(date: string, t: (k: string) => string, locale = 'de-DE'): string {
  if (isOverdue(date)) return t('date.overdue');
  if (isToday(date)) return t('date.today');
  if (isTomorrow(date)) return t('date.tomorrow');
  if (isThisWeek(date)) return t('date.thisWeek');
  return formatDate(date, locale);
}

export function calculateNextDueDate(task: Task, fromDate: string): string {
  if (!task.recurringPattern || !task.dueDate) return fromDate;
  const { type, interval } = task.recurringPattern;
  const d = new Date(task.dueDate + 'T12:00:00');
  const from = new Date(fromDate + 'T12:00:00');
  while (d <= from) {
    if (type === 'daily') d.setDate(d.getDate() + interval);
    else if (type === 'weekly') d.setDate(d.getDate() + interval * 7);
    else if (type === 'monthly') d.setMonth(d.getMonth() + interval);
  }
  return d.toISOString().split('T')[0];
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export function isThisMonth(date: string): boolean {
  const d = new Date(date + 'T12:00:00');
  const now = new Date();
  const monthFromNow = new Date();
  monthFromNow.setDate(now.getDate() + 30);
  return d > now && d <= monthFromNow;
}

export function urgencyFromDueDate(dueDate: string): Urgency {
  if (isOverdue(dueDate) || isToday(dueDate)) return 'today';
  if (isThisWeek(dueDate)) return 'week';
  if (isThisMonth(dueDate)) return 'month';
  return 'someday';
}

export function effectiveUrgency(task: Task): Urgency {
  if (task.dueDate) return urgencyFromDueDate(task.dueDate);
  return task.urgency ?? 'someday';
}

export function timeProgress(): { year: number; month: number; week: number } {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  // Week: Monday = start
  const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const pct = (start: Date, end: Date) =>
    Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100);

  return {
    year: pct(startOfYear, endOfYear),
    month: pct(startOfMonth, endOfMonth),
    week: pct(startOfWeek, endOfWeek),
  };
}
