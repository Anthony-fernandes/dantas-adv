import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'primary' | 'info' | 'success' | 'warning' | 'danger';

const toneClass: Record<BadgeTone, string> = {
  neutral: 'border-border bg-muted text-muted-foreground',
  primary: 'border-primary/25 bg-primary/12 text-primary',
  info: 'border-info/25 bg-info/12 text-info',
  success: 'border-success/25 bg-success/12 text-success',
  warning: 'border-warning/30 bg-warning/14 text-warning',
  danger: 'border-destructive/25 bg-destructive/12 text-destructive',
};

/** Badge de status genérico — pílula compacta com ponto opcional. */
export function StatusBadge({ tone = 'neutral', dot = true, children, className }: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
      toneClass[tone],
      className,
    )}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const priorityTone: Record<string, BadgeTone> = {
  urgente: 'danger',
  alta: 'warning',
  media: 'info',
  média: 'info',
  normal: 'info',
  baixa: 'neutral',
};

const priorityLabel: Record<string, string> = {
  urgente: 'Urgente', alta: 'Alta', media: 'Média', normal: 'Normal', baixa: 'Baixa',
};

/** Badge de prioridade padronizado. */
export function PriorityBadge({ value, className }: { value?: string | null; className?: string }) {
  const key = String(value || 'media').toLowerCase();
  return (
    <StatusBadge tone={priorityTone[key] ?? 'info'} dot className={className}>
      {priorityLabel[key] ?? value ?? 'Média'}
    </StatusBadge>
  );
}
