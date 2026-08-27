import type { Budget, Category, SavingsGoal, Transaction } from '../types';
import { computeMonthSummary, monthLabel, transactionsForMonth } from './calculations';

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportMonthCSV(month: string, transactions: Transaction[], categories: Category[]) {
  const monthTx = transactionsForMonth(transactions, month).sort((a, b) => a.date.localeCompare(b.date));
  const summary = computeMonthSummary(transactions, month);

  const rows: string[][] = [
    ['Budget mensuel', monthLabel(month)],
    ['Solde', summary.balance.toFixed(2)],
    ['Revenus', summary.income.toFixed(2)],
    ['Dépenses', summary.expense.toFixed(2)],
    ["Taux d'épargne (%)", summary.savingsRate.toFixed(1)],
    [],
    ['Date', 'Description', 'Catégorie', 'Type', 'Nature', 'Récurrent', 'Montant'],
    ...monthTx.map((t) => {
      const cat = categories.find((c) => c.id === t.categoryId);
      return [
        t.date,
        t.description,
        cat?.name ?? '',
        t.type === 'income' ? 'Revenu' : 'Dépense',
        t.kind === 'fixed' ? 'Fixe' : 'Variable',
        t.isRecurring ? 'Oui' : 'Non',
        (t.type === 'income' ? t.amount : -t.amount).toFixed(2),
      ];
    }),
  ];

  const csv = rows.map((r) => r.map(csvEscape).join(';')).join('\n');
  downloadBlob(`﻿${csv}`, `budget-${month}.csv`, 'text/csv;charset=utf-8');
}

function csvEscape(value: string): string {
  if (value == null) return '';
  const str = String(value);
  if (/[;"\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
}

export function exportJSONBackup(data: Omit<BackupData, 'version' | 'exportedAt'>) {
  const payload: BackupData = { version: 1, exportedAt: new Date().toISOString(), ...data };
  const today = new Date().toISOString().slice(0, 10);
  downloadBlob(JSON.stringify(payload, null, 2), `budget-sauvegarde-${today}.json`, 'application/json');
}

export function parseJSONBackup(text: string): BackupData {
  const parsed = JSON.parse(text);
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !Array.isArray(parsed.transactions) ||
    !Array.isArray(parsed.categories) ||
    !Array.isArray(parsed.budgets) ||
    !Array.isArray(parsed.savingsGoals)
  ) {
    throw new Error('Fichier de sauvegarde invalide.');
  }
  return parsed as BackupData;
}
