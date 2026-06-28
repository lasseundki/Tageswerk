import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, doc, onSnapshot,
  setDoc, updateDoc, deleteDoc, writeBatch, getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import type {
  AppState, Task, Project, Category, ActiveContext,
  ProgressEntry, JournalEntry, Habit, HabitLog, DayLog, ShoppingItem,
} from '../types';
import { generateId, loadState } from '../utils/storage';
import { today, calculateNextDueDate } from '../utils/dateHelpers';
import { defaultCategories } from '../data/defaultCategories';

export type AppStateContext = ReturnType<typeof useFirestoreState>;

// ── Firestore path helpers ──────────────────────────────────────
function col(uid: string, name: string) {
  return collection(db, `users/${uid}/${name}`);
}
function fdoc(uid: string, colName: string, id: string) {
  return doc(db, `users/${uid}/${colName}/${id}`);
}
function settingsDoc(uid: string) {
  return doc(db, `users/${uid}/meta/settings`);
}

// ── Strip undefined values (Firestore doesn't accept them) ──────
function clean<T extends object>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// ── Default state ───────────────────────────────────────────────
const defaultSettings: AppState['settings'] = { theme: 'light', language: 'de' };

export function useFirestoreState() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [projects, setProjects] = useState<Project[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [dayLogs, setDayLogs] = useState<DayLog[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [settings, setSettingsState] = useState<AppState['settings']>(defaultSettings);
  const [activeContext, setActiveContextState] = useState<ActiveContext>({});
  const [dataLoading, setDataLoading] = useState(true);

  const loadedRef = useRef(new Set<string>());
  const migrationRef = useRef(false);

  // ── Migration: localStorage → Firestore (runs once on first login) ──
  const migrate = useCallback(async (uidVal: string) => {
    if (migrationRef.current) return;
    migrationRef.current = true;

    const local = loadState();
    const hasLocalData = local.tasks.length > 0 || local.habits.length > 0 || local.projects.length > 0;
    if (!hasLocalData) {
      // Seed default categories if Firestore categories are also empty
      const snap = await getDocs(col(uidVal, 'categories'));
      if (snap.empty) {
        const batch = writeBatch(db);
        defaultCategories.forEach(c => {
          batch.set(fdoc(uidVal, 'categories', c.id), clean(c));
        });
        await batch.commit();
      }
      return;
    }

    const batch = writeBatch(db);
    local.tasks.forEach(t => batch.set(fdoc(uidVal, 'tasks', t.id), clean(t)));
    local.categories.forEach(c => batch.set(fdoc(uidVal, 'categories', c.id), clean(c)));
    local.projects.forEach(p => batch.set(fdoc(uidVal, 'projects', p.id), clean(p)));
    local.habits.forEach(h => batch.set(fdoc(uidVal, 'habits', h.id), clean(h)));
    local.habitLogs.forEach(l => {
      const id = `${l.date}_${l.habitId}`;
      batch.set(fdoc(uidVal, 'habitLogs', id), clean(l));
    });
    local.dayLogs.forEach(l => batch.set(fdoc(uidVal, 'dayLogs', l.date), clean(l)));
    await batch.commit();

    await setDoc(settingsDoc(uidVal), clean({
      ...local.settings,
      activeContext: local.activeContext ?? {},
    }));

    localStorage.removeItem('tageswerk_v1');
  }, []);

  // ── Set up all Firestore listeners ─────────────────────────────
  useEffect(() => {
    if (!uid) return;

    loadedRef.current = new Set();
    setDataLoading(true);

    const mark = (name: string) => {
      loadedRef.current.add(name);
      if (loadedRef.current.size >= 8) setDataLoading(false);
    };

    const unsubs: (() => void)[] = [];

    unsubs.push(onSnapshot(col(uid, 'tasks'), snap => {
      setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id } as Task)));
      mark('tasks');
    }));

    unsubs.push(onSnapshot(col(uid, 'categories'), async snap => {
      if (snap.empty && !migrationRef.current) {
        await migrate(uid);
      } else {
        setCategories(snap.docs.map(d => ({ ...d.data(), id: d.id } as Category)));
      }
      mark('categories');
    }));

    unsubs.push(onSnapshot(col(uid, 'projects'), snap => {
      setProjects(snap.docs.map(d => ({ ...d.data(), id: d.id } as Project)));
      mark('projects');
    }));

    unsubs.push(onSnapshot(col(uid, 'habits'), snap => {
      setHabits(snap.docs.map(d => ({ ...d.data(), id: d.id } as Habit)));
      mark('habits');
    }));

    unsubs.push(onSnapshot(col(uid, 'habitLogs'), snap => {
      setHabitLogs(snap.docs.map(d => d.data() as HabitLog));
      mark('habitLogs');
    }));

    unsubs.push(onSnapshot(col(uid, 'dayLogs'), snap => {
      setDayLogs(snap.docs.map(d => d.data() as DayLog));
      mark('dayLogs');
    }));

    unsubs.push(onSnapshot(settingsDoc(uid), async snap => {
      if (snap.exists()) {
        const data = snap.data();
        setSettingsState({ theme: data.theme ?? 'light', language: data.language ?? 'de' });
        setActiveContextState((data.activeContext as ActiveContext) ?? {});
      }
      mark('settings');
    }));

    unsubs.push(onSnapshot(col(uid, 'shoppingItems'), snap => {
      setShoppingItems(snap.docs.map(d => ({ ...d.data(), id: d.id } as ShoppingItem)));
      mark('shoppingItems');
    }));

    // Check for migration after listeners are set up
    void (async () => {
      const tasksSnap = await getDocs(col(uid, 'tasks'));
      if (tasksSnap.empty) await migrate(uid);
    })();

    return () => unsubs.forEach(u => u());
  }, [uid, migrate]);

  // ── State object ───────────────────────────────────────────────
  const state: AppState = { tasks, categories, projects, habits, habitLogs, dayLogs, shoppingItems, settings, activeContext };

  // ── Task helpers ───────────────────────────────────────────────
  const ensureDayLogDoc = async (date: string) => {
    const existing = dayLogs.find(l => l.date === date);
    if (!existing) {
      const empty: DayLog = { date, journalEntries: [], completedTaskIds: [], progressEntries: [] };
      await setDoc(fdoc(uid, 'dayLogs', date), clean(empty));
    }
  };

  // ── Tasks ──────────────────────────────────────────────────────
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const id = generateId();
    const newTask: Task = { ...task, id, createdAt: new Date().toISOString() };
    void setDoc(fdoc(uid, 'tasks', id), clean(newTask));
    return id;
  }, [uid]);

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    void updateDoc(fdoc(uid, 'tasks', id), clean(changes as object));
  }, [uid]);

  const completeTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const now = new Date().toISOString();
    const date = today();

    if (task.isRecurring) {
      if (task.lastCompletedDate === date) {
        // Toggle off: un-complete
        await updateDoc(fdoc(uid, 'tasks', id), { lastCompletedDate: null });
        return;
      }
      // Complete recurring: keep active, reset progress, set lastCompletedDate
      await updateDoc(fdoc(uid, 'tasks', id), clean({
        lastCompletedDate: date,
        lastWorkedOn: date,
        progress: task.progress.type !== 'checkbox'
          ? { ...task.progress, current: 0 }
          : task.progress,
        subTasks: task.subTasks?.map(st => ({ ...st, isCompleted: false, completedAt: null })),
      }));
    } else {
      await updateDoc(fdoc(uid, 'tasks', id), { status: 'completed', completedAt: now });
    }

    await ensureDayLogDoc(date);
    const log = dayLogs.find(l => l.date === date);
    const ids = log?.completedTaskIds ?? [];
    if (!ids.includes(id)) {
      await updateDoc(fdoc(uid, 'dayLogs', date), { completedTaskIds: [...ids, id] });
    }
  }, [uid, tasks, dayLogs]);

  const reopenTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task?.isRecurring) {
      void updateDoc(fdoc(uid, 'tasks', id), { lastCompletedDate: null });
    } else {
      void updateDoc(fdoc(uid, 'tasks', id), { status: 'active', completedAt: null });
    }
  }, [uid, tasks]);

  const deleteTask = useCallback((id: string) => {
    void deleteDoc(fdoc(uid, 'tasks', id));
  }, [uid]);

  const markStarted = useCallback((id: string) => {
    void updateDoc(fdoc(uid, 'tasks', id), { lastWorkedOn: today() });
  }, [uid]);

  const toggleInProgress = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    void updateDoc(fdoc(uid, 'tasks', id), { inProgress: !task.inProgress });
  }, [uid, tasks]);

  const incrementCounter = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.progress.type !== 'counter') return;
    const from = task.progress.current ?? 0;
    const to = from + 1;
    const isCompleted = task.progress.total != null && to >= task.progress.total;
    const date = today();
    const now = new Date().toISOString();

    await updateDoc(fdoc(uid, 'tasks', taskId), {
      'progress.current': to,
      status: isCompleted ? 'completed' : task.status,
      completedAt: isCompleted ? now : null,
      lastWorkedOn: date,
    });

    await ensureDayLogDoc(date);
    const log = dayLogs.find(l => l.date === date);
    const entry: ProgressEntry = {
      taskId, taskTitle: task.title, fromValue: from, toValue: to, timestamp: now,
    };
    const progressEntries = [...(log?.progressEntries ?? []), entry];
    const completedTaskIds = isCompleted && !log?.completedTaskIds.includes(taskId)
      ? [...(log?.completedTaskIds ?? []), taskId]
      : (log?.completedTaskIds ?? []);
    await updateDoc(fdoc(uid, 'dayLogs', date), clean({ progressEntries, completedTaskIds }));
  }, [uid, tasks, dayLogs]);

  const decrementCounter = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.progress.type !== 'counter') return;
    const to = Math.max(0, (task.progress.current ?? 0) - 1);
    await updateDoc(fdoc(uid, 'tasks', taskId), {
      'progress.current': to, status: 'active', completedAt: null, lastWorkedOn: today(),
    });
  }, [uid, tasks]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subTasks) return;
    const now = new Date().toISOString();
    const updated = task.subTasks.map(st =>
      st.id === subtaskId
        ? { ...st, isCompleted: !st.isCompleted, completedAt: !st.isCompleted ? now : undefined }
        : st
    );
    const allDone = updated.every(st => st.isCompleted);
    await updateDoc(fdoc(uid, 'tasks', taskId), clean({
      subTasks: updated,
      status: allDone ? 'completed' : 'active',
      completedAt: allDone ? now : null,
      lastWorkedOn: today(),
    }));
    if (allDone) {
      const date = today();
      await ensureDayLogDoc(date);
      const log = dayLogs.find(l => l.date === date);
      const ids = log?.completedTaskIds ?? [];
      if (!ids.includes(taskId)) {
        await updateDoc(fdoc(uid, 'dayLogs', date), { completedTaskIds: [...ids, taskId] });
      }
    }
  }, [uid, tasks, dayLogs]);

  // ── Projects ───────────────────────────────────────────────────
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) => {
    const id = generateId();
    const p: Project = { ...project, id, createdAt: new Date().toISOString() };
    void setDoc(fdoc(uid, 'projects', id), clean(p));
  }, [uid]);

  const updateProject = useCallback((id: string, changes: Partial<Project>) => {
    void updateDoc(fdoc(uid, 'projects', id), clean(changes as object));
  }, [uid]);

  const deleteProject = useCallback(async (id: string) => {
    await deleteDoc(fdoc(uid, 'projects', id));
    const batch = writeBatch(db);
    tasks.filter(t => t.projectId === id).forEach(t => {
      batch.update(fdoc(uid, 'tasks', t.id), { projectId: null });
    });
    await batch.commit();
  }, [uid, tasks]);

  // ── Categories ─────────────────────────────────────────────────
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const id = generateId();
    void setDoc(fdoc(uid, 'categories', id), clean({ ...cat, id }));
  }, [uid]);

  const updateCategory = useCallback((id: string, changes: Partial<Category>) => {
    void updateDoc(fdoc(uid, 'categories', id), clean(changes as object));
  }, [uid]);

  const deleteCategory = useCallback((id: string) => {
    void deleteDoc(fdoc(uid, 'categories', id));
  }, [uid]);

  // ── Day log ────────────────────────────────────────────────────
  const updateDayNote = useCallback(async (date: string, note: string) => {
    await ensureDayLogDoc(date);
    await updateDoc(fdoc(uid, 'dayLogs', date), { note });
  }, [uid, dayLogs]);

  const addJournalEntry = useCallback(async (date: string, text: string) => {
    const entry: JournalEntry = { id: generateId(), text, createdAt: new Date().toISOString() };
    await ensureDayLogDoc(date);
    const log = dayLogs.find(l => l.date === date);
    const entries = [...(log?.journalEntries ?? []), entry];
    await updateDoc(fdoc(uid, 'dayLogs', date), { journalEntries: entries });
  }, [uid, dayLogs]);

  const updateJournalEntry = useCallback(async (date: string, entryId: string, text: string) => {
    const log = dayLogs.find(l => l.date === date);
    if (!log) return;
    const entries = (log.journalEntries ?? []).map(e =>
      e.id === entryId ? { ...e, text, updatedAt: new Date().toISOString() } : e
    );
    await updateDoc(fdoc(uid, 'dayLogs', date), { journalEntries: entries });
  }, [uid, dayLogs]);

  const deleteJournalEntry = useCallback(async (date: string, entryId: string) => {
    const log = dayLogs.find(l => l.date === date);
    if (!log) return;
    const entries = (log.journalEntries ?? []).filter(e => e.id !== entryId);
    await updateDoc(fdoc(uid, 'dayLogs', date), { journalEntries: entries });
  }, [uid, dayLogs]);

  // ── Context / Settings ─────────────────────────────────────────
  const setActiveContext = useCallback((context: ActiveContext) => {
    setActiveContextState(context);
    void setDoc(settingsDoc(uid), { ...settings, activeContext: context }, { merge: true });
  }, [uid, settings]);

  const updateSettings = useCallback((changes: Partial<AppState['settings']>) => {
    const next = { ...settings, ...changes };
    setSettingsState(next);
    void setDoc(settingsDoc(uid), { ...next, activeContext }, { merge: true });
  }, [uid, settings, activeContext]);

  // ── Habits ─────────────────────────────────────────────────────
  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>) => {
    const id = generateId();
    const h: Habit = { ...habit, id, createdAt: new Date().toISOString() };
    void setDoc(fdoc(uid, 'habits', id), clean(h));
  }, [uid]);

  const updateHabit = useCallback((id: string, changes: Partial<Habit>) => {
    void updateDoc(fdoc(uid, 'habits', id), clean(changes as object));
  }, [uid]);

  const deleteHabit = useCallback(async (id: string) => {
    await deleteDoc(fdoc(uid, 'habits', id));
    const batch = writeBatch(db);
    habitLogs.filter(l => l.habitId === id).forEach(l => {
      batch.delete(fdoc(uid, 'habitLogs', `${l.date}_${l.habitId}`));
    });
    await batch.commit();
  }, [uid, habitLogs]);

  const toggleHabitDone = useCallback((habitId: string, date: string) => {
    const logId = `${date}_${habitId}`;
    const existing = habitLogs.find(l => l.habitId === habitId && l.date === date);
    if (existing) {
      void updateDoc(fdoc(uid, 'habitLogs', logId), { done: !existing.done });
    } else {
      void setDoc(fdoc(uid, 'habitLogs', logId), { habitId, date, done: true, count: 0 });
    }
  }, [uid, habitLogs]);

  const setHabitCount = useCallback((habitId: string, date: string, count: number) => {
    const logId = `${date}_${habitId}`;
    const existing = habitLogs.find(l => l.habitId === habitId && l.date === date);
    const val = Math.max(0, count);
    if (existing) {
      void updateDoc(fdoc(uid, 'habitLogs', logId), { count: val });
    } else {
      void setDoc(fdoc(uid, 'habitLogs', logId), { habitId, date, done: false, count: val });
    }
  }, [uid, habitLogs]);

  // ── Data export / import ───────────────────────────────────────
  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importData = useCallback(async (json: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(json) as AppState;
      if (!parsed.tasks || !parsed.categories) return false;
      const batch = writeBatch(db);
      parsed.tasks.forEach(t => batch.set(fdoc(uid, 'tasks', t.id), clean(t)));
      parsed.categories.forEach(c => batch.set(fdoc(uid, 'categories', c.id), clean(c)));
      parsed.projects?.forEach(p => batch.set(fdoc(uid, 'projects', p.id), clean(p)));
      parsed.habits?.forEach(h => batch.set(fdoc(uid, 'habits', h.id), clean(h)));
      parsed.habitLogs?.forEach(l => batch.set(fdoc(uid, 'habitLogs', `${l.date}_${l.habitId}`), clean(l)));
      parsed.dayLogs?.forEach(l => batch.set(fdoc(uid, 'dayLogs', l.date), clean(l)));
      await batch.commit();
      return true;
    } catch { return false; }
  }, [uid]);

  // ── Recurring reset ────────────────────────────────────────────
  const resetCompletedRecurring = useCallback(async () => {
    const todayStr = today();
    const toReset = tasks.filter(t =>
      t.isRecurring && t.status === 'completed' && t.dueDate && t.dueDate < todayStr
    );
    if (toReset.length === 0) return;
    const batch = writeBatch(db);
    toReset.forEach(task => {
      batch.update(fdoc(uid, 'tasks', task.id), clean({
        status: 'active',
        completedAt: null,
        dueDate: calculateNextDueDate(task, todayStr),
        progress: task.progress.type !== 'checkbox'
          ? { ...task.progress, current: 0 }
          : task.progress,
        subTasks: task.subTasks?.map(st => ({ ...st, isCompleted: false, completedAt: null })),
      }));
    });
    await batch.commit();
  }, [uid, tasks]);

  // ── Shopping list ──────────────────────────────────────────────
  const addShoppingItem = useCallback((name: string, quantity?: string) => {
    const id = generateId();
    const item: ShoppingItem = { id, name, quantity, isChecked: false, createdAt: new Date().toISOString() };
    void setDoc(fdoc(uid, 'shoppingItems', id), clean(item));
  }, [uid]);

  const toggleShoppingItem = useCallback((id: string) => {
    const item = shoppingItems.find(i => i.id === id);
    if (!item) return;
    void updateDoc(fdoc(uid, 'shoppingItems', id), { isChecked: !item.isChecked });
  }, [uid, shoppingItems]);

  const removeShoppingItem = useCallback((id: string) => {
    void deleteDoc(fdoc(uid, 'shoppingItems', id));
  }, [uid]);

  const clearCheckedShoppingItems = useCallback(() => {
    const checked = shoppingItems.filter(i => i.isChecked);
    const batch = writeBatch(db);
    checked.forEach(i => batch.delete(fdoc(uid, 'shoppingItems', i.id)));
    void batch.commit();
  }, [uid, shoppingItems]);

  return {
    state,
    dataLoading,
    addTask, updateTask, completeTask, reopenTask, deleteTask, markStarted, toggleInProgress,
    incrementCounter, decrementCounter, toggleSubtask,
    addProject, updateProject, deleteProject,
    addCategory, updateCategory, deleteCategory,
    updateDayNote, addJournalEntry, updateJournalEntry, deleteJournalEntry,
    addHabit, updateHabit, deleteHabit, toggleHabitDone, setHabitCount,
    setActiveContext, updateSettings,
    exportData, importData, resetCompletedRecurring,
    addShoppingItem, toggleShoppingItem, removeShoppingItem, clearCheckedShoppingItems,
  };
}
