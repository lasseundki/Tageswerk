import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useFirestoreState';
import { useFocusSuggestion } from '../hooks/useFocusSuggestion';
import { today, timeProgress, effectiveUrgency } from '../utils/dateHelpers';
import { getTodayHabits, getHabitLog } from '../utils/habitHelpers';
import type { HabitTimeOfDay } from '../types';
import HabitCard from '../components/habits/HabitCard';
import FocusSuggestion from '../components/today/FocusSuggestion';
import ContextSelector from '../components/today/ContextSelector';
import TaskCard from '../components/tasks/TaskCard';
import TaskDetail from '../components/tasks/TaskDetail';
import TaskForm from '../components/tasks/TaskForm';

type ClockMode = 'hidden' | 'time' | 'countdown';

function getClockMode(): ClockMode {
  return (localStorage.getItem('tageswerk_clock_mode') as ClockMode) ?? 'hidden';
}

function formatCountdown(now: Date): string {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ms = midnight.getTime() - now.getTime();
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function countdownColor(now: Date): string {
  return now.getHours() >= 18 ? '#DC2626' : '#F59E0B';
}

function useClockTick() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

interface Props {
  ctx: AppStateContext;
}

export default function TodayScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, addTask, updateTask, completeTask, reopenTask, deleteTask, markStarted,
    toggleInProgress, incrementCounter, decrementCounter, toggleSubtask, setActiveContext,
    updateDayNote, toggleHabitDone, setHabitCount } = ctx;

  const [clockMode, setClockMode] = useState<ClockMode>(getClockMode);
  const now = useClockTick();

  const cycleClockMode = useCallback(() => {
    setClockMode(prev => {
      const next: ClockMode = prev === 'hidden' ? 'time' : prev === 'time' ? 'countdown' : 'hidden';
      localStorage.setItem('tageswerk_clock_mode', next);
      return next;
    });
  }, []);

  const TIME_ORDER: HabitTimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];
  const todayHabits = getTodayHabits(state.habits, today());
  const habitGroups = TIME_ORDER
    .map(tod => ({ tod, habits: todayHabits.filter(h => h.timeOfDay === tod) }))
    .filter(g => g.habits.length > 0);

  const { suggestions, skipSuggestion } = useFocusSuggestion(state);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);

  const todayStr = today();
  const todayLog = state.dayLogs.find(l => l.date === todayStr);

  const todayTasks = state.tasks.filter(t =>
    t.status === 'active' && (
      t.inProgress ||
      t.dueDate === todayStr ||
      (!t.dueDate && t.lastWorkedOn === todayStr)
    )
  );

  const completedToday = state.tasks.filter(t =>
    t.status === 'completed' && t.completedAt?.startsWith(todayStr)
  );

  // Tasks with an explicit today-deadline or urgency=today (shown prominently above suggestions)
  const dueTodayTasks = state.tasks.filter(t =>
    t.status === 'active' && !t.inProgress &&
    (t.dueDate === todayStr || effectiveUrgency(t) === 'today')
  );

  const selectedTask = selectedTaskId ? state.tasks.find(t => t.id === selectedTaskId) : null;
  const getCategory = (id: string) => state.categories.find(c => c.id === id);
  const getProject = (id?: string) => id ? state.projects.find(p => p.id === id) : undefined;

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="today-title-row">
          <h1 className="screen-title">{t('nav.today')}</h1>
          <button
            className="clock-chip"
            onClick={cycleClockMode}
            title="Klicken zum Wechseln"
            style={clockMode === 'countdown' ? { color: countdownColor(now) } : undefined}
          >
            {clockMode === 'hidden' && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
            )}
            {clockMode === 'time' && now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            {clockMode === 'countdown' && formatCountdown(now)}
          </button>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setAddingTask(true)}>
          + {t('task.add')}
        </button>
      </div>

      {/* Time progress */}
      {(() => {
        const prog = timeProgress();
        const rows: Array<{ key: 'year' | 'month' | 'week'; label: string; pct: number }> = [
          { key: 'year', label: t('timeProgress.year'), pct: prog.year },
          { key: 'month', label: t('timeProgress.month'), pct: prog.month },
          { key: 'week', label: t('timeProgress.week'), pct: prog.week },
        ];
        return (
          <div className="time-progress">
            {rows.map(({ key, label, pct }) => (
              <div key={key} className="time-progress-row">
                <span className="time-progress-label">{label}</span>
                <div className="time-progress-bar-wrap">
                  <div className="time-progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="time-progress-pct">{pct}%</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Context selector */}
      <ContextSelector context={state.activeContext} onChange={setActiveContext} />

      {/* Due today — mandatory tasks */}
      {dueTodayTasks.length > 0 && (
        <div className="due-today-section">
          <div className="due-today-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {t('today.dueToday')}
          </div>
          <div className="due-today-list">
            {dueTodayTasks.map(task => (
              <div key={task.id} className="due-today-item" onClick={() => setSelectedTaskId(task.id)}>
                <button
                  className={`task-checkbox${task.status === 'completed' ? ' checked' : ''}`}
                  onClick={e => { e.stopPropagation(); completeTask(task.id); }}
                  style={{ flexShrink: 0 }}
                />
                <span className="due-today-title">{task.title}</span>
                {task.dueDate && (
                  <span className="due-today-date">{task.dueDate === todayStr ? t('date.today') : ''}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Focus suggestions */}
      <FocusSuggestion
        suggestions={suggestions}
        onSkip={skipSuggestion}
        onOpen={id => setSelectedTaskId(id)}
        onStart={id => { markStarted(id); setSelectedTaskId(id); }}
      />

      {/* Today's tasks */}
      {todayTasks.length > 0 && (
        <section>
          <h2 className="section-title">{t('today.todayTasks')}</h2>
          <div className="task-list">
            {todayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                category={getCategory(task.categoryId)}
                onOpen={() => setSelectedTaskId(task.id)}
                onComplete={() => completeTask(task.id)}
                onIncrement={() => incrementCounter(task.id)}
                onDecrement={() => decrementCounter(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Habits — before completed so pending habits stay visible */}
      {habitGroups.length > 0 && (
        <section style={{ marginBottom: 'var(--space-6)' }}>
          <h2 className="section-label">{t('habits.todaySection')}</h2>
          {habitGroups.map(({ tod, habits }) => (
            <div key={tod} className="habit-time-group">
              {habitGroups.length > 1 && (
                <div className="habit-time-label">{t(`habits.${tod}`)}</div>
              )}
              <div className="habit-list">
                {habits.map(habit => {
                  const log = getHabitLog(state.habitLogs, habit.id, todayStr);
                  return (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      log={log}
                      allLogs={state.habitLogs}
                      onToggle={() => toggleHabitDone(habit.id, todayStr)}
                      onCount={n => setHabitCount(habit.id, todayStr, n)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <section>
          <h2 className="section-title">{t('today.completedToday')} ({completedToday.length})</h2>
          <div className="task-list">
            {completedToday.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                category={getCategory(task.categoryId)}
                onOpen={() => setSelectedTaskId(task.id)}
                onComplete={() => reopenTask(task.id)}
                onIncrement={() => incrementCounter(task.id)}
                onDecrement={() => decrementCounter(task.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Progress today (counter + subtask entries) */}
      {(() => {
        const entries = todayLog?.progressEntries ?? [];
        if (entries.length === 0) return null;

        const counterGroups: { taskId: string; taskTitle: string; from: number; to: number }[] = [];
        const subtaskItems: { taskTitle: string; subtaskTitle: string }[] = [];

        entries.forEach(e => {
          if (e.subtaskTitle) {
            subtaskItems.push({ taskTitle: e.taskTitle, subtaskTitle: e.subtaskTitle });
          } else {
            const g = counterGroups.find(g => g.taskId === e.taskId);
            if (g) { g.to = e.toValue; }
            else { counterGroups.push({ taskId: e.taskId, taskTitle: e.taskTitle, from: e.fromValue, to: e.toValue }); }
          }
        });

        return (
          <section>
            <h2 className="section-title">{t('today.progressToday')}</h2>
            <div className="progress-log">
              {counterGroups.map(g => {
                const task = state.tasks.find(t => t.id === g.taskId);
                const total = task?.progress.total;
                return (
                  <div key={g.taskId} className="progress-log-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    <span className="progress-log-task-title">{g.taskTitle}</span>
                    <span className="progress-log-counter">{g.from} → {g.to}{total ? ` / ${total}` : ''}</span>
                  </div>
                );
              })}
              {subtaskItems.map((e, i) => (
                <div key={i} className="progress-log-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span className="progress-log-task-title">{e.subtaskTitle}</span>
                  <span className="progress-log-sub">{e.taskTitle}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Day note */}
      <section>
        <h2 className="section-title">{t('review.dayNote')}</h2>
        <textarea
          className="input day-note-area"
          placeholder={t('review.dayNotePlaceholder')}
          value={todayLog?.note ?? ''}
          onChange={e => updateDayNote(todayStr, e.target.value)}
        />
      </section>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          category={getCategory(selectedTask.categoryId)}
          project={getProject(selectedTask.projectId)}
          categories={state.categories}
          projects={state.projects}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={changes => updateTask(selectedTask.id, changes)}
          onDelete={() => { deleteTask(selectedTask.id); setSelectedTaskId(null); }}
          onComplete={() => completeTask(selectedTask.id)}
          onReopen={() => reopenTask(selectedTask.id)}
          onToggleSubtask={stId => toggleSubtask(selectedTask.id, stId)}
          onToggleInProgress={() => toggleInProgress(selectedTask.id)}
          onIncrement={() => incrementCounter(selectedTask.id)}
          onDecrement={() => decrementCounter(selectedTask.id)}
        />
      )}

      {/* Add task modal */}
      {addingTask && (
        <TaskForm
          isOpen
          onClose={() => setAddingTask(false)}
          tasks={state.tasks}
          categories={state.categories}
          projects={state.projects}
          onSave={data => { addTask(data); }}
        />
      )}
    </div>
  );
}

