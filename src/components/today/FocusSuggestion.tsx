import { useTranslation } from 'react-i18next';
import type { ScoredTask } from '../../utils/scoring';
import { formatReasons } from '../../utils/scoring';

interface Props {
  suggestions: ScoredTask[];
  onSkip: (taskId: string) => void;
  onOpen: (taskId: string) => void;
  onStart: (taskId: string) => void;
}

export default function FocusSuggestion({ suggestions, onSkip, onOpen, onStart }: Props) {
  const { t } = useTranslation();

  if (suggestions.length === 0) {
    return (
      <div className="focus-card-empty">
        <p>{t('focus.allDone')}</p>
      </div>
    );
  }

  return (
    <div className="focus-suggestions">
      {suggestions.map(({ task, reasons }, i) => {
        const reasonText = formatReasons(reasons, t);
        return (
          <div key={task.id} className={`focus-card${i > 0 ? ' focus-card--secondary' : ''}`} onClick={() => onOpen(task.id)}>
            <div className="focus-card-header">
              <div>
                {i === 0 && <div className="focus-card-label">{t('focus.suggestion')}</div>}
                <div className="focus-card-title">{task.title}</div>
              </div>
              <div className="focus-card-badges">
                <span className={`badge badge-${task.priority}`}>{t(`priority.${task.priority}`)}</span>
                <span className={`badge badge-${task.mode}`}>
                  {task.mode === 'digital' ? '💻' : '🤝'}
                </span>
              </div>
            </div>

            {reasonText && (
              <div className="focus-card-reasons">{reasonText}</div>
            )}

            {task.estimatedMinutes && (
              <div className="focus-card-effort">⏱ {task.estimatedMinutes} min</div>
            )}

            <div className="focus-card-actions" onClick={e => e.stopPropagation()}>
              <button className="btn btn-ghost btn-sm" onClick={() => onSkip(task.id)}>
                {t('focus.skip')}
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => onStart(task.id)}>
                {t('focus.start')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
