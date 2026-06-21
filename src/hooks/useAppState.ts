import { useState, useEffect, useCallback } from 'react';
import type { AppState, Task, Project, Category, ActiveContext, ProgressEntry } from '../types';
import {
  loadState, saveState, generateId,
  addCompletedToLog, addProgressEntry,
} from '../utils/storage';
import { today, calculateNextDueDate } from '../utils/dateHelpers';

export type AppStateContext = ReturnType<typeof useAppState>;

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => { saveState(state); }, [state]);

  // ── Tasks ──────────────────────────────────────────────────────
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = { ...task, id: generateId(), createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    return newTask.id;
  }, []);

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...changes } : t),
    }));
  }, []);

  const completeTask = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === id ? { ...t, status: 'completed', completedAt: now } : t
      ),
      dayLogs: addCompletedToLog(prev.dayLogs, today(), id),
    }));
  }, []);

  const reopenTask = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === id ? { ...t, status: 'active', completedAt: undefined } : t
      ),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  }, []);

  const markStarted = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, lastWorkedOn: today() } : t),
    }));
  }, []);

  const incrementCounter = useCallback((taskId: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task || task.progress.type !== 'counter') return prev;
      const from = task.progress.current ?? 0;
      const to = from + 1;
      const isCompleted = task.progress.total != null && to >= task.progress.total;
      const entry: ProgressEntry = {
        taskId, taskTitle: task.title, fromValue: from, toValue: to,
        timestamp: new Date().toISOString(),
      };
      let logs = addProgressEntry(prev.dayLogs, today(), entry);
      if (isCompleted) logs = addCompletedToLog(logs, today(), taskId);
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? {
          ...t,
          progress: { ...t.progress, current: to },
          status: isCompleted ? 'completed' : t.status,
          completedAt: isCompleted ? new Date().toISOString() : t.completedAt,
          lastWorkedOn: today(),
        } : t),
        dayLogs: logs,
      };
    });
  }, []);

  const decrementCounter = useCallback((taskId: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task || task.progress.type !== 'counter') return prev;
      const to = Math.max(0, (task.progress.current ?? 0) - 1);
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? {
          ...t,
          progress: { ...t.progress, current: to },
          status: 'active',
          completedAt: undefined,
          lastWorkedOn: today(),
        } : t),
      };
    });
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task || !task.subTasks) return prev;
      const now = new Date().toISOString();
      const updated = task.subTasks.map(st =>
        st.id === subtaskId
          ? { ...st, isCompleted: !st.isCompleted, completedAt: !st.isCompleted ? now : undefined }
          : st
      );
      const allDone = updated.every(st => st.isCompleted);
      let logs = prev.dayLogs;
      if (allDone) logs = addCompletedToLog(logs, today(), taskId);
      return {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? {
          ...t, subTasks: updated,
          status: allDone ? 'completed' : 'active',
          completedAt: allDone ? now : undefined,
          lastWorkedOn: today(),
        } : t),
        dayLogs: logs,
      };
    });
  }, []);

  // ── Projects ───────────────────────────────────────────────────
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) => {
    const p: Project = { ...project, id: generateId(), createdAt: new Date().toISOString() };
    setState(prev => ({ ...prev, projects: [...prev.projects, p] }));
  }, []);

  const updateProject = useCallback((id: string, changes: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...changes } : p),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      tasks: prev.tasks.map(t => t.projectId === id ? { ...t, projectId: undefined } : t),
    }));
  }, []);

  // ── Categories ─────────────────────────────────────────────────
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const c: Category = { ...cat, id: generateId() };
    setState(prev => ({ ...prev, categories: [...prev.categories, c] }));
  }, []);

  const updateCategory = useCallback((id: string, changes: Partial<Category>) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...changes } : c),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== id) }));
  }, []);

  // ── Day log ────────────────────────────────────────────────────
  const updateDayNote = useCallback((date: string, note: string) => {
    setState(prev => {
      const exists = prev.dayLogs.some(l => l.date === date);
      if (exists) {
        return { ...prev, dayLogs: prev.dayLogs.map(l => l.date === date ? { ...l, note } : l) };
      }
      return { ...prev, dayLogs: [...prev.dayLogs, { date, note, completedTaskIds: [], progressEntries: [] }] };
    });
  }, []);

  // ── Context / settings ─────────────────────────────────────────
  const setActiveContext = useCallback((context: ActiveContext) => {
    setState(prev => ({ ...prev, activeContext: context }));
  }, []);

  const updateSettings = useCallback((settings: Partial<AppState['settings']>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
  }, []);

  // ── Data export / import ───────────────────────────────────────
  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as AppState;
      if (!parsed.tasks || !parsed.categories) return false;
      setState(parsed);
      return true;
    } catch { return false; }
  }, []);

  // ── Recurring reset (call on mount) ───────────────────────────
  const resetCompletedRecurring = useCallback(() => {
    const todayStr = today();
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => {
        if (!task.isRecurring || task.status !== 'completed') return task;
        if (!task.dueDate || task.dueDate >= todayStr) return task;
        return {
          ...task,
          status: 'active',
          completedAt: undefined,
          dueDate: calculateNextDueDate(task, todayStr),
          progress: task.progress.type !== 'checkbox'
            ? { ...task.progress, current: 0 }
            : task.progress,
          subTasks: task.subTasks?.map(st => ({ ...st, isCompleted: false, completedAt: undefined })),
        };
      }),
    }));
  }, []);

  return {
    state,
    addTask, updateTask, completeTask, reopenTask, deleteTask, markStarted,
    incrementCounter, decrementCounter, toggleSubtask,
    addProject, updateProject, deleteProject,
    addCategory, updateCategory, deleteCategory,
    updateDayNote, setActiveContext, updateSettings,
    exportData, importData, resetCompletedRecurring,
  };
}
