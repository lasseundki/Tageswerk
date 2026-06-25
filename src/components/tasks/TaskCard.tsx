import { useTranslation } from 'react-i18next';
import type { Task, Category } from '../../types';
import { isOverdue, isToday, formatRelative, today } from '../../utils/dateHelpers';

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
  const workedOnToday = !done && task.lastWorkedOn === today();

  const completedSubtasks = task.subTasks?.filter(st => st.isCompleted).length ?? 0;
  const totalSubtasks = task.subTasks?.length ?? 0;
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
            {task.inProgress && !done && (
              <span className="badge badge-in-progress">{t('task.inProgress')}</span>
            )}
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
          {task.address && (
            <span className="task-card-due" title={task.address}>🗺️ {task.address}</span>
          )}
          {task.estimatedMinutes && (
            <span className="task-card-effort">
              ⏱ {task.estimatedMinutes}min
            </span>
          )}
          {workedOnToday && (
            <span className="task-card-worked-today">{t('task.workedToday')}</span>
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

        {/* Subtask preview (active tasks) */}
        {task.progress.type === 'subtasks' && task.subTasks && task.subTasks.length > 0 && !done && (
          <div className="task-card-subtasks task-card-subtasks--preview">
            <div className="task-card-subtask-header">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
              {completedSubtasks}/{totalSubtasks}
            </div>
            {task.subTasks.slice(0, 3).map(st => (
              <div key={st.id} className={`task-card-subtask${st.isCompleted ? ' done' : ''}`}>
                <span className="task-card-subtask-dot">{st.isCompleted ? '✓' : '○'}</span>
                {st.title}
              </div>
            ))}
            {task.subTasks.length > 3 && (
              <div className="task-card-subtask" style={{ opacity: 0.45 }}>
                +{task.subTasks.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Subtask list (completed tasks) */}
        {done && task.subTasks && task.subTasks.length > 0 && (
          <div className="task-card-subtasks">
            {task.subTasks.map(st => (
              <div key={st.id} className={`task-card-subtask${st.isCompleted ? ' done' : ''}`}>
                <span className="task-card-subtask-dot">{st.isCompleted ? '✓' : '○'}</span>
                {st.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
