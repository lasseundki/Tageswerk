import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Task, Category, Project } from '../../types';
import { formatDate, formatRelative, isOverdue, isToday } from '../../utils/dateHelpers';
import Modal from '../ui/Modal';
import TaskForm from './TaskForm';

interface Props {
  task: Task;
  category?: Category;
  project?: Project;
  categories: Category[];
  projects: Project[];
  onClose: () => void;
  onUpdate: (changes: Partial<Task>) => void;
  onDelete: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function TaskDetail({
  task, category, project, categories, projects,
  onClose, onUpdate, onDelete, onComplete, onReopen, onToggleSubtask,
  onIncrement, onDecrement,
}: Props) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const done = task.status === 'completed';

  const dueClass = task.dueDate
    ? isOverdue(task.dueDate) && !done ? ' overdue' : isToday(task.dueDate) ? ' due-today' : ''
    : '';

  const completedSubtasks = task.subTasks?.filter(st => st.isCompleted).length ?? 0;
  const totalSubtasks = task.subTasks?.length ?? 0;
  const counterPct = task.progress.total
    ? Math.min(100, ((task.progress.current ?? 0) / task.progress.total) * 100)
    : 0;

  const footer = (
    <>
      <button className="btn btn-ghost btn-md" onClick={onClose}>{t('common.close')}</button>
      <button className="btn btn-outline btn-md" onClick={() => setEditing(true)}>{t('common.edit')}</button>
      {done
        ? <button className="btn btn-secondary btn-md" onClick={onReopen}>{t('task.reopen')}</button>
        : <button className="btn btn-primary btn-md" onClick={onComplete}>{t('task.complete')}</button>
      }
    </>
  );

  return (
    <>
      <Modal isOpen title={task.title} onClose={onClose} footer={footer}>
        <div className="form-section">
          {/* Badges row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <span className={`badge badge-${task.priority}`}>{t(`priority.${task.priority}`)}</span>
            <span className={`badge badge-${task.mode}`}>
              {task.mode === 'digital' ? '💻' : '🤝'} {t(`mode.${task.mode}`)}
            </span>
            {task.mode === 'analog' && task.location !== 'anywhere' && (
              <span className={`badge badge-${task.location}`}>
                {task.location === 'home' ? '🏠' : '🗺️'} {t(`location.${task.location}`)}
              </span>
            )}
            {task.isRecurring && (
              <span className="badge" style={{ background: 'var(--color-surface-secondary)' }}>
                🔁 {t('form.recurring')}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              {task.description}
            </p>
          )}

          <hr className="form-divider" />

          {/* Details grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {category && (
              <div className="detail-row">
                <span className="detail-label">{t('form.category')}</span>
                <span className="detail-value">
                  <span className="category-dot" style={{ background: category.color }} />
                  {category.icon} {category.name}
                </span>
              </div>
            )}
            {project && (
              <div className="detail-row">
                <span className="detail-label">{t('form.project')}</span>
                <span className="detail-value">{project.name}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="detail-row">
                <span className="detail-label">{t('form.dueDate')}</span>
                <span className={`detail-value${dueClass}`}>
                  {formatDate(task.dueDate)} ({formatRelative(task.dueDate, t)})
                </span>
              </div>
            )}
            {task.estimatedMinutes && (
              <div className="detail-row">
                <span className="detail-label">{t('form.estimatedMinutes')}</span>
                <span className="detail-value">⏱ {task.estimatedMinutes} min</span>
              </div>
            )}
            <div className="detail-row">
              <span className="detail-label">{t('task.created')}</span>
              <span className="detail-value">{formatDate(task.createdAt.slice(0, 10))}</span>
            </div>
            {task.completedAt && (
              <div className="detail-row">
                <span className="detail-label">{t('task.completed')}</span>
                <span className="detail-value">{formatDate(task.completedAt.slice(0, 10))}</span>
              </div>
            )}
          </div>

          {/* Counter */}
          {task.progress.type === 'counter' && (
            <>
              <hr className="form-divider" />
              <div>
                <div className="detail-row" style={{ marginBottom: 'var(--space-2)' }}>
                  <span className="detail-label">{t('task.progress')}</span>
                  <span className="detail-value">
                    {task.progress.current ?? 0}
                    {task.progress.total != null ? `/${task.progress.total}` : ''}
                    {task.progress.unit ? ` ${task.progress.unit}` : ''}
                  </span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar" style={{ width: `${counterPct}%` }} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  <button className="btn btn-outline btn-sm" onClick={onDecrement} disabled={done}>−</button>
                  <button className="btn btn-outline btn-sm" onClick={onIncrement} disabled={done}>+</button>
                </div>
              </div>
            </>
          )}

          {/* Subtasks */}
          {task.progress.type === 'subtasks' && task.subTasks && task.subTasks.length > 0 && (
            <>
              <hr className="form-divider" />
              <div>
                <div className="detail-row" style={{ marginBottom: 'var(--space-2)' }}>
                  <span className="detail-label">{t('progressType.subtasks')}</span>
                  <span className="detail-value">{completedSubtasks}/{totalSubtasks}</span>
                </div>
                <div className="subtask-list">
                  {task.subTasks.map(st => (
                    <label key={st.id} className="subtask-check-row">
                      <input
                        type="checkbox"
                        checked={st.isCompleted}
                        onChange={() => onToggleSubtask(st.id)}
                      />
                      <span style={{ textDecoration: st.isCompleted ? 'line-through' : 'none', color: st.isCompleted ? 'var(--color-text-muted)' : 'inherit' }}>
                        {st.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Delete */}
          <hr className="form-divider" />
          <button
            className="btn btn-danger btn-sm"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => { if (confirm(t('form.confirmDelete'))) { onDelete(); onClose(); } }}
          >
            {t('common.delete')}
          </button>
        </div>
      </Modal>

      {editing && (
        <TaskForm
          isOpen
          onClose={() => setEditing(false)}
          task={task}
          categories={categories}
          projects={projects}
          onSave={data => { onUpdate(data); setEditing(false); }}
          onDelete={() => { onDelete(); onClose(); }}
        />
      )}
    </>
  );
}
