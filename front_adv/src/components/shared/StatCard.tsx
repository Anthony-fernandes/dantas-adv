import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'slate' | 'indigo';

/** Mapeia as cores legadas para as caixas de ícone tonalizadas por token (Navy Trust). */
const palette: Record<StatColor, string> = {
  blue:    'bg-primary/8 text-primary',
  indigo:  'bg-primary/8 text-primary',
  violet:  'bg-primary/8 text-primary',
  emerald: 'bg-success/12 text-success',
  sky:     'bg-info/12 text-info',
  amber:   'bg-warning/15 text-warning',
  rose:    'bg-destructive/12 text-destructive',
  slate:   'bg-muted text-muted-foreground',
};

type Props = {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  color?: StatColor;
  className?: string;
  onClick?: () => void;
};

export function StatCard({ label, value, description, icon: Icon, color = 'blue', className, onClick }: Props) {
  return (
    <div
      className={cn(
        'surface-card flex items-center gap-4 p-5 transition-shadow',
        onClick && 'cursor-pointer hover:shadow-elevated',
        className,
      )}
      onClick={onClick}
    >
      <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-md', palette[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </p>
        {description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
