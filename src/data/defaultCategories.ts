import type { Category } from '../types';

export const defaultCategories: Category[] = [
  { id: 'awaqe',        name: 'AWAQE / FitLine',            color: '#3B82F6', icon: '💼', order: 0 },
  { id: 'preply',       name: 'Preply / DaF',               color: '#10B981', icon: '📚', order: 1 },
  { id: 'family',       name: 'Familie / Baby',             color: '#EC4899', icon: '👶', order: 2 },
  { id: 'personal-dev', name: 'Persönliche Entwicklung',    color: '#8B5CF6', icon: '🌱', order: 3 },
  { id: 'business',     name: 'Business / Finanzen / Admin',color: '#F59E0B', icon: '📊', order: 4 },
  { id: 'household',    name: 'Haushalt / Alltag',          color: '#6B7280', icon: '🏠', order: 5 },
  { id: 'projects',     name: 'Projekte',                   color: '#06B6D4', icon: '🚀', order: 6 },
  { id: 'personal',     name: 'Persönliches',               color: '#EF4444', icon: '❤️', order: 7 },
  { id: 'shopping',     name: 'Einkauf',                    color: '#EAB308', icon: '🛒', order: 8 },
];
