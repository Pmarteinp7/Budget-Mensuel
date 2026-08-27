import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Budget, Category, SavingsGoal, Settings, Transaction } from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../data/defaultCategories';

function makeDefaultCategories(): Category[] {
  return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].map((c) => ({
    ...c,
    id: uuid(),
  }));
}

export interface BudgetState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  settings: Settings;

  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;

  addCategory: (c: Omit<Category, 'id' | 'isDefault'>) => Category;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string, fallbackCategoryId: string) => void;

  setBudget: (categoryId: string, month: string, amount: number) => void;
  deleteBudget: (id: string) => void;

  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateSavingsGoal: (id: string, patch: Partial<Omit<SavingsGoal, 'id'>>) => void;
  deleteSavingsGoal: (id: string) => void;

  markStorageWarningSeen: () => void;
  updateSettings: (patch: Partial<Settings>) => void;

  importData: (data: {
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
  }) => void;
  resetAll: () => void;
}

const defaultSettings: Settings = {
  hasSeenStorageWarning: false,
  currency: 'EUR',
  savingsAlertThreshold: 90,
};

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      transactions: [],
      categories: makeDefaultCategories(),
      budgets: [],
      savingsGoals: [],
      settings: defaultSettings,

      addTransaction: (t) => {
        const now = new Date().toISOString();
        const transaction: Transaction = { ...t, id: uuid(), createdAt: now, updatedAt: now };
        set((s) => ({ transactions: [transaction, ...s.transactions] }));
      },
      updateTransaction: (id, patch) => {
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
          ),
        }));
      },
      deleteTransaction: (id) => {
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
      },

      addCategory: (c) => {
        const category: Category = { ...c, id: uuid(), isDefault: false };
        set((s) => ({ categories: [...s.categories, category] }));
        return category;
      },
      updateCategory: (id, patch) => {
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
      },
      deleteCategory: (id, fallbackCategoryId) => {
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id && c.parentId !== id),
          transactions: s.transactions.map((t) =>
            t.categoryId === id ? { ...t, categoryId: fallbackCategoryId } : t,
          ),
          budgets: s.budgets.filter((b) => b.categoryId !== id),
        }));
      },

      setBudget: (categoryId, month, amount) => {
        set((s) => {
          const existing = s.budgets.find((b) => b.categoryId === categoryId && b.month === month);
          if (existing) {
            return {
              budgets: s.budgets.map((b) => (b.id === existing.id ? { ...b, amount } : b)),
            };
          }
          return { budgets: [...s.budgets, { id: uuid(), categoryId, month, amount }] };
        });
      },
      deleteBudget: (id) => {
        set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) }));
      },

      addSavingsGoal: (g) => {
        set((s) => ({
          savingsGoals: [...s.savingsGoals, { ...g, id: uuid(), createdAt: new Date().toISOString() }],
        }));
      },
      updateSavingsGoal: (id, patch) => {
        set((s) => ({
          savingsGoals: s.savingsGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
      },
      deleteSavingsGoal: (id) => {
        set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) }));
      },

      markStorageWarningSeen: () => {
        set((s) => ({ settings: { ...s.settings, hasSeenStorageWarning: true } }));
      },
      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      importData: (data) => {
        set({
          transactions: data.transactions,
          categories: data.categories,
          budgets: data.budgets,
          savingsGoals: data.savingsGoals,
        });
      },
      resetAll: () => {
        set({
          transactions: [],
          categories: makeDefaultCategories(),
          budgets: [],
          savingsGoals: [],
          settings: defaultSettings,
        });
      },
    }),
    {
      name: 'budget-mensuel-storage',
      version: 1,
    },
  ),
);
