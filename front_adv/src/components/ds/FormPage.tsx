import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Seção de formulário com título e grid responsivo. */
export function FormSection({
  title,
  description,
  children,
  columns = 2,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridCols = columns === 1 ? 'md:grid-cols-1' : columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold tracking-tight text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>}
      </div>
      <div className={cn('grid gap-4', gridCols)}>{children}</div>
    </section>
  );
}

/** Campo de formulário rotulado (label + controle + erro). */
export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-[12.5px] font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[11.5px] text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Rodapé fixo de ações do formulário (cancelar/salvar). */
export function FormFooter({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-2 pt-1">{children}</div>;
}
