import type { Category } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Logement', color: '#6366f1', icon: '🏠', isDefault: true, parentId: null, appliesTo: 'expense' },
  { name: 'Alimentation', color: '#f59e0b', icon: '🛒', isDefault: true, parentId: null, appliesTo: 'expense' },
  { name: 'Transport', color: '#0ea5e9', icon: '🚗', isDefault: true, parentId: null, appliesTo: 'expense' },
  { name: 'Abonnements', color: '#a855f7', icon: '🔁', isDefault: true, parentId: null, appliesTo: 'expense' },
  { name: 'Loisirs', color: '#ec4899', icon: '🎉', isDefault: true, parentId: null, appliesTo: 'expense' },
  { name: 'Santé', color: '#10b981', icon: '💊', isDefault: true, parentId: null, appliesTo: 'expense' },
  { name: 'Shopping', color: '#f97316', icon: '🛍️', isDefault: true, parentId: null, appliesTo: 'expense' },
  { name: 'Épargne', color: '#14b8a6', icon: '💰', isDefault: true, parentId: null, appliesTo: 'expense' },
  { name: 'Autres', color: '#64748b', icon: '📦', isDefault: true, parentId: null, appliesTo: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Salaire', color: '#22c55e', icon: '💼', isDefault: true, parentId: null, appliesTo: 'income' },
  { name: 'Freelance', color: '#84cc16', icon: '🧾', isDefault: true, parentId: null, appliesTo: 'income' },
  { name: 'Remboursements', color: '#06b6d4', icon: '↩️', isDefault: true, parentId: null, appliesTo: 'income' },
  { name: 'Autres revenus', color: '#8b5cf6', icon: '➕', isDefault: true, parentId: null, appliesTo: 'income' },
];

// Categories considered structurally incompressible by default (used to pre-fill
// the "fixed" kind suggestion when the user picks them, editable per transaction).
export const INCOMPRESSIBLE_CATEGORY_NAMES = new Set(['Logement', 'Santé']);
