import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type ProcessFormSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
};

export function ProcessFormSection({
  icon: Icon,
  title,
  description,
  children,
}: ProcessFormSectionProps) {
  return (
    <section className="rounded-3xl border border-border/70 bg-muted/20 p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
