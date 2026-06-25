import type { Habit, HabitLog } from '../../types';
import { getHabitLog, isScheduledForDate, isHabitCompleted } from '../../utils/habitHelpers';
import { today } from '../../utils/dateHelpers';

interface Props {
  habit: Habit;
  logs: HabitLog[];
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLast30Days(): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = 29; i >= 0; i--) {
    const dd = new Date(d);
    dd.setDate(d.getDate() - i);
    days.push(localDateStr(dd));
  }
  return days;
}

export default function HabitChart({ habit, logs }: Props) {
  const days = getLast30Days();
  const todayStr = today();
  const isCount = habit.type === 'count';
  const target = habit.targetCount ?? 1;

  const data = days.map(date => {
    const scheduled = isScheduledForDate(habit, date);
    const log = getHabitLog(logs, habit.id, date);
    const completed = isHabitCompleted(habit, log);
    const count = log?.count ?? 0;
    const isFuture = date > todayStr;
    return { date, scheduled, completed, count, isFuture };
  });

  if (isCount) {
    // Bar chart for count habits
    const maxVal = Math.max(target, ...data.map(d => d.count));
    const barW = 7;
    const gap = 2;
    const chartW = days.length * (barW + gap) - gap;
    const chartH = 48;
    const targetY = chartH - (target / maxVal) * chartH;

    return (
      <div className="habit-chart">
        <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 2}`} preserveAspectRatio="xMidYMid meet">
          {/* Target line */}
          <line x1={0} y1={targetY} x2={chartW} y2={targetY}
            stroke="var(--color-accent)" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />

          {data.map((d, i) => {
            const x = i * (barW + gap);
            if (!d.scheduled || d.isFuture) {
              return <rect key={d.date} x={x} y={chartH - 2} width={barW} height={2}
                rx="1" fill="var(--color-bg-muted)" />;
            }
            const fillH = maxVal > 0 ? Math.max(2, (d.count / maxVal) * chartH) : 2;
            const color = d.completed ? 'var(--color-accent)' : d.count > 0 ? '#F59E0B' : 'var(--color-bg-muted)';
            return (
              <rect key={d.date} x={x} y={chartH - fillH} width={barW} height={fillH}
                rx="1" fill={color} />
            );
          })}
        </svg>
        <div className="habit-chart-labels">
          <span>-30 Tage</span>
          <span className="habit-chart-target">Ziel: {target}{habit.unit ? ' ' + habit.unit : ''}</span>
          <span>heute</span>
        </div>
      </div>
    );
  }

  // Boolean habits: row of squares
  return (
    <div className="habit-chart">
      <div className="habit-chart-squares">
        {data.map(d => {
          let bg = 'var(--color-bg-muted)';
          if (!d.scheduled || d.isFuture) bg = 'transparent';
          else if (d.completed) bg = 'var(--color-accent)';
          return (
            <div key={d.date} className="habit-chart-square"
              style={{ background: bg, border: !d.scheduled || d.isFuture ? '1px dashed var(--color-border)' : 'none' }} />
          );
        })}
      </div>
      <div className="habit-chart-labels">
        <span>-30 Tage</span>
        <span />
        <span>heute</span>
      </div>
    </div>
  );
}
