import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from '../../types';

interface Props {
  current: Screen;
  onNavigate: (s: Screen) => void;
}

const primaryItems: { key: Screen; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    key: 'today',
    label: 'nav.today',
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
  {
    key: 'tasks',
    label: 'nav.tasks',
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    key: 'habits',
    label: 'nav.habits',
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <path d="M9 12l2 2 4-4"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      </svg>
    ),
  },
];

const allItems: { key: Screen; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  ...primaryItems,
  {
    key: 'shopping' as Screen,
    label: 'nav.shopping',
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    key: 'projects',
    label: 'nav.projects',
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    key: 'review',
    label: 'nav.review',
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
      </svg>
    ),
  },
  {
    key: 'einordnen' as Screen,
    label: 'nav.einordnen',
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <path d="M4 6h16M4 12h10M4 18h7"/><path d="M18 14l3 3-3 3"/>
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'nav.settings',
    icon: (a) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2.5 : 2}>
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
      </svg>
    ),
  },
];

const moreScreens: Screen[] = ['shopping', 'projects', 'review', 'settings', 'einordnen'];
const extrasScreens: Screen[] = ['einordnen'];
const topMoreScreens: Screen[] = ['shopping', 'projects', 'review'];

export default function Navigation({ current, onNavigate }: Props) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);

  const isMoreActive = moreScreens.includes(current);

  const handleNavigate = (s: Screen) => {
    setMoreOpen(false);
    setExtrasOpen(false);
    onNavigate(s);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">TW</div>
          <span className="sidebar-name">Tageswerk</span>
        </div>
        <nav className="sidebar-nav">
          {allItems.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`nav-item${current === key ? ' active' : ''}`}
              onClick={() => handleNavigate(key)}
            >
              {icon(current === key)}
              {t(label)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav — primary 3 tabs + More */}
      <nav className="bottom-nav">
        {primaryItems.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`bottom-nav-item${current === key ? ' active' : ''}`}
            onClick={() => handleNavigate(key)}
          >
            {icon(current === key)}
            {t(label)}
          </button>
        ))}

        {/* More button */}
        <button
          className={`bottom-nav-item${isMoreActive || moreOpen ? ' active' : ''}`}
          onClick={() => setMoreOpen(v => !v)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isMoreActive || moreOpen ? 2.5 : 2}>
            <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
          </svg>
          {t('nav.more')}
        </button>
      </nav>

      {/* More drawer overlay */}
      {moreOpen && (
        <>
          <div className="more-overlay" onClick={() => setMoreOpen(false)} />
          <div className="more-drawer">
            {/* Top-level more items */}
            {allItems.filter(i => topMoreScreens.includes(i.key)).map(({ key, label, icon }) => (
              <button
                key={key}
                className={`more-drawer-item${current === key ? ' active' : ''}`}
                onClick={() => handleNavigate(key)}
              >
                {icon(current === key)}
                <span>{t(label)}</span>
              </button>
            ))}

            {/* Weiteres sub-section toggle */}
            <button
              className={`more-drawer-item more-drawer-extras-toggle${extrasScreens.includes(current) ? ' active' : ''}`}
              onClick={() => setExtrasOpen(v => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={extrasScreens.includes(current) ? 2.5 : 2}>
                <path d="M4 6h16M4 12h10M4 18h7"/><path d="M18 14l3 3-3 3"/>
              </svg>
              <span style={{ flex: 1 }}>{t('nav.extras')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: 'transform 180ms', transform: extrasOpen ? 'rotate(180deg)' : 'none', opacity: 0.5 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {/* Weiteres sub-items */}
            {extrasOpen && (
              <div className="more-drawer-sub">
                {allItems.filter(i => extrasScreens.includes(i.key)).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    className={`more-drawer-sub-item${current === key ? ' active' : ''}`}
                    onClick={() => handleNavigate(key)}
                  >
                    {icon(current === key)}
                    <span>{t(label)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Settings always last */}
            {allItems.filter(i => i.key === 'settings').map(({ key, label, icon }) => (
              <button
                key={key}
                className={`more-drawer-item${current === key ? ' active' : ''}`}
                onClick={() => handleNavigate(key)}
              >
                {icon(current === key)}
                <span>{t(label)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
