import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'success' | 'warning' | 'info' | 'destructive';

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  onClick?: () => void;
};

const toneClass: Record<Tone, string> = {
  default: 'bg-primary/8 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info/12 text-info',
  destructive: 'bg-destructive/12 text-destructive',
};

/**
 * Indicador (StatCard) no padrão Legal Flow Redefined — único lugar onde "card"
 * é permitido. surface-card, label em maiúsculas, valor grande em font-display
 * e caixa de ícone tonalizada.
 */
export function DsStatCard({ label, value, delta, trend = 'flat', hint, icon: Icon, tone = 'default', onClick }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  return (
    <div
      onClick={onClick}
      className={cn('surface-card p-5 transition-shadow', onClick && 'cursor-pointer hover:shadow-elevated')}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn('grid h-8 w-8 place-items-center rounded-md', toneClass[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </p>
      {(hint || delta) && (
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          {delta && <span className={cn('font-medium', trendColor)}>{delta}</span>}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
