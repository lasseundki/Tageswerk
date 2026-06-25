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
    <div className="focus-block">
      <div className="focus-block-label">{t('focus.suggestion')}</div>
      <div className="focus-block-grid" style={{ gridTemplateColumns: `repeat(${suggestions.length}, 1fr)` }}>
        {suggestions.map(({ task, reasons }, i) => {
          const reasonText = formatReasons(reasons, t);
          return (
            <div
              key={task.id}
              className={`focus-block-item${i < suggestions.length - 1 ? ' focus-block-item--border' : ''}`}
              onClick={() => onOpen(task.id)}
            >
              <div className="focus-block-item-title">{task.title}</div>
              {reasonText && <div className="focus-block-item-reason">{reasonText}</div>}
              {task.estimatedMinutes && (
                <div className="focus-block-item-effort">⏱ {task.estimatedMinutes} min</div>
              )}
              <div className="focus-block-item-actions" onClick={e => e.stopPropagation()}>
                <button className="focus-block-skip" onClick={() => onSkip(task.id)}>
                  {t('focus.skip')}
                </button>
                <button className="focus-block-start" onClick={() => onStart(task.id)}>
                  {t('focus.start')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
