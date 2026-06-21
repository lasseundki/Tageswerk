import { useState, useMemo, useCallback } from 'react';
import type { AppState } from '../types';
import { scoreTasks, type ScoredTask } from '../utils/scoring';

export function useFocusSuggestion(state: AppState) {
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  const scored: ScoredTask[] = useMemo(
    () => scoreTasks(state.tasks, state.activeContext, skippedIds),
    [state.tasks, state.activeContext, skippedIds]
  );

  const suggestion = scored[0] ?? null;

  const skipSuggestion = useCallback(() => {
    if (suggestion) {
      setSkippedIds(prev => new Set([...prev, suggestion.task.id]));
    }
  }, [suggestion]);

  const resetSkipped = useCallback(() => setSkippedIds(new Set()), []);

  return { suggestion, skipSuggestion, resetSkipped };
}
