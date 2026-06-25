import { useState, useMemo, useCallback } from 'react';
import type { AppState } from '../types';
import { scoreTasks, type ScoredTask } from '../utils/scoring';
import { today } from '../utils/dateHelpers';

export function useFocusSuggestion(state: AppState) {
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const todayStr = today();

  const suggestions: ScoredTask[] = useMemo(
    () => scoreTasks(state.tasks, state.activeContext, skippedIds)
      .filter(s => s.task.lastWorkedOn !== todayStr && !s.task.inProgress)
      .slice(0, 3),
    [state.tasks, state.activeContext, skippedIds, todayStr]
  );

  const skipSuggestion = useCallback((taskId: string) => {
    setSkippedIds(prev => new Set([...prev, taskId]));
  }, []);

  return { suggestions, skipSuggestion };
}
