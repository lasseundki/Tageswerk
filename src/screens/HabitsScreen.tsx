import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useFirestoreState';
import type { HabitTimeOfDay } from '../types';
import { today } from '../utils/dateHelpers';
import { getTodayHabits, getHabitLog, getStreak, getCompletionRate, isHabitCompleted } from '../utils/habitHelpers';
import HabitCard from '../components/habits/HabitCard';
import HabitForm from '../components/habits/HabitForm';

interface Props { ctx: AppStateContext; }

const TIME_ORDER: HabitTimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];

export default function HabitsScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, addHabit, updateHabit, deleteHabit, toggleHabitDone, setHabitCount } = ctx;
  const todayStr = today();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const todayHabits = getTodayHabits(state.habits, todayStr);
  const editingHabit = editingId ? state.habits.find(h => h.id === editingId) : undefined;

  const visibleHabits = state.habits.filter(h =>
    showArchived ? h.isArchived : !h.isArchived
  ).sort((a, b) => a.order - b.order);

  const groupedToday = TIME_ORDER.map(tod => ({
    tod,
    habits: todayHabits.filter(h => h.timeOfDay === tod),
  })).filter(g => g.habits.length > 0);

  const completedToday = todayHabits.filter(h =>
    isHabitCompleted(h, getHabitLog(state.habitLogs, h.id, todayStr))
  ).length;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('habits.title')}</h1>
        <button className="btn btn-outline btn-sm" onClick={() => setAdding(true)}>
          + {t('habits.add')}
        </button>
      </div>

      {/* Today summary */}
      {todayHabits.length > 0 && (
        <div className="time-progress" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              {t('habits.todaySection')}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {completedToday}/{todayHabits.length}
            </span>
          </div>
          <div className="time-progress-bar-wrap" style={{ height: 8 }}>
            <div className="time-progress-bar"
              style={{ width: `${todayHabits.length > 0 ? (completedToday / todayHabits.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {/* Today's habits grouped by time */}
      {groupedToday.length > 0 && (
        <section style={{ marginBottom: 'var(--space-8)' }}>
          {groupedToday.map(({ tod, habits }) => (
            <div key={tod} className="habit-time-group">
              <div className="habit-time-label">{t(`habits.${tod}`)}</div>
              <div className="habit-list">
                {habits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    log={getHabitLog(state.habitLogs, habit.id, todayStr)}
                    allLogs={state.habitLogs}
                    onToggle={() => toggleHabitDone(habit.id, todayStr)}
                    onCount={n => setHabitCount(habit.id, todayStr, n)}
                    onClick={() => setEditingId(habit.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* All habits management */}
      <div className="screen-header" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 className="section-label" style={{ margin: 0 }}>
          {showArchived ? t('habits.showArchived') : t('habits.title')}
        </h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowArchived(v => !v)}>
          {showArchived ? 'â† Aktive' : t('habits.showArchived')}
        </button>
      </div>

      {visibleHabits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">ðŸŒ±</div>
          <p>{t('habits.noHabits')}</p>
        </div>
      ) : (
        <div className="habit-list">
          {visibleHabits.map(habit => {
            const streak = getStreak(habit, state.habitLogs, todayStr);
            const rate7  = getCompletionRate(habit, state.habitLogs, todayStr, 7);
            const rate30 = getCompletionRate(habit, state.habitLogs, todayStr, 30);
            const freqLabel = t(`habits.${habit.frequency}`);
            const typeLabel = habit.type === 'count' && habit.targetCount
              ? `${habit.targetCount}${habit.unit ? ' ' + habit.unit : ''}`
              : t(`habits.${habit.type}`);

            return (
              <div key={habit.id} className="habit-manage-card" onClick={() => setEditingId(habit.id)}>
                <div className="habit-icon" style={{ background: habit.color + '22' }}>
                  {habit.icon}
                </div>
                <div className="habit-manage-body">
                  <div className="habit-manage-name">{habit.name}</div>
                  <div className="habit-manage-meta">
                    <span>{freqLabel}</span>
                    <span>{typeLabel}</span>
                    <span>{t(`habits.${habit.timeOfDay}`)}</span>
                  </div>
                  <div className="habit-stats-row">
                    <div className="habit-stat">
                      <span className="habit-stat-value">ðŸ”¥ {streak}</span>
                      <span className="habit-stat-label">{t('habits.streak')}</span>
                    </div>
                    <div className="habit-stat">
                      <span className="habit-stat-value">{rate7}%</span>
                      <span className="habit-stat-label">{t('habits.lastWeek')}</span>
                    </div>
                    <div className="habit-stat">
                      <span className="habit-stat-value">{rate30}%</span>
                      <span className="habit-stat-label">{t('habits.lastMonth')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <HabitForm
          isOpen onClose={() => setAdding(false)}
          habitCount={state.habits.length}
          onSave={data => { addHabit(data); }}
        />
      )}

      {/* Edit modal */}
      {editingHabit && (
        <HabitForm
          isOpen onClose={() => setEditingId(null)}
          habit={editingHabit}
          habitCount={state.habits.length}
          onSave={data => { updateHabit(editingHabit.id, data); setEditingId(null); }}
          onDelete={() => {
            if (editingHabit.isArchived) {
              deleteHabit(editingHabit.id);
            } else {
              updateHabit(editingHabit.id, { isArchived: true });
            }
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

