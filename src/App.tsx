import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { StorageWarningBanner } from './components/StorageWarningBanner';
import { TransactionFormModal } from './components/TransactionFormModal';
import { PlusIcon } from './components/icons';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { AnnualView } from './views/AnnualView';
import { SettingsView } from './views/SettingsView';
import type { Transaction } from './types';

export type ViewId = 'dashboard' | 'transactions' | 'budgets' | 'annual' | 'settings';

function App() {
  const [view, setView] = useState<ViewId>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  function openEdit(t: Transaction) {
    setEditingTransaction(t);
    setShowAddModal(true);
  }

  function closeModal() {
    setShowAddModal(false);
    setEditingTransaction(undefined);
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur">
        <h1 className="text-base font-bold tracking-tight text-slate-100">
          Budget <span className="text-emerald-400">Mensuel</span>
        </h1>
      </header>

      <StorageWarningBanner />

      <main className="mx-auto max-w-lg px-4 pt-4">
        {view === 'dashboard' && <DashboardView month={month} onMonthChange={setMonth} onEditTransaction={openEdit} />}
        {view === 'transactions' && <TransactionsView month={month} onMonthChange={setMonth} onEditTransaction={openEdit} />}
        {view === 'budgets' && <BudgetsView month={month} onMonthChange={setMonth} />}
        {view === 'annual' && <AnnualView />}
        {view === 'settings' && <SettingsView />}
      </main>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        aria-label="Ajouter une transaction"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
      >
        <PlusIcon width={26} height={26} strokeWidth={2.3} />
      </button>

      <BottomNav active={view} onChange={setView} />

      {showAddModal && <TransactionFormModal editTransaction={editingTransaction} onClose={closeModal} />}
    </div>
  );
}

export default App;
