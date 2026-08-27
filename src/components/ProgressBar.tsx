export function ProgressBar({ percent, status }: { percent: number; status: 'ok' | 'warning' | 'over' }) {
  const color = status === 'over' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
}
