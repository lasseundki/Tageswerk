import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Habit, HabitFrequency, HabitTimeOfDay, HabitType } from '../../types';
import Modal from '../ui/Modal';

const COLORS = ['#7BA89B','#3B82F6','#EC4899','#F59E0B','#8B5CF6','#10B981','#EF4444','#06B6D4','#6B7280'];
const ICONS  = ['✅','💧','🏃','🧘','📚','💊','🛌','🥗','🏋️','🧹','🐕','🎯','🧠','✍️','🎵'];
const DAY_INDICES = [1,2,3,4,5,6,0];

interface FormData {
  name: string; icon: string; color: string;
  timeOfDay: HabitTimeOfDay; frequency: HabitFrequency;
  daysOfWeek: number[]; type: HabitType;
  targetCount: string; unit: string;
}

function habitToForm(h: Habit): FormData {
  return {
    name: h.name, icon: h.icon, color: h.color,
    timeOfDay: h.timeOfDay, frequency: h.frequency,
    daysOfWeek: h.daysOfWeek ?? [],
    type: h.type,
    targetCount: h.targetCount?.toString() ?? '',
    unit: h.unit ?? '',
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  onDelete?: () => void;
  habit?: Habit;
  habitCount: number;
}

export default function HabitForm({ isOpen, onClose, onSave, onDelete, habit, habitCount }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormData>(() =>
    habit ? habitToForm(habit) : {
      name: '', icon: '✅', color: '#7BA89B',
      timeOfDay: 'anytime', frequency: 'daily',
      daysOfWeek: [], type: 'boolean',
      targetCount: '', unit: '',
    }
  );

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const toggleDay = (d: number) =>
    set('daysOfWeek', form.daysOfWeek.includes(d)
      ? form.daysOfWeek.filter(x => x !== d)
      : [...form.daysOfWeek, d]
    );

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(), icon: form.icon, color: form.color,
      timeOfDay: form.timeOfDay, frequency: form.frequency,
      daysOfWeek: form.frequency === 'custom' ? form.daysOfWeek : undefined,
      type: form.type,
      targetCount: form.type === 'count' && form.targetCount ? parseInt(form.targetCount) : undefined,
      unit: form.type === 'count' && form.unit ? form.unit : undefined,
      order: habit?.order ?? habitCount,
      isArchived: habit?.isArchived ?? false,
    });
    onClose();
  };

  const footer = (
    <>
      {onDelete && (
        <button className="btn btn-danger btn-md" style={{ marginRight: 'auto' }}
          onClick={() => { if (confirm(t('form.confirmDelete'))) { onDelete(); onClose(); } }}>
          {t('common.delete')}
        </button>
      )}
      <button className="btn btn-ghost btn-md" onClick={onClose}>{t('common.cancel')}</button>
      <button className="btn btn-primary btn-md" onClick={handleSave} disabled={!form.name.trim()}>
        {t('common.save')}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={habit ? t('habits.edit') : t('habits.add')} footer={footer}>
      <div className="form-section">
        {/* Icon picker */}
        <div>
          <label className="input-label">{t('habits.icon')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
            {ICONS.map(ic => (
              <button key={ic}
                style={{
                  fontSize: 22, width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  border: `2px solid ${form.icon === ic ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: form.icon === ic ? 'var(--color-accent-light)' : 'white',
                  cursor: 'pointer',
                }}
                onClick={() => set('icon', ic)}>{ic}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="input-label">{t('habits.color')}</label>
          <div className="habit-color-row">
            {COLORS.map(c => (
              <button key={c}
                className={`habit-color-swatch${form.color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => set('color', c)} />
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="input-label">{t('form.title')}</label>
          <input className="input" placeholder="Zähne putzen…"
            value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
        </div>

        {/* Time of day */}
        <div>
          <label className="input-label">{t('habits.timeOfDay')}</label>
          <div className="mode-toggle">
            {(['morning','afternoon','evening','anytime'] as HabitTimeOfDay[]).map(tod => (
              <button key={tod} className={`mode-toggle-btn${form.timeOfDay === tod ? ' active' : ''}`}
                onClick={() => set('timeOfDay', tod)}>
                {t(`habits.${tod}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="input-label">{t('habits.frequency')}</label>
          <div className="mode-toggle">
            {(['daily','weekdays','weekends','custom'] as HabitFrequency[]).map(f => (
              <button key={f} className={`mode-toggle-btn${form.frequency === f ? ' active' : ''}`}
                onClick={() => set('frequency', f)}>
                {t(`habits.${f}`)}
              </button>
            ))}
          </div>
          {form.frequency === 'custom' && (
            <div className="day-chips" style={{ marginTop: 'var(--space-2)' }}>
              {DAY_INDICES.map(d => (
                <button key={d} className={`day-chip${form.daysOfWeek.includes(d) ? ' active' : ''}`}
                  onClick={() => toggleDay(d)}>
                  {t(`days.${d}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <hr className="form-divider" />

        {/* Type */}
        <div>
          <label className="input-label">{t('habits.type')}</label>
          <div className="mode-toggle">
            <button className={`mode-toggle-btn${form.type === 'boolean' ? ' active' : ''}`}
              onClick={() => set('type', 'boolean')}>
              ☑ {t('habits.boolean')}
            </button>
            <button className={`mode-toggle-btn${form.type === 'count' ? ' active' : ''}`}
              onClick={() => set('type', 'count')}>
              🔢 {t('habits.count')}
            </button>
          </div>
        </div>

        {form.type === 'count' && (
          <div className="input-row">
            <div>
              <label className="input-label">{t('habits.targetCount')}</label>
              <input type="number" className="input" placeholder="8" min="1"
                value={form.targetCount} onChange={e => set('targetCount', e.target.value)} />
            </div>
            <div>
              <label className="input-label">{t('habits.unit')}</label>
              <input className="input" placeholder={t('habits.unitPlaceholder')}
                value={form.unit} onChange={e => set('unit', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
