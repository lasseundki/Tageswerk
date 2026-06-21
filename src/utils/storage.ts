import type { AppState, DayLog, ProgressEntry } from '../types';
import { defaultCategories } from '../data/defaultCategories';

const STORAGE_KEY = 'tageswerk_v1';

const defaultState: AppState = {
  categories: defaultCategories,
  projects: [],
  tasks: [],
  dayLogs: [],
  activeContext: {},
  settings: { theme: 'light', language: 'de' },
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...defaultState,
      ...parsed,
      settings: { ...defaultState.settings, ...(parsed.settings ?? {}) },
      activeContext: {},
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function ensureDayLog(dayLogs: DayLog[], date: string): DayLog[] {
  if (dayLogs.some(l => l.date === date)) return dayLogs;
  return [...dayLogs, { date, completedTaskIds: [], progressEntries: [] }];
}

export function addCompletedToLog(dayLogs: DayLog[], date: string, taskId: string): DayLog[] {
  const logs = ensureDayLog(dayLogs, date);
  return logs.map(l =>
    l.date === date && !l.completedTaskIds.includes(taskId)
      ? { ...l, completedTaskIds: [...l.completedTaskIds, taskId] }
      : l
  );
}

export function addProgressEntry(dayLogs: DayLog[], date: string, entry: ProgressEntry): DayLog[] {
  const logs = ensureDayLog(dayLogs, date);
  return logs.map(l =>
    l.date === date ? { ...l, progressEntries: [...l.progressEntries, entry] } : l
  );
}
