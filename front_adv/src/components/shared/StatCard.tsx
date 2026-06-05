import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; label: string };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}

const variantStyles: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'text-foreground',
  primary: 'text-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
};

const iconBgStyles: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'border-border bg-muted/45',
  primary: 'border-border bg-accent/65',
  success: 'border-success/20 bg-success/10',
  warning: 'border-warning/20 bg-warning/10',
  destructive: 'border-destructive/20 bg-destructive/10',
  info: 'border-info/20 bg-info/10',
};

export function StatCard({ title, value, icon: Icon, description, trend, variant = 'default' }: StatCardProps) {
  const trendPrefix = trend ? (trend.value >= 0 ? '+' : '-') : '';

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="kpi-label">{title}</p>
          <p className={cn('font-display text-[2.2rem] font-semibold leading-none', variantStyles[variant])}>
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
        </div>

        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-md border', iconBgStyles[variant])}>
          <Icon className={cn('h-5 w-5', variantStyles[variant])} />
        </div>
      </div>

      {description || trend ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
          {trend ? (
            <span
              className={cn(
                'font-mono-ui font-medium uppercase tracking-[0.12em]',
                trend.value >= 0 ? 'text-success' : 'text-destructive',
              )}
            >
              {trendPrefix}
              {Math.abs(trend.value)}%
              {trend.label ? ` ${trend.label}` : ''}
            </span>
          ) : null}
          {description ? <span className="text-muted-foreground">{description}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
