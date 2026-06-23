import { useTranslation } from 'react-i18next';
import type { Habit, HabitLog } from '../../types';
import { isHabitCompleted, getStreak } from '../../utils/habitHelpers';
import { today } from '../../utils/dateHelpers';

interface Props {
  habit: Habit;
  log: HabitLog | undefined;
  allLogs: HabitLog[];
  onToggle: () => void;
  onCount: (n: number) => void;
  onClick?: () => void;
}

export default function HabitCard({ habit, log, allLogs, onToggle, onCount, onClick }: Props) {
  const { t } = useTranslation();
  const todayStr = today();
  const completed = isHabitCompleted(habit, log);
  const streak = getStreak(habit, allLogs, todayStr);
  const currentCount = log?.count ?? 0;
  const target = habit.targetCount ?? 1;
  const countPct = habit.type === 'count' ? Math.min(100, (currentCount / target) * 100) : 0;

  return (
    <div className={`habit-card${completed ? ' completed' : ''}`}>
      {/* Icon */}
      <div className="habit-icon" style={{ background: habit.color + '22' }}>
        {habit.icon}
      </div>

      {/* Body */}
      <div className="habit-body" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <div className="habit-name">{habit.name}</div>
        <div className="habit-meta">
          {streak > 0 && (
            <span className="habit-streak">🔥 {streak} {t('habits.days')}</span>
          )}
          {habit.type === 'count' && (
            <span className="habit-rate">{currentCount}/{target} {habit.unit ?? ''}</span>
          )}
        </div>
        {habit.type === 'count' && (
          <div className="habit-count-bar-wrap" style={{ marginTop: 4, width: '100%' }}>
            <div className="habit-count-bar" style={{ width: `${countPct}%` }} />
          </div>
        )}
      </div>

      {/* Action */}
      {habit.type === 'boolean' ? (
        <button className={`habit-check${completed ? ' checked' : ''}`} onClick={onToggle}>
          {completed && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
        </button>
      ) : (
        <div className="habit-counter" onClick={e => e.stopPropagation()}>
          <button className="habit-counter-btn"
            onClick={() => onCount(currentCount - 1)}
            disabled={currentCount <= 0}>−</button>
          <span className="habit-count-display">{currentCount}/{target}</span>
          <button className="habit-counter-btn"
            onClick={() => onCount(currentCount + 1)}>+</button>
        </div>
      )}
    </div>
  );
}
