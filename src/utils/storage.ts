import type { AppState, DayLog, ProgressEntry, Priority, Urgency, HabitLog } from '../types';
import { defaultCategories } from '../data/defaultCategories';

const STORAGE_KEY = 'tageswerk_v1';

const defaultState: AppState = {
  categories: defaultCategories,
  projects: [],
  tasks: [],
  dayLogs: [],
  habits: [],
  habitLogs: [],
  activeContext: {},
  settings: { theme: 'light', language: 'de' },
};

function migratePriority(p: string): Priority {
  if (p === 'p1') return 'high';
  if (p === 'p2') return 'medium';
  return 'low';
}

function migrateState(parsed: Record<string, unknown>): AppState {
  const tasks = ((parsed.tasks as unknown[]) ?? []).map((t: unknown) => {
    const task = t as Record<string, unknown>;
    const priority = task.priority as string;
    const needsMigration = priority === 'p1' || priority === 'p2' || priority === 'p3' || priority === 'p4';
    return {
      ...task,
      priority: needsMigration ? migratePriority(priority) : (priority as Priority),
      urgency: (task.urgency as Urgency | undefined) ?? 'someday',
    };
  });

  const dayLogs = ((parsed.dayLogs as unknown[]) ?? []).map((l: unknown) => {
    const log = l as Record<string, unknown>;
    return {
      ...log,
      journalEntries: (log.journalEntries as unknown[]) ?? [],
    };
  });

  const habitLogs = ((parsed.habitLogs as unknown[]) ?? []).map((l: unknown) => {
    const log = l as Record<string, unknown>;
    return {
      date: log.date as string,
      habitId: log.habitId as string,
      done: (log.done as boolean) ?? false,
      count: (log.count as number) ?? 0,
    } as HabitLog;
  });

  return {
    ...defaultState,
    ...(parsed as Partial<AppState>),
    tasks: tasks as AppState['tasks'],
    dayLogs: dayLogs as AppState['dayLogs'],
    habits: (parsed.habits as AppState['habits']) ?? [],
    habitLogs,
    settings: { ...defaultState.settings, ...((parsed.settings as object) ?? {}) },
    activeContext: {},
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return migrateState(parsed);
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
  return [...dayLogs, { date, journalEntries: [], completedTaskIds: [], progressEntries: [] }];
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
