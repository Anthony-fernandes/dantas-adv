import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva('badge-status', {
  variants: {
    variant: {
      default: 'is-neutral',
      active: 'is-active',
      success: 'is-success',
      warning: 'is-warning',
      destructive: 'is-danger',
      info: 'is-active',
      muted: 'is-neutral',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ children, variant, className, dot = true }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      <span className="leading-none">{children}</span>
    </span>
  );
}

export const processStatusVariant = {
  ATIVO: 'active' as const,
  ACTIVE: 'active' as const,
  ENCERRADO: 'muted' as const,
  CLOSED: 'muted' as const,
  SUSPENSO: 'warning' as const,
  SUSPENDED: 'warning' as const,
  ARQUIVADO: 'muted' as const,
  ARCHIVED: 'muted' as const,
};

export const deadlineStatusVariant = {
  PENDENTE: 'warning' as const,
  PENDING: 'warning' as const,
  CONCLUIDO: 'success' as const,
  DONE: 'success' as const,
  ATRASADO: 'destructive' as const,
  OVERDUE: 'destructive' as const,
};

export const deadlinePriorityVariant = {
  BAIXA: 'muted' as const,
  LOW: 'muted' as const,
  MEDIA: 'info' as const,
  MEDIUM: 'info' as const,
  ALTA: 'warning' as const,
  HIGH: 'warning' as const,
  URGENTE: 'destructive' as const,
  URGENT: 'destructive' as const,
};

export const financeStatusVariant = {
  PENDENTE: 'warning' as const,
  PENDING: 'warning' as const,
  PAGO: 'success' as const,
  PAID: 'success' as const,
  ATRASADO: 'destructive' as const,
  OVERDUE: 'destructive' as const,
  CANCELADO: 'muted' as const,
  CANCELLED: 'muted' as const,
  RASCUNHO: 'muted' as const,
  DRAFT: 'muted' as const,
  EMITIDO: 'info' as const,
  ISSUED: 'info' as const,
  VENCIDO: 'destructive' as const,
};

export const probExitoVariant = {
  BAIXA: 'destructive' as const,
  LOW: 'destructive' as const,
  MEDIA: 'warning' as const,
  MEDIUM: 'warning' as const,
  ALTA: 'success' as const,
  HIGH: 'success' as const,
};

export const integrationStatusVariant = {
  CONECTADO: 'success' as const,
  CONNECTED: 'success' as const,
  DESCONECTADO: 'muted' as const,
  DISCONNECTED: 'muted' as const,
  ERRO: 'destructive' as const,
  ERROR: 'destructive' as const,
};

export const clientStatusVariant = {
  ATIVO: 'active' as const,
  ACTIVE: 'active' as const,
  INATIVO: 'muted' as const,
  INACTIVE: 'muted' as const,
  PROSPECTO: 'info' as const,
  PROSPECT: 'info' as const,
};
