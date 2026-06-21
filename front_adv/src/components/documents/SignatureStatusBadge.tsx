import { Badge } from '@/components/ui/badge';

type SignatureStatus = 'pending' | 'sent' | 'completed' | 'cancelled';

const STATUS_MAP: Record<SignatureStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/40' },
  sent: { label: 'Enviado', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40' },
  completed: { label: 'Concluído', className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/40' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800' },
};

export function SignatureStatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as SignatureStatus] ?? { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  );
}
