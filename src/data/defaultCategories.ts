import type { Category } from '../types';

export const defaultCategories: Category[] = [
  { id: 'cat-arbeit',     name: 'Arbeit',      color: '#3B82F6', icon: '💼', order: 0 },
  { id: 'cat-privat',     name: 'Privat',      color: '#EC4899', icon: '❤️', order: 1 },
  { id: 'cat-gesundheit', name: 'Gesundheit',  color: '#10B981', icon: '🏃', order: 2 },
  { id: 'cat-finanzen',   name: 'Finanzen',    color: '#F59E0B', icon: '📊', order: 3 },
  { id: 'cat-lernen',     name: 'Lernen',      color: '#8B5CF6', icon: '📚', order: 4 },
  { id: 'cat-sonstiges',  name: 'Sonstiges',   color: '#6B7280', icon: '📌', order: 5 },
];
