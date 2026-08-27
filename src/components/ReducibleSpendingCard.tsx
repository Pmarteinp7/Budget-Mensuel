import { useMemo } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import {
  detectAnomalousCategories,
  detectRecurringExpenses,
  formatCurrency,
} from '../lib/calculations';
import { AlertIcon, RepeatIcon } from './icons';

export function ReducibleSpendingCard({ month }: { month: string }) {
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);

  const anomalies = useMemo(
    () => detectAnomalousCategories(transactions, categories, month),
    [transactions, categories, month],
  );
  const recurring = useMemo(() => detectRecurringExpenses(transactions), [transactions]);
  const recurringTotal = recurring.reduce((s, r) => s + r.monthlyTotal, 0);

  if (anomalies.length === 0 && recurring.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertIcon width={18} height={18} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-100">Suivi des dépenses</h3>
      </div>

      {recurring.length > 0 && (
        <div className="mb-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-200">
            <RepeatIcon width={14} height={14} />
            {recurring.length} dépense{recurring.length > 1 ? 's' : ''} récurrente{recurring.length > 1 ? 's' : ''}{' '}
            détectée{recurring.length > 1 ? 's' : ''} — {formatCurrency(recurringTotal)}/mois
          </p>
          <ul className="mt-1.5 space-y-1">
            {recurring.slice(0, 4).map((r) => (
              <li key={r.key} className="flex items-center justify-between text-xs text-amber-100/80">
                <span>{r.description}</span>
                <span className="font-medium">{formatCurrency(r.amount)}/mois</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {anomalies.length > 0 && (
        <div className="space-y-1.5">
          {anomalies.slice(0, 3).map((a) => (
            <p key={a.categoryId} className="text-xs text-amber-100/90">
              {a.icon} <span className="font-semibold">{a.name}</span> est {a.percentAboveAverage.toFixed(0)}% au-dessus
              de votre moyenne des derniers mois ({formatCurrency(a.current)} vs {formatCurrency(a.average)} en moyenne).
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
