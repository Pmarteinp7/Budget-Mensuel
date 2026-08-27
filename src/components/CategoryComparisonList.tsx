import type { CategoryBreakdownItem } from '../lib/calculations';
import { categoryMonthOverMonth, formatCurrency } from '../lib/calculations';
import { useBudgetStore } from '../store/budgetStore';

export function CategoryComparisonList({ items, month }: { items: CategoryBreakdownItem[]; month: string }) {
  const transactions = useBudgetStore((s) => s.transactions);

  if (items.length === 0) return null;

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const { percentChange } = categoryMonthOverMonth(transactions, item.categoryId, month);
        return (
          <li key={item.categoryId} className="flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.icon} {item.name}
            </span>
            <span className="flex items-center gap-2 text-sm">
              <span className="text-slate-300">{formatCurrency(item.total)}</span>
              {percentChange !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    percentChange > 0 ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  {percentChange > 0 ? '+' : ''}
                  {percentChange.toFixed(0)}%
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
