import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppStateContext } from '../hooks/useAppState';
import { today, yesterday, formatDate, formatTime } from '../utils/dateHelpers';

interface Props {
  ctx: AppStateContext;
}

export default function ReviewScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, updateDayNote, addJournalEntry, updateJournalEntry, deleteJournalEntry } = ctx;

  const todayStr = today();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [newEntryText, setNewEntryText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const dates = Array.from(new Set([todayStr, ...state.dayLogs.map(l => l.date)]))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 30);

  const selectedLog = state.dayLogs.find(l => l.date === selectedDate);

  const completedTasks = (selectedLog?.completedTaskIds ?? [])
    .map(id => state.tasks.find(t => t.id === id))
    .filter(Boolean);

  const progressEntries = selectedLog?.progressEntries ?? [];
  const journalEntries = selectedLog?.journalEntries ?? [];

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
  const dateLabel = isToday ? t('review.today') : isYesterday ? t('review.yesterday') : formatDate(selectedDate);

  const handleAddEntry = () => {
    const text = newEntryText.trim();
    if (!text) return;
    addJournalEntry(selectedDate, text);
    setNewEntryText('');
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const saveEdit = () => {
    if (editingId && editingText.trim()) {
      updateJournalEntry(selectedDate, editingId, editingText.trim());
    }
    setEditingId(null);
    setEditingText('');
  };

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
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => startEdit(entry.id, entry.text)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => deleteJournalEntry(selectedDate, entry.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </div>
              {editingId === entry.id ? (
                <>
                  <textarea
                    className="journal-entry-textarea"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    autoFocus
                  />
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

        {/* Add new entry */}
        <div className="journal-add-area">
          <textarea
            className="journal-add-textarea"
            placeholder={t('review.journalPlaceholder')}
            value={newEntryText}
            onChange={e => setNewEntryText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddEntry(); }}
          />
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <div className="review-log-item-body">
                  <span className="review-log-title">{entry.taskTitle}</span>
                  <span className="review-log-progress">{entry.fromValue} → {entry.toValue}</span>
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
