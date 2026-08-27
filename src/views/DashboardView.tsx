import { useMemo } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { BalanceCard } from '../components/BalanceCard';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { CategoryComparisonList } from '../components/CategoryComparisonList';
import { ReducibleSpendingCard } from '../components/ReducibleSpendingCard';
import { categoryBreakdown, computeMonthSummary, projectEndOfMonth } from '../lib/calculations';
import type { Transaction } from '../types';

export function DashboardView({
  month,
  onMonthChange,
  onEditTransaction,
}: {
  month: string;
  onMonthChange: (m: string) => void;
  onEditTransaction: (t: Transaction) => void;
}) {
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);

  const summary = useMemo(() => computeMonthSummary(transactions, month), [transactions, month]);
  const projection = useMemo(
    () => projectEndOfMonth(transactions, month, summary.income),
    [transactions, month, summary.income],
  );
  const breakdown = useMemo(() => categoryBreakdown(transactions, categories, month), [transactions, categories, month]);

  const recentTx = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [transactions, month],
  );

  return (
    <div className="flex flex-col gap-4">
      <MonthSwitcher month={month} onChange={onMonthChange} />

      <BalanceCard
        income={summary.income}
        expense={summary.expense}
        balance={summary.balance}
        projectedBalance={projection.projectedBalance}
        isCurrentMonth={projection.isCurrentMonth}
        savingsRate={summary.savingsRate}
      />

      <ReducibleSpendingCard month={month} />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Répartition des dépenses</h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <CategoryPieChart items={breakdown} />
        </div>
      </section>

      {breakdown.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-300">Comparaison vs mois dernier</h2>
          <CategoryComparisonList items={breakdown} month={month} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Dernières transactions</h2>
        {recentTx.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-sm text-slate-500">
            Aucune transaction ce mois-ci. Touchez le + pour commencer.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentTx.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => onEditTransaction(t)}
                    className="flex w-full items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2.5 text-left hover:bg-slate-900"
                  >
                    <span className="flex items-center gap-2 text-sm text-slate-200">
                      <span>{cat?.icon ?? '❔'}</span>
                      <span>
                        <span className="block">{t.description}</span>
                        <span className="block text-[11px] text-slate-500">
                          {new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </span>
                    </span>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {t.amount.toFixed(2)} €
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
