import { useTranslation } from 'react-i18next';
import type { ScoredTask } from '../../utils/scoring';
import { formatReasons } from '../../utils/scoring';

interface Props {
  suggestion: ScoredTask | null;
  onSkip: () => void;
  onOpen: (taskId: string) => void;
  onStart: (taskId: string) => void;
}

export default function FocusSuggestion({ suggestion, onSkip, onOpen, onStart }: Props) {
  const { t } = useTranslation();

  if (!suggestion) {
    return (
      <div className="focus-card-empty">
        <p>{t('focus.allDone')}</p>
      </div>
    );
  }

  const { task, reasons } = suggestion;
  const reasonText = formatReasons(reasons, t);

  return (
    <div className="focus-card" onClick={() => onOpen(task.id)}>
      <div className="focus-card-header">
        <div>
          <div className="focus-card-label">{t('focus.suggestion')}</div>
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
        <button className="btn btn-ghost btn-sm" onClick={onSkip}>
          {t('focus.skip')}
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => onStart(task.id)}>
          {t('focus.start')}
        </button>
      </div>
    </div>
  );
}
