export type TransactionType = 'income' | 'expense';

/**
 * For income: 'fixed' = salaire, 'variable' = freelance / remboursements.
 * For expense: 'fixed' = incompressible (loyer, assurances), 'variable' = compressible.
 */
export type TransactionKind = 'fixed' | 'variable';

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: number; // always stored positive
  description: string;
  type: TransactionType;
  kind: TransactionKind;
  categoryId: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  icon: string;
  isDefault: boolean;
  appliesTo: TransactionType;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  amount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  createdAt: string;
}

export interface Settings {
  hasSeenStorageWarning: boolean;
  currency: string;
  savingsAlertThreshold: number; // % over budget before alert, default 100
}
