import type { Task } from '../types';

export interface DuplicateHint {
  task: Task;
  score: number;
  isActive: boolean;
}

const STOP_WORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem',
  'und', 'oder', 'aber', 'mit', 'von', 'zu', 'zum', 'zur', 'in', 'im', 'auf',
  'an', 'the', 'and', 'or', 'for', 'with', 'to', 'of', 'in', 'a', 'an',
  'que', 'con', 'por', 'para', 'una', 'los', 'las',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .split(/[\s,._\-/()]+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w))
  );
}

function similarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  setA.forEach(w => { if (setB.has(w)) intersection++; });
  return intersection / Math.max(setA.size, setB.size);
}

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
export const DUPLICATE_THRESHOLD = 0.45;

export function findDuplicate(title: string, tasks: Task[], excludeId?: string): DuplicateHint | null {
  if (title.trim().length < 4) return null;
  const now = Date.now();

  const candidates = tasks.filter(t => {
    if (t.id === excludeId) return false;
    if (t.status === 'archived') return false;
    if (t.status === 'active') return true;
    if (t.status === 'completed' && t.completedAt) {
      return now - new Date(t.completedAt).getTime() < SIX_MONTHS_MS;
    }
    return false;
  });

  let best: DuplicateHint | null = null;
  for (const t of candidates) {
    const score = similarity(title, t.title);
    if (score >= DUPLICATE_THRESHOLD && (!best || score > best.score)) {
      best = { task: t, score, isActive: t.status === 'active' };
    }
  }
  return best;
}
