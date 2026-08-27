import { useRef, useState } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { CategoryManager } from '../components/CategoryManager';
import { DownloadIcon, UploadIcon } from '../components/icons';
import { todayMonthKey } from '../lib/calculations';
import { exportJSONBackup, exportMonthCSV, parseJSONBackup } from '../lib/exportImport';

export function SettingsView() {
  const transactions = useBudgetStore((s) => s.transactions);
  const categories = useBudgetStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const savingsGoals = useBudgetStore((s) => s.savingsGoals);
  const importData = useBudgetStore((s) => s.importData);
  const resetAll = useBudgetStore((s) => s.resetAll);

  const [exportMonth, setExportMonth] = useState(todayMonthKey());
  const [importMessage, setImportMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePDFExport() {
    setGeneratingPdf(true);
    try {
      const { exportMonthPDF } = await import('../lib/pdfExport');
      exportMonthPDF(exportMonth, transactions, categories);
    } finally {
      setGeneratingPdf(false);
    }
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = parseJSONBackup(String(reader.result));
        importData(data);
        setImportMessage({ type: 'ok', text: `Sauvegarde restaurée (${data.transactions.length} transactions).` });
      } catch {
        setImportMessage({ type: 'error', text: 'Ce fichier ne semble pas être une sauvegarde valide.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleReset() {
    if (window.confirm('Supprimer toutes les données locales ? Cette action est irréversible.')) {
      resetAll();
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs leading-relaxed text-slate-400">
        <p className="font-semibold text-slate-200">À propos de vos données</p>
        <p className="mt-1">
          Cet outil ne nécessite ni compte ni mot de passe. Tout est enregistré uniquement dans le navigateur de cet
          appareil — rien n'est envoyé à un serveur. Effacer les données de navigation, changer d'appareil ou
          réinstaller le navigateur effacera cet historique : exportez régulièrement une sauvegarde ci-dessous.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Export mensuel</h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <label htmlFor="export-month" className="mb-1 block text-xs text-slate-400">
            Mois à exporter
          </label>
          <input
            id="export-month"
            type="month"
            value={exportMonth}
            onChange={(e) => setExportMonth(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePDFExport}
              disabled={generatingPdf}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              <DownloadIcon width={16} height={16} /> {generatingPdf ? 'Génération…' : 'PDF'}
            </button>
            <button
              type="button"
              onClick={() => exportMonthCSV(exportMonth, transactions, categories)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-200"
            >
              <DownloadIcon width={16} height={16} /> Tableur (CSV)
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Fichier nommé « budget-{exportMonth} » — solde, détail des transactions, répartition par catégorie et
            dépenses réductibles identifiées.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Sauvegarde complète</h2>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <p className="mb-3 text-xs text-slate-400">
            Exportez toutes vos données (transactions, catégories, budgets, objectifs) dans un fichier que vous pourrez
            réimporter si ce navigateur perd son historique.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => exportJSONBackup({ transactions, categories, budgets, savingsGoals })}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-700 py-2.5 text-sm font-semibold text-white"
            >
              <DownloadIcon width={16} height={16} /> Exporter (JSON)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-200"
            >
              <UploadIcon width={16} height={16} /> Importer
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
          {importMessage && (
            <p className={`mt-2 text-xs ${importMessage.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {importMessage.text}
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Catégories</h2>
        <CategoryManager />
      </section>

      <section>
        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-xl border border-rose-900 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-950/40"
        >
          Réinitialiser toutes les données
        </button>
      </section>
    </div>
  );
}
