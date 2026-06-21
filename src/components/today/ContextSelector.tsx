import { useTranslation } from 'react-i18next';
import type { ActiveContext, TaskMode, TaskLocation } from '../../types';

interface Props {
  context: ActiveContext;
  onChange: (ctx: ActiveContext) => void;
}

const MODES: TaskMode[] = ['digital', 'analog'];
const LOCATIONS: TaskLocation[] = ['anywhere', 'home', 'outside'];

export default function ContextSelector({ context, onChange }: Props) {
  const { t } = useTranslation();

  const setMode = (mode: TaskMode) =>
    onChange({ ...context, selectedMode: context.selectedMode === mode ? undefined : mode });

  const setLocation = (location: TaskLocation) =>
    onChange({ ...context, selectedLocation: context.selectedLocation === location ? undefined : location });

  return (
    <div className="context-selector">
      <span className="context-label">{t('context.mode')}</span>
      <div className="context-chips">
        {MODES.map(m => (
          <button
            key={m}
            className={`context-chip${context.selectedMode === m ? ' active' : ''}`}
            onClick={() => setMode(m)}
          >
            {m === 'digital' ? '💻' : '🤝'} {t(`mode.${m}`)}
          </button>
        ))}
      </div>

      <span className="context-label">{t('context.location')}</span>
      <div className="context-chips">
        {LOCATIONS.map(loc => (
          <button
            key={loc}
            className={`context-chip${context.selectedLocation === loc ? ' active' : ''}`}
            onClick={() => setLocation(loc)}
          >
            {loc === 'anywhere' ? '🌐' : loc === 'home' ? '🏠' : '🗺️'} {t(`location.${loc}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
