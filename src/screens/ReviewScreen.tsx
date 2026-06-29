import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useFirestoreState';
import type { DayLog } from '../types';
import { today, yesterday, formatDate, formatTime } from '../utils/dateHelpers';

interface Props { ctx: AppStateContext; }

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateDates(count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return localDateStr(d);
  });
}

function dayLabel(date: string, t: (k: string) => string): string {
  if (date === today()) return t('review.today');
  if (date === yesterday()) return t('review.yesterday');
  return formatDate(date);
}

function dayOfWeek(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short' });
}

function previewText(log: DayLog | undefined, tasks: { id: string; title: string }[], t: (k: string) => string): string | null {
  if (log?.note?.trim()) return log.note.trim().slice(0, 80);
  if (log?.journalEntries?.[0]?.text) return log.journalEntries[0].text.slice(0, 80);
  if (log?.completedTaskIds?.length) {
    const names = log.completedTaskIds
      .slice(0, 2)
      .map(id => tasks.find(t => t.id === id)?.title)
      .filter(Boolean)
      .join(', ');
    return names
      ? `${t('review.completedTasks')}: ${names}${log.completedTaskIds.length > 2 ? ` +${log.completedTaskIds.length - 2}` : ''}`
      : null;
  }
  return null;
}

interface DayDetailProps {
  date: string;
  log: DayLog | undefined;
  ctx: AppStateContext;
  onBack: () => void;
}

function DayDetail({ date, log, ctx, onBack }: DayDetailProps) {
  const { t } = useTranslation();
  const { state, updateDayNote, updateDayTitle, addJournalEntry, updateJournalEntry, deleteJournalEntry } = ctx;
  const [newEntryText, setNewEntryText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [titleDraft, setTitleDraft] = useState(log?.title ?? '');

  const completedTasks = (log?.completedTaskIds ?? [])
    .map(id => state.tasks.find(t => t.id === id))
    .filter(Boolean);

  const progressEntries = log?.progressEntries ?? [];
  const journalEntries = log?.journalEntries ?? [];

  const handleAddEntry = () => {
    const text = newEntryText.trim();
    if (!text) return;
    addJournalEntry(date, text);
    setNewEntryText('');
  };

  const saveEdit = () => {
    if (editingId && editingText.trim()) {
      updateJournalEntry(date, editingId, editingText.trim());
    }
    setEditingId(null);
    setEditingText('');
  };

  const saveTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed !== (log?.title ?? '')) updateDayTitle(date, trimmed);
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn btn-ghost btn-sm review-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          {t('nav.review')}
        </button>
      </div>

      {/* Date + editable title */}
      <div className="review-detail-header">
        <div className="review-detail-meta">
          <span className="review-detail-dow">{dayOfWeek(date)}</span>
          <span className="review-detail-date">{dayLabel(date, t)}</span>
        </div>
        <input
          className="review-title-input"
          placeholder={t('review.dayTitlePlaceholder')}
          value={titleDraft}
          onChange={e => setTitleDraft(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
        />
      </div>

      {/* Journal */}
      <section className="journal-section">
        <h2 className="section-title">{t('review.journal')}</h2>
        {journalEntries.length === 0 && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            {t('review.noEntries')}
          </p>
        )}
        <div className="journal-entries">
          {journalEntries.map(entry => (
            <div key={entry.id} className="journal-entry">
              <div className="journal-entry-header">
                <span className="journal-entry-time">{formatTime(entry.createdAt)}{entry.updatedAt ? ' *' : ''}</span>
                <div className="journal-entry-actions">
                  {editingId !== entry.id && (
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingId(entry.id); setEditingText(entry.text); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteJournalEntry(date, entry.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              {editingId === entry.id ? (
                <>
                  <textarea className="journal-entry-textarea" value={editingText}
                    onChange={e => setEditingText(e.target.value)} autoFocus />
                  <div className="journal-add-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>{t('common.cancel')}</button>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}>{t('common.save')}</button>
                  </div>
                </>
              ) : (
                <p className="journal-entry-text">{entry.text}</p>
              )}
            </div>
          ))}
        </div>
        <div className="journal-add-area">
          <textarea className="journal-add-textarea" placeholder={t('review.journalPlaceholder')}
            value={newEntryText} onChange={e => setNewEntryText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddEntry(); }} />
          <div className="journal-add-actions">
            <button className="btn btn-primary btn-sm" onClick={handleAddEntry} disabled={!newEntryText.trim()}>
              {t('review.addEntry')}
            </button>
          </div>
        </div>
      </section>

      {/* Completed tasks */}
      <section>
        <h2 className="section-title">{t('review.completedTasks')} ({completedTasks.length})</h2>
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
                {entry.subtaskTitle ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                )}
                <div className="review-log-item-body">
                  {entry.subtaskTitle ? (
                    <>
                      <span className="review-log-title">{entry.subtaskTitle}</span>
                      <span className="review-log-sub">{entry.taskTitle}</span>
                    </>
                  ) : (
                    <>
                      <span className="review-log-title">{entry.taskTitle}</span>
                      <span className="review-log-progress">{entry.fromValue} → {entry.toValue}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Day note */}
      <section>
        <h2 className="section-title">{t('review.dayNote')}</h2>
        <textarea className="input day-note-area" placeholder={t('review.dayNotePlaceholder')}
          value={log?.note ?? ''} onChange={e => updateDayNote(date, e.target.value)} />
      </section>
    </div>
  );
}

export default function ReviewScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state } = ctx;
  const [openDate, setOpenDate] = useState<string | null>(null);

  const dates = generateDates(90);
  const taskList = state.tasks.map(t => ({ id: t.id, title: t.title }));

  if (openDate !== null) {
    const log = state.dayLogs.find(l => l.date === openDate);
    return <DayDetail date={openDate} log={log} ctx={ctx} onBack={() => setOpenDate(null)} />;
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.review')}</h1>
      </div>

      <div className="review-day-list">
        {dates.map(date => {
          const log = state.dayLogs.find(l => l.date === date);
          const taskCount = log?.completedTaskIds.length ?? 0;
          const hasNote = !!log?.note?.trim();
          const journalCount = log?.journalEntries.length ?? 0;
          const isEmpty = taskCount === 0 && !hasNote && journalCount === 0;
          const isToday = date === today();
          const isYday = date === yesterday();
          const preview = previewText(log, taskList, t);

          return (
            <button
              key={date}
              className={`review-day-card${isToday ? ' review-day-card--today' : ''}${isEmpty && !isToday ? ' review-day-card--empty' : ''}`}
              onClick={() => setOpenDate(date)}
            >
              <div className="review-day-card-left">
                <span className="review-day-dow">{dayOfWeek(date)}</span>
                <span className="review-day-date-label">
                  {isToday ? t('review.today') : isYday ? t('review.yesterday') : formatDate(date)}
                </span>
              </div>
              <div className="review-day-card-body">
                {log?.title && (
                  <span className="review-day-title">{log.title}</span>
                )}
                {preview && !log?.title && (
                  <span className="review-day-preview">{preview}</span>
                )}
                {log?.title && preview && (
                  <span className="review-day-preview">{preview}</span>
                )}
                <div className="review-day-card-chips">
                  {taskCount > 0 && (
                    <span className="review-day-chip review-day-chip--tasks">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      {taskCount}
                    </span>
                  )}
                  {hasNote && (
                    <span className="review-day-chip review-day-chip--note">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </span>
                  )}
                  {journalCount > 0 && (
                    <span className="review-day-chip review-day-chip--journal">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h16M4 12h16M4 18h7"/>
                      </svg>
                      {journalCount}
                    </span>
                  )}
                  {isEmpty && !isToday && (
                    <span className="review-day-chip review-day-chip--empty">—</span>
                  )}
                </div>
              </div>
              <svg className="review-day-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
