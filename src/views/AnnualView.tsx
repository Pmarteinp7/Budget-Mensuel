import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useBudgetStore } from '../store/budgetStore';
import { annualSeries, formatCurrency, mostExpensiveMonth } from '../lib/calculations';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';

const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export function AnnualView() {
  const transactions = useBudgetStore((s) => s.transactions);
  const [year, setYear] = useState(new Date().getFullYear());

  const series = useMemo(() => annualSeries(transactions, year), [transactions, year]);
  const chartData = series.map((p, i) => ({ name: MONTH_SHORT[i], Revenus: p.income, Dépenses: p.expense, Solde: p.balance }));

  const cumulativeData = series.reduce<{ name: string; Cumulé: number }[]>((acc, p, i) => {
    const previous = acc[i - 1]?.Cumulé ?? 0;
    acc.push({ name: MONTH_SHORT[i], Cumulé: Math.round((previous + p.balance) * 100) / 100 });
    return acc;
  }, []);

  const totalIncome = series.reduce((s, p) => s + p.income, 0);
  const totalExpense = series.reduce((s, p) => s + p.expense, 0);
  const totalBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (totalBalance / totalIncome) * 100 : 0;
  const expensiveMonth = mostExpensiveMonth(series);
  const avgExpense = series.filter((p) => p.expense > 0).length
    ? totalExpense / series.filter((p) => p.expense > 0).length
    : 0;

  const trend =
    series.filter((p) => p.expense > 0).length >= 2
      ? (() => {
          const withData = series.filter((p) => p.expense > 0);
          const first = withData[0].expense;
          const last = withData[withData.length - 1].expense;
          return first > 0 ? ((last - first) / first) * 100 : 0;
        })()
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
          aria-label="Année précédente"
        >
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <span className="text-sm font-semibold text-slate-100">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
          aria-label="Année suivante"
        >
          <ChevronRightIcon width={18} height={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-[11px] text-slate-400">Solde cumulé</p>
          <p className={`text-lg font-bold ${totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="text-[11px] text-slate-400">Taux d'épargne annuel</p>
          <p className={`text-lg font-bold ${savingsRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {savingsRate.toFixed(0)}%
          </p>
        </div>
      </div>

      {expensiveMonth && (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-xs text-amber-100">
          Le mois le plus cher est <span className="font-semibold">{monthName(expensiveMonth.month)}</span> avec{' '}
          {formatCurrency(expensiveMonth.expense)} dépensés, soit{' '}
          {avgExpense > 0 ? `${(((expensiveMonth.expense - avgExpense) / avgExpense) * 100).toFixed(0)}%` : '—'} de plus que
          la moyenne mensuelle.
        </div>
      )}

      {trend !== null && (
        <p className="text-xs text-slate-400">
          Tendance des dépenses sur l'année :{' '}
          <span className={trend > 0 ? 'text-rose-400' : 'text-emerald-400'}>
            {trend > 0 ? 'en hausse' : 'en baisse'} ({trend > 0 ? '+' : ''}
            {trend.toFixed(0)}%)
          </span>
        </p>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Revenus / dépenses par mois</h2>
        <div className="h-56 rounded-2xl border border-slate-800 bg-slate-900/40 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="Revenus" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Dépenses" fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Solde cumulé</h2>
        <div className="h-48 rounded-2xl border border-slate-800 bg-slate-900/40 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="Cumulé" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function monthName(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
