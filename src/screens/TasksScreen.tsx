import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useAppState';
import type { Priority, TaskMode } from '../types';
import TaskCard from '../components/tasks/TaskCard';
import TaskDetail from '../components/tasks/TaskDetail';
import TaskForm from '../components/tasks/TaskForm';

interface Props {
  ctx: AppStateContext;
}

type StatusFilter = 'active' | 'completed' | 'all';

export default function TasksScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, addTask, updateTask, completeTask, reopenTask, deleteTask,
    incrementCounter, decrementCounter, toggleSubtask } = ctx;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [modeFilter, setModeFilter] = useState<TaskMode | ''>('');

  const getCategory = (id: string) => state.categories.find(c => c.id === id);
  const getProject = (id?: string) => id ? state.projects.find(p => p.id === id) : undefined;

  const filtered = state.tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (categoryFilter && task.categoryId !== categoryFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (modeFilter && task.mode !== modeFilter) return false;
    return true;
  });

  // Group by category
  const grouped = state.categories.map(cat => ({
    category: cat,
    tasks: filtered.filter(t => t.categoryId === cat.id),
  })).filter(g => g.tasks.length > 0);

  const selectedTask = selectedTaskId ? state.tasks.find(t => t.id === selectedTaskId) : null;

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.tasks')}</h1>
        <button className="btn btn-outline btn-sm" onClick={() => setAddingTask(true)}>
          + {t('task.add')}
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {(['active', 'completed', 'all'] as StatusFilter[]).map(s => (
          <button
            key={s}
            className={`filter-chip${statusFilter === s ? ' active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {t(`filter.${s}`)}
          </button>
        ))}

        <select className="input filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">{t('filter.allCategories')}</option>
          {state.categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        <select className="input filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as Priority | '')}>
          <option value="">{t('filter.allPriorities')}</option>
          {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map(p => (
            <option key={p} value={p}>{t(`priority.${p}`)}</option>
          ))}
        </select>

        <select className="input filter-select" value={modeFilter} onChange={e => setModeFilter(e.target.value as TaskMode | '')}>
          <option value="">{t('filter.allModes')}</option>
          <option value="digital">💻 {t('mode.digital')}</option>
          <option value="analog">🤝 {t('mode.analog')}</option>
        </select>
      </div>

      {/* Task groups */}
      {grouped.length === 0 ? (
        <div className="empty-state">{t('tasks.empty')}</div>
      ) : (
        grouped.map(({ category, tasks }) => (
          <div key={category.id} className="category-group">
            <div className="category-group-header">
              <span className="category-dot" style={{ background: category.color }} />
              <span className="category-group-name">{category.icon} {category.name}</span>
              <span className="category-group-count">{tasks.length}</span>
            </div>
            <div className="task-list">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  category={category}
                  onOpen={() => setSelectedTaskId(task.id)}
                  onComplete={() => task.status === 'completed' ? reopenTask(task.id) : completeTask(task.id)}
                  onIncrement={() => incrementCounter(task.id)}
                  onDecrement={() => decrementCounter(task.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}

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
          onSave={data => { addTask(data); }}
        />
      )}
    </div>
  );
}
