import { useMemo, useState } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { formatCurrency, transactionsForMonth } from '../lib/calculations';
import { RepeatIcon } from '../components/icons';
import type { Transaction } from '../types';

type Filter = 'all' | 'income' | 'expense';

export function TransactionsView({
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
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const monthTx = useMemo(() => transactionsForMonth(transactions, month), [transactions, month]);

  const filtered = useMemo(() => {
    return monthTx
      .filter((t) => filter === 'all' || t.type === filter)
      .filter((t) => t.description.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [monthTx, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <MonthSwitcher month={month} onChange={onMonthChange} />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une transaction…"
        className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
      />

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-900/60 p-1">
        {(['all', 'income', 'expense'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg py-2 text-xs font-semibold ${
              filter === f ? 'bg-slate-700 text-white' : 'text-slate-400'
            }`}
          >
            {f === 'all' ? 'Tout' : f === 'income' ? 'Revenus' : 'Dépenses'}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-500">
          Aucune transaction ne correspond.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              <p className="mb-1.5 text-xs font-medium text-slate-500">
                {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <ul className="space-y-2">
                {txs.map((t) => {
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
                            <span className="flex items-center gap-1.5">
                              {t.description}
                              {t.isRecurring && <RepeatIcon width={12} height={12} className="text-amber-400" />}
                            </span>
                            <span className="block text-[11px] text-slate-500">
                              {cat?.name} · {t.kind === 'fixed' ? 'fixe' : 'variable'}
                            </span>
                          </span>
                        </span>
                        <span
                          className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}
                        >
                          {t.type === 'income' ? '+' : '-'}
                          {formatCurrency(t.amount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
