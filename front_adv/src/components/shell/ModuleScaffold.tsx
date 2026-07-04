import type { ReactNode, ComponentType } from "react";
import { PageHeader, StatCard } from "./PageHeader";

export function ModuleScaffold({
  eyebrow, title, description, icon: Icon, stats, children, actions,
}: {
  eyebrow: string; title: string; description: string;
  icon: ComponentType<{ className?: string }>;
  stats?: Array<{ label: string; value: string; tone?: any; hint?: string }>;
  children?: ReactNode; actions?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1400px] p-6 md:p-8 space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} />
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} hint={s.hint} icon={Icon} />)}
        </div>
      )}
      {children ?? (
        <div className="surface-card p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/8 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">Módulo pronto para uso</h2>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground max-w-md mx-auto">
            A interface visual deste módulo já está com o novo design system aplicado. Os dados
            reais serão conectados na próxima fase.
          </p>
        </div>
      )}
    </div>
  );
}