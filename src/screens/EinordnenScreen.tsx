import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useFirestoreState';
import type { Task } from '../types';

interface Props {
  ctx: AppStateContext;
}

const HIDDEN_KEY = 'tw_einordnen_hidden';

function loadHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    return new Set(raw ? JSON.parse(raw) as string[] : []);
  } catch {
    return new Set();
  }
}

function saveHidden(ids: Set<string>) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]));
}

type MotivationSource = 'obligation' | 'self' | 'other';

const SOURCES: MotivationSource[] = ['obligation', 'self', 'other'];

const SOURCE_COLORS: Record<MotivationSource, string> = {
  obligation: '#B87B72',
  self: '#7BA89B',
  other: '#7A9EC4',
};

export default function EinordnenScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, updateTask } = ctx;

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(loadHidden);
  const [showHidden, setShowHidden] = useState(false);

  const toggleHide = (id: string) => {
    const next = new Set(hiddenIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setHiddenIds(next);
    saveHidden(next);
  };

  const setSource = (id: string, src: MotivationSource | null) => {
    updateTask(id, { motivationSource: src });
  };

  const activeTasks = state.tasks.filter(t => t.status === 'active');
  const visibleTasks = showHidden ? activeTasks : activeTasks.filter(t => !hiddenIds.has(t.id));
  const hiddenCount = activeTasks.filter(t => hiddenIds.has(t.id)).length;

  const unsorted = visibleTasks.filter(t => !t.motivationSource);
  const bySource = (src: MotivationSource) => visibleTasks.filter(t => t.motivationSource === src);

  const renderTask = (task: Task) => {
    const cat = state.categories.find(c => c.id === task.categoryId);
    const isHidden = hiddenIds.has(task.id);

    return (
      <div key={task.id} className={`einordnen-task${isHidden ? ' einordnen-task--hidden' : ''}`}>
        <div className="einordnen-task-info">
          {cat && (
            <span className="einordnen-cat-dot" style={{ background: cat.color }} />
          )}
          <span className="einordnen-task-title">{task.title}</span>
        </div>
        <div className="einordnen-task-actions">
          {SOURCES.map(src => (
            <button
              key={src}
              className={`einordnen-src-btn${task.motivationSource === src ? ' active' : ''}`}
              style={task.motivationSource === src ? { background: SOURCE_COLORS[src], borderColor: SOURCE_COLORS[src] } : {}}
              onClick={() => setSource(task.id, task.motivationSource === src ? null : src)}
            >
              {t(`einordnen.src.${src}`)}
            </button>
          ))}
          <button
            className="einordnen-hide-btn"
            onClick={() => toggleHide(task.id)}
            title={isHidden ? t('einordnen.show') : t('einordnen.hide')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isHidden
                ? (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>)
                : (<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></>)
              }
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, tasks: Task[], accentColor?: string) => {
    if (tasks.length === 0) return null;
    return (
      <section className="einordnen-section">
        <div className="einordnen-section-header" style={accentColor ? { borderLeftColor: accentColor } : {}}>
          <span className="einordnen-section-title">{title}</span>
          <span className="einordnen-section-count">{tasks.length}</span>
        </div>
        {tasks.map(renderTask)}
      </section>
    );
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('einordnen.title')}</h1>
      </div>

      <p className="einordnen-intro">
        {t('einordnen.src.obligation')}, {t('einordnen.src.self')}, {t('einordnen.src.other')} —
        {' '}{state.tasks.filter(t => t.status === 'active').length > 0
          ? `${activeTasks.length} ${t('nav.tasks').toLowerCase()}`
          : ''}
      </p>

      {renderSection(t('einordnen.src.obligation'), bySource('obligation'), SOURCE_COLORS.obligation)}
      {renderSection(t('einordnen.src.self'), bySource('self'), SOURCE_COLORS.self)}
      {renderSection(t('einordnen.src.other'), bySource('other'), SOURCE_COLORS.other)}
      {renderSection(t('einordnen.unsorted'), unsorted)}

      {hiddenCount > 0 && (
        <button
          className="einordnen-toggle-hidden"
          onClick={() => setShowHidden(v => !v)}
        >
          {showHidden ? t('einordnen.hideHidden') : t('einordnen.showHidden')}
          {' '}
          <span className="einordnen-hidden-badge">{hiddenCount}</span>
        </button>
      )}

      {visibleTasks.length === 0 && !showHidden && (
        <div className="empty-state">{t('tasks.empty')}</div>
      )}
    </div>
  );
}
