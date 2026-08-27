import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useBudgetStore } from '../store/budgetStore';
import type { Transaction, TransactionKind, TransactionType } from '../types';
import { INCOMPRESSIBLE_CATEGORY_NAMES } from '../data/defaultCategories';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function TransactionFormModal({
  editTransaction,
  defaultType,
  onClose,
}: {
  editTransaction?: Transaction;
  defaultType?: TransactionType;
  onClose: () => void;
}) {
  const categories = useBudgetStore((s) => s.categories);
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const updateTransaction = useBudgetStore((s) => s.updateTransaction);
  const deleteTransaction = useBudgetStore((s) => s.deleteTransaction);

  const [type, setType] = useState<TransactionType>(editTransaction?.type ?? defaultType ?? 'expense');
  const [amount, setAmount] = useState(editTransaction ? String(editTransaction.amount) : '');
  const [description, setDescription] = useState(editTransaction?.description ?? '');
  const [date, setDate] = useState(editTransaction?.date ?? todayISO());
  const [categoryId, setCategoryId] = useState(editTransaction?.categoryId ?? '');
  const [kind, setKind] = useState<TransactionKind>(editTransaction?.kind ?? 'variable');
  const [isRecurring, setIsRecurring] = useState(editTransaction?.isRecurring ?? false);
  const [error, setError] = useState('');

  const availableCategories = useMemo(
    () => categories.filter((c) => c.appliesTo === type && c.parentId === null),
    [categories, type],
  );

  const activeCategoryId = categoryId || availableCategories[0]?.id || '';

  const selectedTopCategory = useMemo(() => {
    const active = categories.find((c) => c.id === activeCategoryId);
    if (!active) return undefined;
    return active.parentId ? categories.find((c) => c.id === active.parentId) : active;
  }, [categories, activeCategoryId]);

  const subcategories = useMemo(
    () => (selectedTopCategory ? categories.filter((c) => c.parentId === selectedTopCategory.id) : []),
    [categories, selectedTopCategory],
  );

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    if (cat && INCOMPRESSIBLE_CATEGORY_NAMES.has(cat.name)) {
      setKind('fixed');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!numAmount || numAmount <= 0) {
      setError('Indiquez un montant valide.');
      return;
    }
    if (!activeCategoryId) {
      setError('Choisissez une catégorie.');
      return;
    }
    const desc = description.trim() || categories.find((c) => c.id === activeCategoryId)?.name || 'Transaction';

    const payload = {
      type,
      amount: numAmount,
      description: desc,
      date,
      categoryId: activeCategoryId,
      kind,
      isRecurring: type === 'expense' ? isRecurring : false,
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, payload);
    } else {
      addTransaction(payload);
    }
    onClose();
  }

  function handleDelete() {
    if (editTransaction) {
      deleteTransaction(editTransaction.id);
      onClose();
    }
  }

  return (
    <Modal title={editTransaction ? 'Modifier la transaction' : 'Nouvelle transaction'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              type === 'expense' ? 'bg-rose-500/90 text-white' : 'text-slate-400'
            }`}
          >
            Dépense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              type === 'income' ? 'bg-emerald-500/90 text-white' : 'text-slate-400'
            }`}
          >
            Revenu
          </button>
        </div>

        <div>
          <label htmlFor="amount" className="mb-1 block text-xs font-medium text-slate-400">
            Montant (€)
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-2xl font-bold text-slate-100 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Catégorie</label>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  activeCategoryId === c.id
                    ? 'border-transparent text-white'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
                style={activeCategoryId === c.id ? { backgroundColor: c.color } : undefined}
              >
                <span>{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {subcategories.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Sous-catégorie (optionnel)</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId(selectedTopCategory!.id)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeCategoryId === selectedTopCategory?.id
                    ? 'border-transparent bg-slate-600 text-white'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                Aucune
              </button>
              {subcategories.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setCategoryId(s.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    activeCategoryId === s.id ? 'border-transparent bg-slate-600 text-white' : 'border-slate-700 text-slate-400'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="description" className="mb-1 block text-xs font-medium text-slate-400">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionnel"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="date" className="mb-1 block text-xs font-medium text-slate-400">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">
            {type === 'expense' ? 'Nature de la dépense' : 'Nature du revenu'}
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setKind('fixed')}
              className={`rounded-lg py-2 text-xs font-medium ${kind === 'fixed' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
            >
              {type === 'expense' ? 'Fixe (incompressible)' : 'Fixe (salaire)'}
            </button>
            <button
              type="button"
              onClick={() => setKind('variable')}
              className={`rounded-lg py-2 text-xs font-medium ${kind === 'variable' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
            >
              {type === 'expense' ? 'Variable' : 'Variable (freelance…)'}
            </button>
          </div>
        </div>

        {type === 'expense' && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-emerald-500"
            />
            Dépense récurrente (abonnement, service…)
          </label>
        )}

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="mt-1 flex gap-2">
          {editTransaction && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl border border-rose-800 px-4 py-3 text-sm font-medium text-rose-400 hover:bg-rose-950"
            >
              Supprimer
            </button>
          )}
          <button
            type="submit"
            className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            {editTransaction ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
