import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useAppState';
import { today, yesterday, formatDate } from '../utils/dateHelpers';

interface Props {
  ctx: AppStateContext;
}

export default function ReviewScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, updateDayNote } = ctx;

  const todayStr = today();
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Build sorted unique dates from logs + today
  const dates = Array.from(new Set([todayStr, ...state.dayLogs.map(l => l.date)]))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 30);

  const selectedLog = state.dayLogs.find(l => l.date === selectedDate);

  const completedTasks = (selectedLog?.completedTaskIds ?? [])
    .map(id => state.tasks.find(t => t.id === id))
    .filter(Boolean);

  const progressEntries = selectedLog?.progressEntries ?? [];

  const prevDate = () => {
    const idx = dates.indexOf(selectedDate);
    if (idx < dates.length - 1) setSelectedDate(dates[idx + 1]);
  };

  const nextDate = () => {
    const idx = dates.indexOf(selectedDate);
    if (idx > 0) setSelectedDate(dates[idx - 1]);
  };

  const isToday = selectedDate === todayStr;
  const isYesterday = selectedDate === yesterday();

  const dateLabel = isToday
    ? t('review.today')
    : isYesterday
    ? t('review.yesterday')
    : formatDate(selectedDate);

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.review')}</h1>
      </div>

      {/* Date navigation */}
      <div className="date-nav">
        <button className="btn btn-ghost btn-icon btn-sm" onClick={prevDate} disabled={dates.indexOf(selectedDate) >= dates.length - 1}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <span className="date-nav-label">{dateLabel}</span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={nextDate} disabled={selectedDate === todayStr}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* Completed tasks */}
      <section>
        <h2 className="section-title">
          {t('review.completedTasks')} ({completedTasks.length})
        </h2>
        {completedTasks.length === 0 ? (
          <div className="empty-state">{t('review.noCompleted')}</div>
        ) : (
          <div className="review-log-list">
            {completedTasks.map(task => {
              if (!task) return null;
              const cat = state.categories.find(c => c.id === task.categoryId);
              return (
                <div key={task.id} className="review-log-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <div className="review-log-item-body">
                    <span className="review-log-title">{task.title}</span>
                    {cat && (
                      <span className="review-log-category">
                        <span className="category-dot" style={{ background: cat.color }} />
                        {cat.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Progress entries */}
      {progressEntries.length > 0 && (
        <section>
          <h2 className="section-title">{t('review.progressEntries')}</h2>
          <div className="review-log-list">
            {progressEntries.map((entry, i) => (
              <div key={i} className="review-log-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <div className="review-log-item-body">
                  <span className="review-log-title">{entry.taskTitle}</span>
                  <span className="review-log-progress">
                    {entry.fromValue} → {entry.toValue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Day note */}
      <section>
        <h2 className="section-title">{t('review.dayNote')}</h2>
        <textarea
          className="input day-note-area"
          placeholder={t('review.dayNotePlaceholder')}
          value={selectedLog?.note ?? ''}
          onChange={e => updateDayNote(selectedDate, e.target.value)}
        />
      </section>
    </div>
  );
}
