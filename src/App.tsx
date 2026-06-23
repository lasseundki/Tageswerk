import { useEffect, createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Screen } from './types';
import { useAppState, type AppStateContext } from './hooks/useAppState';
import Navigation from './components/layout/Navigation';
import TodayScreen from './screens/TodayScreen';
import TasksScreen from './screens/TasksScreen';
import ProjectsScreen from './screens/ProjectsScreen';
import HabitsScreen from './screens/HabitsScreen';
import ReviewScreen from './screens/ReviewScreen';
import SettingsScreen from './screens/SettingsScreen';
import TaskForm from './components/tasks/TaskForm';

const Ctx = createContext<AppStateContext | null>(null);
export const useCtx = () => useContext(Ctx)!;

export default function App() {
  const { i18n } = useTranslation();
  const appState = useAppState();
  const { state, addTask, resetCompletedRecurring } = appState;
  const [screen, setScreen] = useState<Screen>('today');
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    i18n.changeLanguage(state.settings.language);
  }, []);

  useEffect(() => {
    resetCompletedRecurring();
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case 'today':    return <TodayScreen ctx={appState} />;
      case 'tasks':    return <TasksScreen ctx={appState} />;
      case 'projects': return <ProjectsScreen ctx={appState} />;
      case 'habits':   return <HabitsScreen ctx={appState} />;
      case 'review':   return <ReviewScreen ctx={appState} />;
      case 'settings': return <SettingsScreen ctx={appState} />;
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
