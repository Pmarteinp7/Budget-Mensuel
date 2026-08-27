import { useState } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import type { TransactionType } from '../types';
import { PlusIcon, TrashIcon } from './icons';

const SWATCHES = [
  '#6366f1', '#f59e0b', '#0ea5e9', '#a855f7', '#ec4899',
  '#10b981', '#f97316', '#14b8a6', '#64748b', '#22c55e',
  '#ef4444', '#eab308',
];

export function CategoryManager() {
  const [type, setType] = useState<TransactionType>('expense');
  const categories = useBudgetStore((s) => s.categories);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const deleteCategory = useBudgetStore((s) => s.deleteCategory);

  const topLevel = categories.filter((c) => c.appliesTo === type && c.parentId === null);
  const fallback = topLevel.find((c) => c.name === 'Autres') ?? topLevel[0];

  const [name, setName] = useState('');
  const [color, setColor] = useState(SWATCHES[0]);
  const [parentId, setParentId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({
      name: name.trim(),
      color,
      icon: parentId ? '' : '🏷️',
      parentId: parentId || null,
      appliesTo: type,
    });
    setName('');
    setColor(SWATCHES[0]);
    setParentId('');
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (!fallback) return;
    if (id === fallback.id) return;
    deleteCategory(id, fallback.id);
  }

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-800 p-1">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`rounded-lg py-2 text-xs font-semibold ${type === 'expense' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
        >
          Catégories de dépenses
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`rounded-lg py-2 text-xs font-semibold ${type === 'income' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
        >
          Catégories de revenus
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {topLevel.map((c) => {
          const subs = categories.filter((s) => s.parentId === c.id);
          return (
            <li key={c.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.icon} {c.name}
                  {c.isDefault && <span className="text-[10px] text-slate-500">(par défaut)</span>}
                </span>
                {!c.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-slate-600 hover:text-rose-400"
                    aria-label={`Supprimer ${c.name}`}
                  >
                    <TrashIcon width={14} height={14} />
                  </button>
                )}
              </div>
              {subs.length > 0 && (
                <ul className="mt-1.5 ml-4 flex flex-col gap-1 border-l border-slate-800 pl-3">
                  {subs.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                      <button type="button" onClick={() => handleDelete(s.id)} className="text-slate-600 hover:text-rose-400">
                        <TrashIcon width={12} height={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {showForm ? (
        <form onSubmit={handleAdd} className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-800 p-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom de la catégorie"
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            autoFocus
          />
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">Catégorie principale</option>
            {topLevel.map((c) => (
              <option key={c.id} value={c.id}>
                Sous-catégorie de {c.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.map((sw) => (
              <button
                type="button"
                key={sw}
                onClick={() => setColor(sw)}
                className={`h-6 w-6 rounded-full ${color === sw ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : ''}`}
                style={{ backgroundColor: sw }}
                aria-label={`Couleur ${sw}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-slate-700 py-2 text-sm text-slate-300"
            >
              Annuler
            </button>
            <button type="submit" className="flex-1 rounded-lg bg-emerald-500 py-2 text-sm font-semibold text-slate-950">
              Ajouter
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 py-2.5 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200"
        >
          <PlusIcon width={16} height={16} /> Nouvelle catégorie
        </button>
      )}
    </div>
  );
}
