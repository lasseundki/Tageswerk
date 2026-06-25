import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Project, Category } from '../../types';
import Modal from '../ui/Modal';
import TaskCard from '../tasks/TaskCard';
import TaskDetail from '../tasks/TaskDetail';
import TaskForm from '../tasks/TaskForm';
import type { AppStateContext } from '../../hooks/useFirestoreState';

interface Props {
  project: Project;
  ctx: AppStateContext;
  onClose: () => void;
  onEdit: () => void;
}

export default function ProjectDetail({ project, ctx, onClose, onEdit }: Props) {
  const { t } = useTranslation();
  const { state, updateProject, completeTask, reopenTask, deleteTask, toggleInProgress,
    incrementCounter, decrementCounter, toggleSubtask, addTask, updateTask } = ctx;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [note, setNote] = useState(project.description ?? '');

  const projectTasks = state.tasks
    .filter(t => t.projectId === project.id)
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return 0;
    });

  const activeTasks = projectTasks.filter(t => t.status === 'active');
  const completedTasks = projectTasks.filter(t => t.status === 'completed');

  const getCategory = (id: string): Category | undefined => state.categories.find(c => c.id === id);
  const selectedTask = selectedTaskId ? state.tasks.find(t => t.id === selectedTaskId) : null;
  const cat = getCategory(project.categoryId);

  const saveNote = () => {
    const trimmed = note.trim();
    if (trimmed !== (project.description ?? '')) {
      updateProject(project.id, { description: trimmed || undefined });
    }
  };

  const footer = (
    <>
      <button className="btn btn-ghost btn-md" onClick={onClose}>{t('common.close')}</button>
      <button className="btn btn-outline btn-md" onClick={onEdit}>{t('common.edit')}</button>
    </>
  );

  return (
    <>
      <Modal isOpen title={project.name} onClose={onClose} footer={footer}>
        <div className="form-section">
          {/* Category */}
          {cat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="category-dot" style={{ background: cat.color }} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                {cat.icon} {cat.name}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="input-label">{t('project.notes')}</label>
            <textarea
              className="input day-note-area"
              style={{ minHeight: 72 }}
              placeholder={t('project.notesPlaceholder')}
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={saveNote}
            />
          </div>

          <hr className="form-divider" />

          {/* Active tasks */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-label" style={{ margin: 0 }}>
              {t('project.activeTasks')} ({activeTasks.length})
            </span>
            <button className="btn btn-outline btn-sm" onClick={() => setAddingTask(true)}>
              + {t('task.add')}
            </button>
          </div>

          {activeTasks.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
              {t('tasks.empty')}
            </p>
          ) : (
            <div className="task-list">
              {activeTasks.map(task => (
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
          )}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <>
              <div className="section-label" style={{ margin: 0, marginTop: 'var(--space-2)' }}>
                {t('project.completedTasks')} ({completedTasks.length})
              </div>
              <div className="task-list">
                {completedTasks.map(task => (
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
            </>
          )}
        </div>
      </Modal>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          category={getCategory(selectedTask.categoryId)}
          project={project}
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

      {addingTask && (
        <TaskForm
          isOpen
          onClose={() => setAddingTask(false)}
          categories={state.categories}
          projects={state.projects}
          onSave={data => { addTask({ ...data, projectId: project.id, categoryId: project.categoryId }); }}
        />
      )}
    </>
  );
}
