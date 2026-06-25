import { useEffect, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { Screen } from './types';
import { useFirestoreState, type AppStateContext } from './hooks/useFirestoreState';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/layout/Navigation';
import TodayScreen from './screens/TodayScreen';
import TasksScreen from './screens/TasksScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import HabitsScreen from './screens/HabitsScreen';
import ReviewScreen from './screens/ReviewScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import AuthScreen from './screens/auth/AuthScreen';
import TaskForm from './components/tasks/TaskForm';

const Ctx = createContext<AppStateContext | null>(null);
export const useCtx = () => useContext(Ctx)!;

function AppShell() {
  const { i18n } = useTranslation();
  const appState = useFirestoreState();
  const { state, addTask, resetCompletedRecurring, dataLoading } = appState;
  const [screen, setScreen] = useState<Screen>('today');
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    i18n.changeLanguage(state.settings.language);
  }, [state.settings.theme, state.settings.language]);

  useEffect(() => {
    if (!dataLoading) void resetCompletedRecurring();
  }, [dataLoading]);

  if (dataLoading) {
    return (
      <div className="loading-screen">
        <div className="sidebar-logo" style={{ width: 52, height: 52, fontSize: 20, borderRadius: 14, marginBottom: 16 }}>TW</div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Laden…</p>
      </div>
    );
  }

  const renderScreen = () => {
    switch (screen) {
      case 'today':    return <TodayScreen ctx={appState} />;
      case 'tasks':    return <TasksScreen ctx={appState} />;
      case 'projects': return <ProjectsScreen ctx={appState} />;
      case 'habits':   return <HabitsScreen ctx={appState} />;
      case 'review':   return <ReviewScreen ctx={appState} />;
      case 'settings': return <SettingsScreen ctx={appState} />;
      case 'shopping': return <ShoppingListScreen ctx={appState} />;
    }
  };

  return (
    <Ctx.Provider value={appState}>
      <div className="app">
        <Navigation current={screen} onNavigate={setScreen} />
        <main className="content">
          {renderScreen()}
        </main>
        <button className="fab" onClick={() => setFabOpen(true)} aria-label="New task">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        {fabOpen && (
          <TaskForm
            isOpen
            onClose={() => setFabOpen(false)}
            categories={state.categories}
            projects={state.projects}
            onSave={data => { addTask(data); }}
          />
        )}
      </div>
    </Ctx.Provider>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="sidebar-logo" style={{ width: 52, height: 52, fontSize: 20, borderRadius: 14 }}>TW</div>
      </div>
    );
  }

  return user ? <AppShell /> : <AuthScreen />;
}
