import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import type { AppStateContext } from '../hooks/useAppState';
import type { Language, Theme, Category } from '../types';
import Modal from '../components/ui/Modal';

interface Props {
  ctx: AppStateContext;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
];

const DEFAULT_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b', '#f97316'];
const DEFAULT_ICONS = ['📁', '💼', '🏠', '🎯', '📚', '💡', '🛒', '🏋️', '🌱', '✈️'];

export default function SettingsScreen({ ctx }: Props) {
  const { t } = useTranslation();
  const { state, updateSettings, addCategory, updateCategory, deleteCategory, exportData, importData } = ctx;

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', icon: '📁', color: DEFAULT_COLORS[0] });
  const importRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');

  const setLang = (lang: Language) => {
    i18n.changeLanguage(lang);
    updateSettings({ language: lang });
  };

  const setTheme = (theme: Theme) => {
    updateSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const openAddCat = () => {
    setCatForm({ name: '', icon: '📁', color: DEFAULT_COLORS[0] });
    setAddingCategory(true);
  };

  const openEditCat = (cat: Category) => {
    setCatForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setEditingCategory(cat);
  };

  const saveCat = () => {
    if (!catForm.name.trim()) return;
    if (editingCategory) {
      updateCategory(editingCategory.id, { name: catForm.name.trim(), icon: catForm.icon, color: catForm.color });
      setEditingCategory(null);
    } else {
      addCategory({ name: catForm.name.trim(), icon: catForm.icon, color: catForm.color, order: state.categories.length });
      setAddingCategory(false);
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tageswerk-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ok = importData(ev.target?.result as string);
      setImportMsg(ok ? t('settings.importSuccess') : t('settings.importError'));
      setTimeout(() => setImportMsg(''), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const catFormModal = (title: string, onClose: () => void) => (
    <Modal
      isOpen
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost btn-md" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary btn-md" onClick={saveCat} disabled={!catForm.name.trim()}>
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="form-section">
        <div>
          <label className="input-label">{t('category.name')}</label>
          <input className="input" value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} autoFocus />
        </div>
        <div>
          <label className="input-label">{t('category.icon')}</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {DEFAULT_ICONS.map(icon => (
              <button
                key={icon}
                className={`btn btn-ghost btn-sm${catForm.icon === icon ? ' active' : ''}`}
                style={{ fontSize: 20, padding: 'var(--space-2)' }}
                onClick={() => setCatForm(p => ({ ...p, icon }))}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="input-label">{t('project.color')}</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {DEFAULT_COLORS.map(col => (
              <button
                key={col}
                className={`color-swatch${catForm.color === col ? ' active' : ''}`}
                style={{ background: col }}
                onClick={() => setCatForm(p => ({ ...p, color: col }))}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="screen">
      <div className="screen-header">
        <h1 className="screen-title">{t('nav.settings')}</h1>
      </div>

      {/* Language */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t('settings.language')}</h2>
        <div className="lang-btns">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              className={`lang-btn${state.settings.language === code ? ' active' : ''}`}
              onClick={() => setLang(code)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t('settings.theme')}</h2>
        <div className="mode-toggle">
          {(['light', 'dark'] as Theme[]).map(th => (
            <button
              key={th}
              className={`mode-toggle-btn${state.settings.theme === th ? ' active' : ''}`}
              onClick={() => setTheme(th)}
            >
              {th === 'light' ? '☀️' : '🌙'} {t(`settings.theme_${th}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="settings-section">
        <div className="settings-section-header">
          <h2 className="settings-section-title">{t('settings.categories')}</h2>
          <button className="btn btn-outline btn-sm" onClick={openAddCat}>
            + {t('category.add')}
          </button>
        </div>
        <div className="category-list">
          {state.categories.map(cat => (
            <div key={cat.id} className="category-list-item">
              <span className="category-dot" style={{ background: cat.color }} />
              <span className="category-list-icon">{cat.icon}</span>
              <span className="category-list-name">{cat.name}</span>
              <div className="category-list-actions">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEditCat(cat)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => { if (confirm(t('form.confirmDelete'))) deleteCategory(cat.id); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data */}
      <div className="settings-section">
        <h2 className="settings-section-title">{t('settings.data')}</h2>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-md" onClick={handleExport}>
            {t('settings.export')}
          </button>
          <button className="btn btn-outline btn-md" onClick={() => importRef.current?.click()}>
            {t('settings.import')}
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
        {importMsg && (
          <p style={{ marginTop: 'var(--space-2)', color: importMsg.includes('✓') ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {importMsg}
          </p>
        )}
      </div>

      {addingCategory && catFormModal(t('category.add'), () => setAddingCategory(false))}
      {editingCategory && catFormModal(t('category.edit'), () => setEditingCategory(null))}
    </div>
  );
}
