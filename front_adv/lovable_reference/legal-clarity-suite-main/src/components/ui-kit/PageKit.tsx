import type { ReactNode } from "react";

export function Kpi({ label, value, trend, hint }: { label: string; value: ReactNode; trend?: string; hint?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {(trend || hint) && (
        <div className="flex items-center gap-2 text-[11px] mt-1">
          {trend && <span className="font-mono-ui text-success">{trend}</span>}
          {hint && <span className="text-ink-soft">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-xl">{children}</h2>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card-flat ${className}`}>{children}</div>;
}

export function CardHeader({ title, action, eyebrow }: { title: string; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="px-5 py-4 rule-b flex items-center justify-between bg-surface-2/50">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <div className="font-display text-base">{title}</div>
      </div>
      {action}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "active" | "success" | "warning" | "danger" | "dark" }) {
  return <span className={`badge-status is-${tone}`}>{children}</span>;
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 mb-4">{children}</div>;
}

export function FilterChip({ children, active }: { children: ReactNode; active?: boolean }) {
  return (
    <button className={`px-3 h-8 text-[12px] rounded-md border transition-colors ${active ? "bg-ink text-paper border-ink" : "bg-surface border-rule hover:bg-paper"}`}>
      {children}
    </button>
  );
}

export function Tabs({ items, active }: { items: string[]; active: string }) {
  return (
    <div className="flex border-b border-rule mb-6 overflow-x-auto">
      {items.map((it) => (
        <button key={it} className={`px-4 py-2.5 text-[12px] font-mono-ui uppercase tracking-widest border-b-2 -mb-px transition-colors ${it === active ? "border-gold text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}>
          {it}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card-flat p-12 text-center">
      <div className="size-14 mx-auto mb-4 rounded-full bg-paper border border-rule grid place-items-center font-display italic text-2xl text-ink-soft">∅</div>
      <div className="font-display text-2xl mb-1">{title}</div>
      {hint && <p className="text-sm text-ink-soft max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
