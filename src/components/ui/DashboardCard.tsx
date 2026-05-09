interface DashboardCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function DashboardCard({ label, value, hint }: DashboardCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-text-primary">{value}</p>
      {hint && <p className="mt-2 text-xs text-text-secondary">{hint}</p>}
    </article>
  );
}
