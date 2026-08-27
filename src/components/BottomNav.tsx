import { CalendarIcon, HomeIcon, ListIcon, SettingsIcon, TargetIcon } from './icons';
import type { ViewId } from '../App';

const items: { id: ViewId; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'dashboard', label: 'Accueil', Icon: HomeIcon },
  { id: 'transactions', label: 'Historique', Icon: ListIcon },
  { id: 'budgets', label: 'Budgets', Icon: TargetIcon },
  { id: 'annual', label: 'Année', Icon: CalendarIcon },
  { id: 'settings', label: 'Réglages', Icon: SettingsIcon },
];

export function BottomNav({ active, onChange }: { active: ViewId; onChange: (v: ViewId) => void }) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80 pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigation principale"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {items.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(id)}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon width={22} height={22} strokeWidth={isActive ? 2.1 : 1.7} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
