import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Container padrão de uma página do app. */
export function PageLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1600px] px-5 py-5 md:px-7 md:py-6', className)}>
      {children}
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Rótulo pequeno em maiúsculas acima do título. Aceita também breadcrumb (usa o último item). */
  eyebrow?: string;
  breadcrumb?: string[];
  actions?: ReactNode;
  children?: ReactNode;
};

/**
 * Cabeçalho de página no padrão Legal Flow Redefined:
 * eyebrow em maiúsculas, título grande em font-display, descrição e ações,
 * com borda inferior separando do conteúdo.
 */
export function PageHeader({ title, description, eyebrow, breadcrumb, actions, children }: PageHeaderProps) {
  const eyebrowText = eyebrow ?? (breadcrumb && breadcrumb.length > 0 ? breadcrumb[0] : undefined);
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrowText && (
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{eyebrowText}</p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
