import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-border pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "info" | "destructive" | "muted";
}) {
  const tones: Record<string, string> = {
    default: "bg-primary/8 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/12 text-info",
    destructive: "bg-destructive/12 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">{label}</p>
        {Icon && (
          <div className={`grid h-8 w-8 place-items-center rounded-md ${tones[tone]}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
      {(trend || hint) && (
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          {trend && <span className="font-medium text-success">{trend}</span>}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function StatusPill({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "info" | "destructive" | "muted" }) {
  const tones: Record<string, string> = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/12 text-success border-success/25",
    warning: "bg-warning/18 text-warning-foreground border-warning/40",
    info: "bg-info/12 text-info border-info/25",
    destructive: "bg-destructive/12 text-destructive border-destructive/25",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}