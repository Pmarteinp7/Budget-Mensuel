import type { Budget, Category, Transaction } from '../types';

export function monthKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function todayMonthKey(): string {
  return monthKey(new Date());
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

export function transactionsForMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((t) => monthKey(t.date) === month);
}

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
  fixedIncome: number;
  variableIncome: number;
  fixedExpense: number;
  variableExpense: number;
  savingsRate: number; // % of income not spent
}

export function computeMonthSummary(transactions: Transaction[], month: string): MonthSummary {
  const monthTx = transactionsForMonth(transactions, month);
  let income = 0;
  let expense = 0;
  let fixedIncome = 0;
  let variableIncome = 0;
  let fixedExpense = 0;
  let variableExpense = 0;

  for (const t of monthTx) {
    if (t.type === 'income') {
      income += t.amount;
      if (t.kind === 'fixed') fixedIncome += t.amount;
      else variableIncome += t.amount;
    } else {
      expense += t.amount;
      if (t.kind === 'fixed') fixedExpense += t.amount;
      else variableExpense += t.amount;
    }
  }

  const balance = income - expense;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  return { income, expense, balance, fixedIncome, variableIncome, fixedExpense, variableExpense, savingsRate };
}

/**
 * Projects the end-of-month balance based on the average daily spend observed
 * so far this month, extrapolated over the remaining days. Only meaningful
 * for the current month; for past/future months it simply returns the actual
 * (or zero) totals.
 */
export function projectEndOfMonth(transactions: Transaction[], month: string, income: number): {
  projectedExpense: number;
  projectedBalance: number;
  isCurrentMonth: boolean;
} {
  const isCurrentMonth = month === todayMonthKey();
  const monthTx = transactionsForMonth(transactions, month);
  const spentSoFar = monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  if (!isCurrentMonth) {
    return { projectedExpense: spentSoFar, projectedBalance: income - spentSoFar, isCurrentMonth };
  }

  const today = new Date();
  const dayOfMonth = today.getDate();
  const totalDays = daysInMonth(month);
  const avgDaily = dayOfMonth > 0 ? spentSoFar / dayOfMonth : 0;
  const projectedExpense = avgDaily * totalDays;
  const projectedBalance = income - projectedExpense;

  return { projectedExpense, projectedBalance, isCurrentMonth };
}

export interface CategoryBreakdownItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  percent: number;
}

export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  month: string,
  type: 'income' | 'expense' = 'expense',
): CategoryBreakdownItem[] {
  const monthTx = transactionsForMonth(transactions, month).filter((t) => t.type === type);
  const total = monthTx.reduce((sum, t) => sum + t.amount, 0);
  const byCategory = new Map<string, number>();

  for (const t of monthTx) {
    byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amount);
  }

  const items: CategoryBreakdownItem[] = [];
  for (const [categoryId, amount] of byCategory.entries()) {
    const cat = categories.find((c) => c.id === categoryId);
    items.push({
      categoryId,
      name: cat?.name ?? 'Sans catégorie',
      color: cat?.color ?? '#94a3b8',
      icon: cat?.icon ?? '❔',
      total: amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
    });
  }

  return items.sort((a, b) => b.total - a.total);
}

export function categoryMonthOverMonth(
  transactions: Transaction[],
  categoryId: string,
  month: string,
): { current: number; previous: number; percentChange: number | null } {
  const prevMonth = shiftMonth(month, -1);
  const current = transactionsForMonth(transactions, month)
    .filter((t) => t.categoryId === categoryId && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const previous = transactionsForMonth(transactions, prevMonth)
    .filter((t) => t.categoryId === categoryId && t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const percentChange = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : null;
  return { current, previous, percentChange };
}

export interface RecurringGroup {
  key: string;
  description: string;
  categoryId: string;
  amount: number; // most recent / typical amount
  monthsSeen: string[];
  monthlyTotal: number;
}

function normalizeDescription(desc: string): string {
  return desc.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Detects recurring expenses: transactions explicitly flagged `isRecurring`,
 * plus a heuristic that spots the same description+category+similar amount
 * repeating across at least two distinct months. Includes both fixed and
 * variable expenses — this is about spotting patterns across all spending,
 * not pre-judging what the user can or can't act on.
 */
export function detectRecurringExpenses(transactions: Transaction[]): RecurringGroup[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const groups = new Map<string, Transaction[]>();

  for (const t of expenses) {
    const key = `${t.categoryId}::${normalizeDescription(t.description)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const result: RecurringGroup[] = [];
  for (const [key, txs] of groups.entries()) {
    const monthsSeen = Array.from(new Set(txs.map((t) => monthKey(t.date))));
    const flagged = txs.some((t) => t.isRecurring);
    if (!flagged && monthsSeen.length < 2) continue;

    const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date));
    const amount = sorted[0].amount;
    result.push({
      key,
      description: sorted[0].description,
      categoryId: sorted[0].categoryId,
      amount,
      monthsSeen,
      monthlyTotal: amount,
    });
  }

  return result.sort((a, b) => b.monthlyTotal - a.monthlyTotal);
}

export interface AnomalousCategory {
  categoryId: string;
  name: string;
  icon: string;
  current: number;
  average: number;
  percentAboveAverage: number;
}

/**
 * Flags categories whose current-month spending is significantly above the
 * trailing average of the previous months (excluding the current one).
 * Covers all expenses, fixed and variable alike — this is about surfacing
 * where the money moved, not deciding in advance what's actionable.
 */
export function detectAnomalousCategories(
  transactions: Transaction[],
  categories: Category[],
  month: string,
  lookbackMonths = 3,
  thresholdPercent = 20,
): AnomalousCategory[] {
  const current = categoryBreakdown(transactions, categories, month, 'expense');
  const anomalies: AnomalousCategory[] = [];

  for (const item of current) {
    const pastTotals: number[] = [];
    for (let i = 1; i <= lookbackMonths; i++) {
      const m = shiftMonth(month, -i);
      const total = transactionsForMonth(transactions, m)
        .filter((t) => t.categoryId === item.categoryId && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      if (total > 0) pastTotals.push(total);
    }
    if (pastTotals.length === 0) continue;
    const average = pastTotals.reduce((s, v) => s + v, 0) / pastTotals.length;
    if (average <= 0) continue;
    const percentAboveAverage = ((item.total - average) / average) * 100;
    if (percentAboveAverage >= thresholdPercent) {
      anomalies.push({
        categoryId: item.categoryId,
        name: item.name,
        icon: item.icon,
        current: item.total,
        average,
        percentAboveAverage,
      });
    }
  }

  return anomalies.sort((a, b) => b.percentAboveAverage - a.percentAboveAverage);
}

export interface BudgetProgressItem {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  budget: number;
  spent: number;
  percent: number;
  status: 'ok' | 'warning' | 'over';
}

export function budgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  month: string,
  warningThreshold = 90,
): BudgetProgressItem[] {
  const monthBudgets = budgets.filter((b) => b.month === month);
  return monthBudgets
    .map((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = transactionsForMonth(transactions, month)
        .filter((t) => t.categoryId === b.categoryId && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const status: BudgetProgressItem['status'] = percent >= 100 ? 'over' : percent >= warningThreshold ? 'warning' : 'ok';
      return {
        categoryId: b.categoryId,
        name: cat?.name ?? 'Sans catégorie',
        color: cat?.color ?? '#94a3b8',
        icon: cat?.icon ?? '❔',
        budget: b.amount,
        spent,
        percent,
        status,
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

export interface MonthPoint {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export function annualSeries(transactions: Transaction[], year: number): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let m = 1; m <= 12; m++) {
    const month = `${year}-${String(m).padStart(2, '0')}`;
    const summary = computeMonthSummary(transactions, month);
    points.push({ month, income: summary.income, expense: summary.expense, balance: summary.balance });
  }
  return points;
}

export function mostExpensiveMonth(points: MonthPoint[]): MonthPoint | null {
  const withData = points.filter((p) => p.expense > 0);
  if (withData.length === 0) return null;
  return withData.reduce((max, p) => (p.expense > max.expense ? p : max), withData[0]);
}
