import { useTranslation } from 'react-i18next';
import type { Task, Category } from '../../types';
import { isOverdue, isToday, formatRelative } from '../../utils/dateHelpers';

interface Props {
  task: Task;
  category?: Category;
  onOpen: () => void;
  onComplete: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function TaskCard({ task, category, onOpen, onComplete, onIncrement, onDecrement }: Props) {
  const { t } = useTranslation();
  const done = task.status === 'completed';

  const completedSubtasks = task.subTasks?.filter(st => st.isCompleted).length ?? 0;
  const totalSubtasks = task.subTasks?.length ?? 0;
  const subtaskPct = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const counterPct = task.progress.total
    ? Math.min(100, ((task.progress.current ?? 0) / task.progress.total) * 100)
    : 0;

  const dueClass = task.dueDate
    ? isOverdue(task.dueDate) && !done ? ' overdue' : isToday(task.dueDate) ? ' due-today' : ''
    : '';

  return (
    <div className={`task-card${done ? ' done' : ''}`} onClick={onOpen}>
      {/* Checkbox for checkbox-type tasks */}
      {task.progress.type === 'checkbox' && (
        <button
          className={`task-checkbox${done ? ' checked' : ''}`}
          onClick={e => { e.stopPropagation(); onComplete(); }}
          aria-label={done ? t('task.reopen') : t('task.complete')}
        >
          {done && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
        </button>
      )}

      <div className="task-card-body">
        <div className="task-card-top">
          <span className={`task-title${done ? ' done' : ''}`}>{task.title}</span>
          <div className="task-card-badges">
            <span className={`badge badge-${task.priority}`}>{t(`priority.${task.priority}`)}</span>
            <span className={`badge badge-${task.mode}`}>
              {task.mode === 'digital' ? '💻' : '🤝'} {t(`mode.${task.mode}`)}
            </span>
            {task.mode === 'analog' && task.location !== 'anywhere' && (
              <span className={`badge badge-${task.location}`}>
                {task.location === 'home' ? '🏠' : '🗺️'} {t(`location.${task.location}`)}
              </span>
            )}
          </div>
        </div>

        <div className="task-card-meta">
          {category && (
            <span className="task-card-category">
              <span
                className="category-dot"
                style={{ background: category.color }}
              />
              {category.icon} {category.name}
            </span>
          )}
          {task.dueDate && (
            <span className={`task-card-due${dueClass}`}>
              {formatRelative(task.dueDate, t)}
            </span>
          )}
          {task.estimatedMinutes && (
            <span className="task-card-effort">
              ⏱ {task.estimatedMinutes}min
            </span>
          )}
        </div>

        {/* Counter progress */}
        {task.progress.type === 'counter' && (
          <div className="task-card-progress" onClick={e => e.stopPropagation()}>
            <button className="counter-btn" onClick={onDecrement} disabled={done}>−</button>
            <div className="progress-wrap" style={{ flex: 1 }}>
              <div className="progress-bar" style={{ width: `${counterPct}%` }} />
            </div>
            <span className="counter-value">
              {task.progress.current ?? 0}
              {task.progress.total != null ? `/${task.progress.total}` : ''}
              {task.progress.unit ? ` ${task.progress.unit}` : ''}
            </span>
            <button className="counter-btn" onClick={onIncrement} disabled={done}>+</button>
          </div>
        )}

        {/* Subtask progress */}
        {task.progress.type === 'subtasks' && totalSubtasks > 0 && (
          <div className="task-card-progress">
            <div className="progress-wrap" style={{ flex: 1 }}>
              <div className="progress-bar" style={{ width: `${subtaskPct}%` }} />
            </div>
            <span className="counter-value">{completedSubtasks}/{totalSubtasks}</span>
          </div>
        )}
      </div>
    </div>
  );
}
