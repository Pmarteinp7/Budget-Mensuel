import { useMemo, useState } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { ProgressBar } from '../components/ProgressBar';
import { budgetProgress, formatCurrency } from '../lib/calculations';
import { PlusIcon, TrashIcon } from '../components/icons';

export function BudgetsView({ month, onMonthChange }: { month: string; onMonthChange: (m: string) => void }) {
  const categories = useBudgetStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const transactions = useBudgetStore((s) => s.transactions);
  const setBudget = useBudgetStore((s) => s.setBudget);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const savingsGoals = useBudgetStore((s) => s.savingsGoals);
  const addSavingsGoal = useBudgetStore((s) => s.addSavingsGoal);
  const deleteSavingsGoal = useBudgetStore((s) => s.deleteSavingsGoal);

  const expenseCategories = categories.filter((c) => c.appliesTo === 'expense' && c.parentId === null);
  const monthBudgets = budgets.filter((b) => b.month === month);
  const budgetedIds = new Set(monthBudgets.map((b) => b.categoryId));
  const unbudgeted = expenseCategories.filter((c) => !budgetedIds.has(c.id));

  const progress = useMemo(
    () => budgetProgress(budgets, transactions, categories, month),
    [budgets, transactions, categories, month],
  );

  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');

  function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(newBudgetAmount.replace(',', '.'));
    const categoryId = newBudgetCategory || unbudgeted[0]?.id;
    if (!amount || amount <= 0 || !categoryId) return;
    setBudget(categoryId, month, amount);
    setNewBudgetAmount('');
    setNewBudgetCategory('');
  }

  const savingsCategory = categories.find((c) => c.name === 'Épargne' && c.appliesTo === 'expense');
  const savedTotal = savingsCategory
    ? transactions.filter((t) => t.categoryId === savingsCategory.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    : 0;

  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [showGoalForm, setShowGoalForm] = useState(false);

  function handleAddGoal(e: React.FormEvent) {
    e.preventDefault();
    const target = parseFloat(goalAmount.replace(',', '.'));
    if (!goalName.trim() || !target || target <= 0) return;
    addSavingsGoal({ name: goalName.trim(), targetAmount: target, targetDate: null });
    setGoalName('');
    setGoalAmount('');
    setShowGoalForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Budgets par catégorie</h2>
        </div>
        <MonthSwitcher month={month} onChange={onMonthChange} />

        <div className="mt-3 flex flex-col gap-2.5">
          {progress.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-sm text-slate-500">
              Aucun budget défini pour ce mois. Fixez-en un ci-dessous pour être alerté avant de dépasser.
            </p>
          )}
          {progress.map((p) => {
            const budgetEntry = monthBudgets.find((b) => b.categoryId === p.categoryId);
            return (
              <div key={p.categoryId} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    {p.icon} {p.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <span
                      className={
                        p.status === 'over' ? 'text-rose-400' : p.status === 'warning' ? 'text-amber-400' : 'text-slate-300'
                      }
                    >
                      {formatCurrency(p.spent)} / {formatCurrency(p.budget)}
                    </span>
                    <button
                      type="button"
                      onClick={() => budgetEntry && deleteBudget(budgetEntry.id)}
                      className="text-slate-600 hover:text-rose-400"
                      aria-label="Supprimer ce budget"
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </span>
                </div>
                <ProgressBar percent={p.percent} status={p.status} />
                {p.status === 'over' && (
                  <p className="mt-1 text-[11px] text-rose-400">Budget dépassé de {formatCurrency(p.spent - p.budget)}.</p>
                )}
                {p.status === 'warning' && (
                  <p className="mt-1 text-[11px] text-amber-400">Attention, vous approchez du budget fixé.</p>
                )}
              </div>
            );
          })}
        </div>

        {unbudgeted.length > 0 && (
          <form onSubmit={handleAddBudget} className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-800 p-3">
            <p className="text-xs font-medium text-slate-400">Définir un budget</p>
            <div className="flex gap-2">
              <select
                value={newBudgetCategory}
                onChange={(e) => setNewBudgetCategory(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100"
              >
                {unbudgeted.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="decimal"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                placeholder="Montant"
                className="w-24 rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100"
              />
            </div>
            <button type="submit" className="rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950">
              Ajouter
            </button>
          </form>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Objectifs d'épargne</h2>
          <button
            type="button"
            onClick={() => setShowGoalForm((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-200"
          >
            <PlusIcon width={14} height={14} /> Objectif
          </button>
        </div>

        {savingsCategory && (
          <p className="mb-2 text-xs text-slate-500">
            Total épargné à ce jour (catégorie Épargne, toutes périodes) : {formatCurrency(savedTotal)}
          </p>
        )}

        {showGoalForm && (
          <form onSubmit={handleAddGoal} className="mb-3 flex flex-col gap-2 rounded-xl border border-slate-800 p-3">
            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Nom de l'objectif (ex : Vacances)"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            />
            <input
              type="text"
              inputMode="decimal"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder="Montant cible (€)"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            />
            <button type="submit" className="rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950">
              Créer l'objectif
            </button>
          </form>
        )}

        {savingsGoals.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-sm text-slate-500">
            Aucun objectif pour l'instant.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {savingsGoals.map((g) => {
              const contributed = savingsCategory
                ? transactions
                    .filter(
                      (t) => t.categoryId === savingsCategory.id && t.type === 'expense' && t.date >= g.createdAt.slice(0, 10),
                    )
                    .reduce((s, t) => s + t.amount, 0)
                : 0;
              const percent = g.targetAmount > 0 ? (contributed / g.targetAmount) * 100 : 0;
              return (
                <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-slate-200">{g.name}</span>
                    <span className="flex items-center gap-2 text-slate-300">
                      {formatCurrency(contributed)} / {formatCurrency(g.targetAmount)}
                      <button
                        type="button"
                        onClick={() => deleteSavingsGoal(g.id)}
                        className="text-slate-600 hover:text-rose-400"
                        aria-label="Supprimer cet objectif"
                      >
                        <TrashIcon width={14} height={14} />
                      </button>
                    </span>
                  </div>
                  <ProgressBar percent={percent} status={percent >= 100 ? 'ok' : percent >= 90 ? 'warning' : 'ok'} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
