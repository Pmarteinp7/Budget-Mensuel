import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryBreakdownItem } from '../lib/calculations';
import { formatCurrency } from '../lib/calculations';

export function CategoryPieChart({ items }: { items: CategoryBreakdownItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        Aucune dépense ce mois-ci pour l'instant.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey="total"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {items.map((item) => (
                <Cell key={item.categoryId} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, entry) => [formatCurrency(Number(value)), entry?.payload?.name]}
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: '#e2e8f0' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full flex-1 space-y-1.5">
        {items.map((item) => (
          <li key={item.categoryId} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.icon} {item.name}
            </span>
            <span className="text-slate-400">
              {formatCurrency(item.total)} · <span className="text-slate-500">{item.percent.toFixed(0)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
