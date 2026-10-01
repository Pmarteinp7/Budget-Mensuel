import { useMemo, useState } from 'react';
import { Modal } from './Modal';
import { useBudgetStore } from '../store/budgetStore';
import { parseLaBanquePostaleStatement, findLikelyDuplicate, type ParsedStatementTransaction } from '../lib/statementImport';
import { guessCategoryId } from '../lib/categoryGuess';
import { AlertIcon, UploadIcon } from './icons';
import type { TransactionKind } from '../types';

interface ReviewRow extends ParsedStatementTransaction {
  included: boolean;
  categoryId: string;
  kind: TransactionKind;
  isDuplicate: boolean;
}

export function StatementImportModal({ onClose }: { onClose: () => void }) {
  const categories = useBudgetStore((s) => s.categories);
  const transactions = useBudgetStore((s) => s.transactions);
  const addTransaction = useBudgetStore((s) => s.addTransaction);

  const [step, setStep] = useState<'pick' | 'parsing' | 'review'>('pick');
  const [statementYear, setStatementYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    setStep('parsing');
    try {
      const parsed = await parseLaBanquePostaleStatement(file, statementYear);
      if (parsed.length === 0) {
        setError(
          "Aucune opération détectée dans ce PDF. La mise en page ne correspond peut-être pas au format attendu — dites-moi ce qui n'a pas marché et j'ajusterai le parseur.",
        );
        setStep('pick');
        return;
      }
      const reviewRows: ReviewRow[] = parsed.map((p) => {
        const dup = findLikelyDuplicate(p, transactions);
        return {
          ...p,
          included: !dup,
          categoryId: guessCategoryId(p.description, p.type, categories) ?? '',
          kind: 'variable',
          isDuplicate: !!dup,
        };
      });
      setRows(reviewRows);
      setStep('review');
    } catch {
      setError("Impossible de lire ce fichier PDF. Vérifiez qu'il s'agit bien d'un relevé non protégé par mot de passe.");
      setStep('pick');
    }
  }

  function updateRow(id: string, patch: Partial<ReviewRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  const includedCount = rows.filter((r) => r.included).length;

  const categoriesForType = useMemo(
    () => ({
      expense: categories.filter((c) => c.appliesTo === 'expense' && c.parentId === null),
      income: categories.filter((c) => c.appliesTo === 'income' && c.parentId === null),
    }),
    [categories],
  );

  function handleImport() {
    for (const row of rows) {
      if (!row.included) continue;
      addTransaction({
        date: row.date,
        amount: row.amount,
        description: row.description,
        type: row.type,
        categoryId: row.categoryId || categoriesForType[row.type][0]?.id || '',
        kind: row.kind,
        isRecurring: false,
      });
    }
    onClose();
  }

  return (
    <Modal title="Importer un relevé La Banque Postale" onClose={onClose}>
      {step === 'pick' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs leading-relaxed text-slate-400">
            Déposez le PDF de votre relevé. Tout est analysé localement dans votre navigateur — rien n'est envoyé
            ailleurs. Vous pourrez relire et corriger chaque opération avant qu'elle soit ajoutée.
          </p>

          <div>
            <label htmlFor="statement-year" className="mb-1 block text-xs font-medium text-slate-400">
              Année du relevé (si les dates n'indiquent pas l'année)
            </label>
            <input
              id="statement-year"
              type="number"
              value={statementYear}
              onChange={(e) => setStatementYear(Number(e.target.value))}
              className="w-28 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            />
          </div>

          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-8 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200">
            <UploadIcon width={22} height={22} />
            Choisir un fichier PDF
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>

          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>
      )}

      {step === 'parsing' && (
        <div className="flex flex-col items-center gap-3 py-10 text-sm text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
          Analyse du relevé…
        </div>
      )}

      {step === 'review' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {rows.length} opération{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => setRows((rs) => rs.map((r) => ({ ...r, included: !(includedCount === rs.length) })))}
              className="text-emerald-400"
            >
              {includedCount === rows.length ? 'Tout décocher' : 'Tout cocher'}
            </button>
          </div>

          <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
            {rows.map((row) => (
              <div
                key={row.id}
                className={`rounded-xl border p-3 ${
                  row.isDuplicate ? 'border-amber-800/60 bg-amber-950/10' : 'border-slate-800 bg-slate-900/40'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={row.included}
                    onChange={(e) => updateRow(row.id, { included: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 accent-emerald-500"
                  />
                  <div className="flex-1">
                    {row.isDuplicate && (
                      <p className="mb-1 flex items-center gap-1 text-[11px] text-amber-400">
                        <AlertIcon width={12} height={12} />
                        Ressemble à une opération déjà enregistrée — décochée par défaut
                      </p>
                    )}
                    {row.confidence === 'low' && (
                      <p className="mb-1 text-[11px] text-amber-400">
                        Type (revenu/dépense) incertain, vérifiez
                      </p>
                    )}
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => updateRow(row.id, { date: e.target.value })}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={row.amount}
                        onChange={(e) => updateRow(row.id, { amount: parseFloat(e.target.value) || 0 })}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
                      />
                      <select
                        value={row.type}
                        onChange={(e) => {
                          const type = e.target.value as 'income' | 'expense';
                          updateRow(row.id, {
                            type,
                            categoryId: guessCategoryId(row.description, type, categories) ?? '',
                          });
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
                      >
                        <option value="expense">Dépense</option>
                        <option value="income">Revenu</option>
                      </select>
                      <select
                        value={row.categoryId}
                        onChange={(e) => updateRow(row.id, { categoryId: e.target.value })}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-100"
                      >
                        {categoriesForType[row.type].map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={includedCount === 0}
            className="rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            Importer {includedCount} opération{includedCount > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </Modal>
  );
}
