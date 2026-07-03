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
  breadcrumb?: string[];
  actions?: ReactNode;
  children?: ReactNode;
};

/** Cabeçalho de página: título, descrição e ações à direita. */
export function PageHeader({ title, description, breadcrumb, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-5">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <span className="opacity-40">/</span>}
              <span className={index === breadcrumb.length - 1 ? 'text-foreground' : ''}>{item}</span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[19px] font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-0.5 max-w-2xl text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
