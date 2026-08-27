import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { monthLabel, shiftMonth, todayMonthKey } from '../lib/calculations';

export function MonthSwitcher({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  const label = monthLabel(month);
  const isCurrent = month === todayMonthKey();

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-2 py-1.5">
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Mois précédent"
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      >
        <ChevronLeftIcon width={18} height={18} />
      </button>
      <div className="flex flex-col items-center">
        <span className="text-sm font-semibold capitalize text-slate-100">{label}</span>
        {!isCurrent && (
          <button type="button" onClick={() => onChange(todayMonthKey())} className="text-[11px] text-emerald-400">
            revenir au mois en cours
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Mois suivant"
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
      >
        <ChevronRightIcon width={18} height={18} />
      </button>
    </div>
  );
}
