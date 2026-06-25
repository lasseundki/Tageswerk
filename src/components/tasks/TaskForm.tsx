import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Task, Category, Project, Priority, Urgency, TaskMode, TaskLocation, ProgressType } from '../../types';
import { generateId } from '../../utils/storage';
import Modal from '../ui/Modal';

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  projectId: string;
  priority: Priority;
  urgency: Urgency;
  mode: TaskMode;
  location: TaskLocation;
  dueDate: string;
  address: string;
  estimatedMinutes: string;
  isRecurring: boolean;
  recurringType: 'daily' | 'weekly' | 'monthly';
  recurringInterval: string;
  recurringDaysOfWeek: number[];
  progressType: ProgressType;
  progressTotal: string;
  progressUnit: string;
  subTasks: { id: string; title: string }[];
  showInMatrix: boolean;
}

function taskToForm(task: Task): FormData {
  return {
    title: task.title,
    description: task.description ?? '',
    categoryId: task.categoryId,
    projectId: task.projectId ?? '',
    priority: task.priority,
    urgency: task.urgency ?? 'someday',
    mode: task.mode,
    location: task.location,
    dueDate: task.dueDate ?? '',
    address: task.address ?? '',
    estimatedMinutes: task.estimatedMinutes?.toString() ?? '',
    isRecurring: task.isRecurring,
    recurringType: task.recurringPattern?.type ?? 'daily',
    recurringInterval: task.recurringPattern?.interval.toString() ?? '1',
    recurringDaysOfWeek: task.recurringPattern?.daysOfWeek ?? [],
    progressType: task.progress.type,
    progressTotal: task.progress.total?.toString() ?? '',
    progressUnit: task.progress.unit ?? '',
    subTasks: task.subTasks?.map(st => ({ id: st.id, title: st.title })) ?? [],
    showInMatrix: task.showInMatrix ?? false,
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;
  task?: Task;
  categories: Category[];
  projects: Project[];
}

const PRIORITY_OPTS: Priority[] = ['high', 'medium', 'low'];
const URGENCY_OPTS: Urgency[] = ['today', 'week', 'month', 'someday'];
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0];

export default function TaskForm({ isOpen, onClose, onSave, onDelete, task, categories, projects }: Props) {
  const { t } = useTranslation();

  const [form, setForm] = useState<FormData>(() =>
    task ? taskToForm(task) : {
      title: '', description: '', categoryId: categories[0]?.id ?? '',
      projectId: '', priority: 'low', urgency: 'someday', mode: 'digital', location: 'anywhere',
      dueDate: '', address: '', estimatedMinutes: '', isRecurring: false,
      recurringType: 'daily', recurringInterval: '1', recurringDaysOfWeek: [],
      progressType: 'checkbox', progressTotal: '', progressUnit: '', subTasks: [],
      showInMatrix: false,
    }
  );

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const filteredProjects = projects.filter(p => !p.isArchived);

  const handleProjectChange = (projectId: string) => {
    set('projectId', projectId);
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) set('categoryId', project.categoryId);
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId,
      projectId: form.projectId || undefined,
      priority: form.priority,
      urgency: form.urgency,
      mode: form.mode,
      location: form.mode === 'digital' ? 'anywhere' : form.location,
      dueDate: form.dueDate || undefined,
      address: (form.mode === 'analog' && form.location === 'outside' && form.address.trim()) ? form.address.trim() : undefined,
      estimatedMinutes: form.estimatedMinutes ? parseInt(form.estimatedMinutes) : undefined,
      isRecurring: form.isRecurring,
      recurringPattern: form.isRecurring ? {
        type: form.recurringType,
        interval: parseInt(form.recurringInterval) || 1,
        daysOfWeek: form.recurringType === 'weekly' ? form.recurringDaysOfWeek : undefined,
      } : undefined,
      progress: {
        type: form.progressType,
        current: form.progressType === 'counter' ? (task?.progress.current ?? 0) : undefined,
        total: form.progressType === 'counter' && form.progressTotal ? parseInt(form.progressTotal) : undefined,
        unit: form.progressType === 'counter' && form.progressUnit ? form.progressUnit : undefined,
      },
      subTasks: form.progressType === 'subtasks'
        ? form.subTasks.map(st => ({ id: st.id, title: st.title, isCompleted: false }))
        : undefined,
      status: task?.status ?? 'active',
      showInMatrix: form.showInMatrix,
      completedAt: task?.completedAt,
      lastWorkedOn: task?.lastWorkedOn,
    });
    onClose();
  };

  const toggleDay = (d: number) =>
    set('recurringDaysOfWeek',
      form.recurringDaysOfWeek.includes(d)
        ? form.recurringDaysOfWeek.filter(x => x !== d)
        : [...form.recurringDaysOfWeek, d]
    );

  const [focusSubtaskId, setFocusSubtaskId] = useState<string | null>(null);
  const subtaskRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (focusSubtaskId && subtaskRefs.current[focusSubtaskId]) {
      subtaskRefs.current[focusSubtaskId]!.focus();
      setFocusSubtaskId(null);
    }
  }, [focusSubtaskId, form.subTasks]);

  const addSubtask = () => {
    const id = generateId();
    set('subTasks', [...form.subTasks, { id, title: '' }]);
    setFocusSubtaskId(id);
  };

  const updateSubtask = (id: string, title: string) =>
    set('subTasks', form.subTasks.map(st => st.id === id ? { ...st, title } : st));

  const removeSubtask = (id: string) =>
    set('subTasks', form.subTasks.filter(st => st.id !== id));

  const footer = (
    <>
      {onDelete && (
        <button className="btn btn-danger btn-md" style={{ marginRight: 'auto' }}
          onClick={() => { if (confirm(t('form.confirmDelete'))) { onDelete(); onClose(); } }}>
          {t('common.delete')}
        </button>
      )}
      <button className="btn btn-ghost btn-md" onClick={onClose}>{t('common.cancel')}</button>
      <button className="btn btn-primary btn-md" onClick={handleSave} disabled={!form.title.trim()}>
        {t('common.save')}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task ? t('form.editTask') : t('form.newTask')} footer={footer}>
      <div className="form-section">
        {/* Title */}
        <div>
          <label className="input-label">{t('form.title')}</label>
          <input className="input" placeholder={t('form.titlePlaceholder')}
            value={form.title} onChange={e => set('title', e.target.value)}
            autoFocus />
        </div>

        {/* Description */}
        <div>
          <label className="input-label">{t('form.description')}</label>
          <textarea className="input day-note-area" style={{ minHeight: 72 }}
            placeholder={t('form.descPlaceholder')}
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <hr className="form-divider" />

        {/* Project (primary) */}
        <div>
          <label className="input-label">{t('form.project')}</label>
          <select className="input" value={form.projectId} onChange={e => handleProjectChange(e.target.value)}>
            <option value="">{t('common.noProject')}</option>
            {filteredProjects.map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              return <option key={p.id} value={p.id}>{cat ? `${cat.icon} ` : ''}{p.name}</option>;
            })}
          </select>
        </div>

        {/* Category (auto-filled from project, can override) */}
        <div>
          <label className="input-label">{t('form.category')}</label>
          <select className="input" value={form.categoryId}
            onChange={e => set('categoryId', e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>

        {/* Priority (Wichtigkeit) */}
        <div>
          <label className="input-label">{t('form.priority')}</label>
          <div className="priority-buttons">
            {PRIORITY_OPTS.map(p => (
              <button key={p}
                className={`priority-btn${form.priority === p ? ` active-${p}` : ''}`}
                onClick={() => set('priority', p)}>
                {t(`priority.${p}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency (Dringlichkeit) — hidden when dueDate set */}
        <div>
          <label className="input-label">{t('form.urgency')}</label>
          {form.dueDate ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
              {t('form.urgencyAuto')}
            </p>
          ) : (
            <div className="mode-toggle">
              {URGENCY_OPTS.map(u => (
                <button key={u} className={`mode-toggle-btn${form.urgency === u ? ' active' : ''}`}
                  onClick={() => set('urgency', u)}>
                  {t(`urgency.${u}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <hr className="form-divider" />

        {/* Mode */}
        <div>
          <label className="input-label">{t('form.mode')}</label>
          <div className="mode-toggle">
            <button className={`mode-toggle-btn${form.mode === 'digital' ? ' active' : ''}`}
              onClick={() => set('mode', 'digital')}>
              💻 {t('mode.digital')}
            </button>
            <button className={`mode-toggle-btn${form.mode === 'analog' ? ' active' : ''}`}
              onClick={() => set('mode', 'analog')}>
              🤝 {t('mode.analog')}
            </button>
          </div>
        </div>

        {/* Location (analog only) */}
        {form.mode === 'analog' && (
          <>
            <div>
              <label className="input-label">{t('form.location')}</label>
              <div className="mode-toggle">
                {(['anywhere', 'home', 'outside'] as TaskLocation[]).map(loc => (
                  <button key={loc} className={`mode-toggle-btn${form.location === loc ? ' active' : ''}`}
                    onClick={() => set('location', loc)}>
                    {loc === 'anywhere' ? '🌐' : loc === 'home' ? '🏠' : '🗺️'} {t(`location.${loc}`)}
                  </button>
                ))}
              </div>
            </div>
            {form.location === 'outside' && (
              <div>
                <label className="input-label">🗺️ {t('form.address')}</label>
                <input className="input" placeholder={t('form.addressPlaceholder')}
                  value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            )}
          </>
        )}

        <hr className="form-divider" />

        {/* Due date + Effort */}
        <div className="input-row">
          <div>
            <label className="input-label">{t('form.dueDate')}</label>
            <input type="date" className="input" value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)} />
          </div>
          <div>
            <label className="input-label">{t('form.estimatedMinutes')}</label>
            <input type="number" className="input" placeholder="30" min="1"
              value={form.estimatedMinutes} onChange={e => set('estimatedMinutes', e.target.value)} />
          </div>
        </div>

        {/* Recurring */}
        <div>
          <div className="toggle-row">
            <span className="toggle-label">{t('form.recurring')}</span>
            <button className={`toggle${form.isRecurring ? ' on' : ''}`}
              onClick={() => set('isRecurring', !form.isRecurring)} />
          </div>
          {form.isRecurring && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <div className="mode-toggle">
                {(['daily', 'weekly', 'monthly'] as const).map(rt => (
                  <button key={rt} className={`mode-toggle-btn${form.recurringType === rt ? ' active' : ''}`}
                    onClick={() => set('recurringType', rt)}>
                    {t(`recurring.${rt}`)}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{t('form.interval')}</span>
                <input type="number" className="input" min="1" max="99"
                  style={{ width: 70 }} value={form.recurringInterval}
                  onChange={e => set('recurringInterval', e.target.value)} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{t('recurring.days')}</span>
              </div>
              {form.recurringType === 'weekly' && (
                <div className="day-chips">
                  {DAY_INDICES.map(d => (
                    <button key={d} className={`day-chip${form.recurringDaysOfWeek.includes(d) ? ' active' : ''}`}
                      onClick={() => toggleDay(d)}>
                      {t(`days.${d}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Show in Matrix */}
        <div className="toggle-row">
          <span className="toggle-label">{t('form.showInMatrix')}</span>
          <button className={`toggle${form.showInMatrix ? ' on' : ''}`}
            onClick={() => set('showInMatrix', !form.showInMatrix)} />
        </div>

        <hr className="form-divider" />

        {/* Progress type */}
        <div>
          <label className="input-label">{t('form.progressType')}</label>
          <div className="mode-toggle">
            {(['checkbox', 'counter', 'subtasks'] as ProgressType[]).map(pt => (
              <button key={pt} className={`mode-toggle-btn${form.progressType === pt ? ' active' : ''}`}
                onClick={() => set('progressType', pt)}>
                {t(`progressType.${pt}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Counter fields */}
        {form.progressType === 'counter' && (
          <div className="input-row">
            <div>
              <label className="input-label">{t('form.total')}</label>
              <input type="number" className="input" placeholder="10" min="1"
                value={form.progressTotal} onChange={e => set('progressTotal', e.target.value)} />
            </div>
            <div>
              <label className="input-label">{t('form.unit')}</label>
              <input className="input" placeholder={t('form.unitPlaceholder')}
                value={form.progressUnit} onChange={e => set('progressUnit', e.target.value)} />
            </div>
          </div>
        )}

        {/* Subtasks */}
        {form.progressType === 'subtasks' && (
          <div>
            <label className="input-label">{t('progressType.subtasks')}</label>
            <div className="subtask-list">
              {form.subTasks.map(st => (
                <div key={st.id} className="subtask-row">
                  <input className="input" placeholder={t('form.subtaskPlaceholder')}
                    ref={el => { subtaskRefs.current[st.id] = el; }}
                    value={st.title} onChange={e => updateSubtask(st.id, e.target.value)} />
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeSubtask(st.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addSubtask}>
                {t('form.addSubtask')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
