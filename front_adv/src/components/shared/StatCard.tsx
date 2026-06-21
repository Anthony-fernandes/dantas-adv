import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatColor = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'slate' | 'indigo';

const palette: Record<StatColor, { icon: string; glow: string }> = {
  blue:    { icon: 'bg-blue-600 text-white',    glow: 'shadow-blue-100 ring-blue-100' },
  indigo:  { icon: 'bg-indigo-600 text-white',  glow: 'shadow-indigo-100 ring-indigo-100' },
  emerald: { icon: 'bg-emerald-600 text-white', glow: 'shadow-emerald-100 ring-emerald-100' },
  amber:   { icon: 'bg-amber-500 text-white',   glow: 'shadow-amber-100 ring-amber-100' },
  rose:    { icon: 'bg-rose-600 text-white',    glow: 'shadow-rose-100 ring-rose-100' },
  violet:  { icon: 'bg-violet-600 text-white',  glow: 'shadow-violet-100 ring-violet-100' },
  sky:     { icon: 'bg-sky-500 text-white',     glow: 'shadow-sky-100 ring-sky-100' },
  slate:   { icon: 'bg-slate-500 text-white',   glow: 'shadow-slate-100 ring-slate-100' },
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
  const { icon: iconCls, glow } = palette[color];
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition-all duration-150',
        onClick && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
      onClick={onClick}
    >
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ring-4', iconCls, glow)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-0.5 text-3xl font-bold leading-none tracking-tight text-slate-800">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </p>
        {description && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{description}</p>}
      </div>
    </div>
  );
}
