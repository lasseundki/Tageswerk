import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useFirestoreState';
import type { Priority, TaskMode, Task } from '../types';
import { effectiveUrgency } from '../utils/dateHelpers';
import TaskCard from '../components/tasks/TaskCard';
import TaskDetail from '../components/tasks/TaskDetail';
import TaskForm from '../components/tasks/TaskForm';

interface Props {
  ctx: AppStateContext;
}

type StatusFilter = 'active' | 'completed' | 'all';
type SortKey = 'priority' | 'urgency' | 'due' | 'alpha';
type ViewMode = 'grouped' | 'list' | 'matrix';

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const URGENCY_ORDER = { today: 0, week: 1, month: 2, someday: 3 };

function sortTasks(tasks: Task[], sort: SortKey): Task[] {
  return [...tasks].sort((a, b) => {
    if (sort === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (sort === 'urgency') return URGENCY_ORDER[effectiveUrgency(a)] - URGENCY_ORDER[effectiveUrgency(b)];
    if (sort === 'due') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.title.localeCompare(b.title);
  });
}

function isImportant(task: Task) { return task.priority === 'high' || task.priority === 'medium'; }
function isUrgent(task: Task) {
  const urg = effectiveUrgency(task);
  return urg === 'today' || urg === 'week';
}

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
  const [view, setView] = useState<ViewMode>('grouped');
  const [sort, setSort] = useState<SortKey>('priority');
  const [search, setSearch] = useState('');

  const getCategory = (id: string) => state.categories.find(c => c.id === id);
  const getProject = (id?: string) => id ? state.projects.find(p => p.id === id) : undefined;

  const filtered = state.tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (categoryFilter && task.categoryId !== categoryFilter) return false;
    if (priorityFilter && task.priority !== priorityFilter) return false;
    if (modeFilter && task.mode !== modeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const cat = getCategory(task.categoryId);
      const proj = getProject(task.projectId);
      const haystack = [task.title, task.description, cat?.name, proj?.name]
        .filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sorted = sortTasks(filtered, sort);
  const selectedTask = selectedTaskId ? state.tasks.find(t => t.id === selectedTaskId) : null;

  const renderCard = (task: Task) => (
    <TaskCard
      key={task.id}
      task={task}
      category={getCategory(task.categoryId)}
      onOpen={() => setSelectedTaskId(task.id)}
      onComplete={() => task.status === 'completed' ? reopenTask(task.id) : completeTask(task.id)}
      onIncrement={() => incrementCounter(task.id)}
      onDecrement={() => decrementCounter(task.id)}
    />
  );

  // Eisenhower quadrants (only active tasks)
  const activeTasks = filtered.filter(t => t.status === 'active');
  const q1 = activeTasks.filter(t => isImportant(t) && isUrgent(t));
  const q2 = activeTasks.filter(t => isImportant(t) && !isUrgent(t));
  const q3 = activeTasks.filter(t => !isImportant(t) && isUrgent(t));
  const q4 = activeTasks.filter(t => !isImportant(t) && !isUrgent(t));

  const renderMatrixQuadrant = (
    tasks: Task[],
    cls: 'q1' | 'q2' | 'q3' | 'q4',
    titleKey: string
  ) => (
    <div className={`matrix-quadrant matrix-quadrant-${cls}`}>
      <div className="matrix-quadrant-title">{t(titleKey)}</div>
      <div className="matrix-quadrant-tasks">
        {tasks.length === 0
          ? <span className="matrix-empty">{t('matrix.empty')}</span>
          : tasks.map(task => (
              <div key={task.id} className="matrix-task-item" onClick={() => setSelectedTaskId(task.id)}>
                {task.title}
              </div>
            ))
        }
      </div>
    </div>
  );

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.tasks')}</h1>
        <button className="btn btn-outline btn-sm" onClick={() => setAddingTask(true)}>
          + {t('task.add')}
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          className="search-input"
          placeholder={t('nav.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        {(['active', 'completed', 'all'] as StatusFilter[]).map(s => (
          <button key={s} className={`filter-chip${statusFilter === s ? ' active' : ''}`}
            onClick={() => setStatusFilter(s)}>
            {t(`filter.${s}`)}
          </button>
        ))}

        <select className="input" style={{ flex: '0 0 auto' }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">{t('filter.allCategories')}</option>
          {state.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        <select className="input" style={{ flex: '0 0 auto' }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as Priority | '')}>
          <option value="">{t('filter.allPriorities')}</option>
          {(['high', 'medium', 'low'] as Priority[]).map(p => (
            <option key={p} value={p}>{t(`priority.${p}`)}</option>
          ))}
        </select>

        <select className="input" style={{ flex: '0 0 auto' }} value={modeFilter} onChange={e => setModeFilter(e.target.value as TaskMode | '')}>
          <option value="">{t('filter.allModes')}</option>
          <option value="digital">ðŸ’» {t('mode.digital')}</option>
          <option value="analog">ðŸ¤ {t('mode.analog')}</option>
        </select>
      </div>

      {/* Toolbar: view toggle + sort */}
      <div className="tasks-toolbar">
        <div className="view-toggle">
          {([
            ['grouped', t('tasks.viewGrouped')],
            ['list', t('tasks.viewList')],
            ['matrix', t('tasks.viewMatrix')],
          ] as [ViewMode, string][]).map(([v, label]) => (
            <button key={v} className={`view-toggle-btn${view === v ? ' active' : ''}`} onClick={() => setView(v)}>
              {label}
            </button>
          ))}
        </div>

        {view !== 'matrix' && (
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="priority">{t('tasks.sortPriority')}</option>
            <option value="urgency">{t('tasks.sortUrgency')}</option>
            <option value="due">{t('tasks.sortDue')}</option>
            <option value="alpha">{t('tasks.sortAlpha')}</option>
          </select>
        )}
      </div>

      {/* MATRIX VIEW */}
      {view === 'matrix' && (
        <div>
          <div className="matrix-outer">
            <div className="matrix-y-label">{t('matrix.important')} â†‘</div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="matrix-axis-label" style={{ flex: 1 }}>{t('matrix.urgent')}</span>
                <span className="matrix-axis-label" style={{ flex: 1 }}>{t('matrix.notUrgent')}</span>
              </div>
              <div className="matrix-grid-inner">
                {renderMatrixQuadrant(q1, 'q1', 'matrix.q1')}
                {renderMatrixQuadrant(q2, 'q2', 'matrix.q2')}
                {renderMatrixQuadrant(q3, 'q3', 'matrix.q3')}
                {renderMatrixQuadrant(q4, 'q4', 'matrix.q4')}
              </div>
            </div>
            <div />
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
              <span className="matrix-x-label">{t('matrix.notImportant')} â†“</span>
            </div>
          </div>
        </div>
      )}

      {/* FLAT LIST VIEW */}
      {view === 'list' && (
        sorted.length === 0
          ? <div className="empty-state">{t('tasks.empty')}</div>
          : <div className="task-list">{sorted.map(renderCard)}</div>
      )}

      {/* GROUPED VIEW */}
      {view === 'grouped' && (
        state.categories
          .map(cat => ({ category: cat, tasks: sortTasks(filtered.filter(t => t.categoryId === cat.id), sort) }))
          .filter(g => g.tasks.length > 0)
          .length === 0
          ? <div className="empty-state">{t('tasks.empty')}</div>
          : state.categories
              .map(cat => ({ category: cat, tasks: sortTasks(filtered.filter(t => t.categoryId === cat.id), sort) }))
              .filter(g => g.tasks.length > 0)
              .map(({ category, tasks }) => (
                <div key={category.id} className="category-group">
                  <div className="category-group-header">
                    <span className="category-dot" style={{ background: category.color }} />
                    <span className="category-group-name">{category.icon} {category.name}</span>
                    <span className="category-group-count">{tasks.length}</span>
                  </div>
                  <div className="task-list">{tasks.map(renderCard)}</div>
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

