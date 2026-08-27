import { formatCurrency } from '../lib/calculations';
import { ArrowDownRightIcon, ArrowUpRightIcon } from './icons';

export function BalanceCard({
  income,
  expense,
  balance,
  projectedBalance,
  isCurrentMonth,
  savingsRate,
}: {
  income: number;
  expense: number;
  balance: number;
  projectedBalance: number;
  isCurrentMonth: boolean;
  savingsRate: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/40 p-5">
      <p className="text-xs font-medium text-slate-400">Solde du mois</p>
      <p className={`mt-1 text-4xl font-extrabold tracking-tight ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {formatCurrency(balance)}
      </p>

      {isCurrentMonth && (
        <p className="mt-1 text-xs text-slate-400">
          Projection fin de mois :{' '}
          <span className={projectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {formatCurrency(projectedBalance)}
          </span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <ArrowDownRightIcon width={16} height={16} />
          </span>
          <div>
            <p className="text-[11px] text-slate-400">Revenus</p>
            <p className="text-sm font-semibold text-slate-100">{formatCurrency(income)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 p-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
            <ArrowUpRightIcon width={16} height={16} />
          </span>
          <div>
            <p className="text-[11px] text-slate-400">Dépenses</p>
            <p className="text-sm font-semibold text-slate-100">{formatCurrency(expense)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-800/40 px-3 py-2">
        <span className="text-xs text-slate-400">Taux d'épargne</span>
        <span className={`text-sm font-bold ${savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {savingsRate >= 0 ? '+' : ''}
          {savingsRate.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
