import type { Task, AppState, Language } from '../types';
import { getMotivationalMessage } from '../data/motivationalMessages';

const COOLDOWN_MS = 30 * 60 * 1000;
const MAX_PER_DAY = 3;

interface ToastRecord {
  date: string;
  count: number;
  categories: string[];
  lastAt: number;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getRecord(): ToastRecord {
  try {
    const raw = localStorage.getItem('tw_toasts');
    return raw ? (JSON.parse(raw) as ToastRecord) : { date: '', count: 0, categories: [], lastAt: 0 };
  } catch {
    return { date: '', count: 0, categories: [], lastAt: 0 };
  }
}

function canShow(category: string): boolean {
  const record = getRecord();
  const today = todayStr();
  const now = Date.now();
  if (record.date !== today) return true;
  if (now - record.lastAt < COOLDOWN_MS) return false;
  if (record.count >= MAX_PER_DAY) return false;
  if (record.categories.includes(category)) return false;
  return true;
}

function recordShown(category: string): void {
  const record = getRecord();
  const today = todayStr();
  const updated: ToastRecord = record.date === today
    ? { ...record, count: record.count + 1, categories: [...record.categories, category], lastAt: Date.now() }
    : { date: today, count: 1, categories: [category], lastAt: Date.now() };
  localStorage.setItem('tw_toasts', JSON.stringify(updated));
}

function determineCategory(task: Task, state: AppState): string | null {
  const hour = new Date().getHours();
  const today = todayStr();
  const todayLog = state.dayLogs.find(l => l.date === today);
  const completedToday = todayLog?.completedTaskIds.length ?? 0;
  const daysOpen = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = !!task.dueDate && task.dueDate < today;

  // Priority: most specific / impressive trigger first
  if (hour < 8 && completedToday === 0) return 'earlyBird';
  if (isOverdue) return 'overdue';
  if (task.priority === 'high') return 'highPriority';
  if (daysOpen >= 7) return 'longOpen';
  if (completedToday === 9) return 'tenTasks';
  if (completedToday === 4) return 'fiveTasks';
  if (completedToday === 0) return 'firstTask';
  return null;
}

export function checkMotivational(task: Task, state: AppState, lang: Language): string | null {
  const category = determineCategory(task, state);
  if (!category || !canShow(category)) return null;
  const msg = getMotivationalMessage(category, lang);
  if (!msg) return null;
  recordShown(category);
  return msg;
}
