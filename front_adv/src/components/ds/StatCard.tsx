import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  hint?: string;
  icon?: LucideIcon;
  onClick?: () => void;
};

/**
 * Indicador compacto do dashboard (único lugar onde "card" é permitido).
 * Estética Aurora: surface sutil, número tabular grande, delta colorido.
 */
export function DsStatCard({ label, value, delta, trend = 'flat', hint, icon: Icon, onClick }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  return (
    <div
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-border bg-surface/60 p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-border-strong',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        {Icon ? (
          <Icon className="h-4 w-4 text-muted-foreground" />
        ) : delta ? (
          <span className={cn('text-[11px] font-medium', trendColor)}>{delta}</span>
        ) : null}
      </div>
      <div className="mt-2.5 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      {(hint || (Icon && delta)) && (
        <div className="mt-1.5 flex items-center gap-2 text-[11.5px]">
          {Icon && delta && <span className={trendColor}>{delta}</span>}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </div>
  );
}
