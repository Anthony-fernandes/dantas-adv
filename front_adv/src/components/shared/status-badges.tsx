import * as React from 'react';
import { Badge } from '@/components/ui/badge';

type Variant = 'default' | 'secondary' | 'destructive' | 'outline';

export function StatusBadge({
  text,
  variant = 'secondary',
  className,
}: {
  text: string | undefined | null;
  variant?: Variant;
  className?: string;
}) {
  if (!text) return null;

  return (
    <Badge variant={variant} className={className}>
      {text}
    </Badge>
  );
}

/* ===============================
   DOMAIN VARIANTS (LAW SYSTEM)
================================ */

export function processStatusVariant(status?: string): Variant {
  const s = (status || '').toLowerCase();

  if (!s) return 'secondary';

  if (['ativo', 'active', 'andamento', 'em_andamento', 'pre_processual'].includes(s)) {
    return 'default';
  }

  if (['encerrado', 'finalizado', 'concluido', 'closed'].includes(s)) {
    return 'secondary';
  }

  if (['arquivado', 'archived'].includes(s)) {
    return 'outline';
  }

  if (['cancelado', 'cancelled', 'suspenso'].includes(s)) {
    return 'destructive';
  }

  return 'secondary';
}

export function probExitoVariant(value?: string): Variant {
  const v = (value || '').toLowerCase();

  if (!v) return 'secondary';

  if (['alta', 'high'].includes(v)) return 'default';
  if (['media', 'medium'].includes(v)) return 'secondary';
  if (['baixa', 'low'].includes(v)) return 'outline';

  return 'secondary';
}

export function deadlinePriorityVariant(value?: string): Variant {
  const v = (value || '').toLowerCase();

  if (!v) return 'secondary';

  if (['urgente', 'alta', 'high'].includes(v)) return 'destructive';
  if (['media', 'medium'].includes(v)) return 'default';
  if (['baixa', 'low'].includes(v)) return 'outline';

  return 'secondary';
}

export function deadlineStatusVariant(value?: string): Variant {
  const v = (value || '').toLowerCase();

  if (!v) return 'secondary';

  if (['pendente', 'open'].includes(v)) return 'default';
  if (['concluido', 'done', 'finalizado'].includes(v)) return 'secondary';
  if (['vencido', 'overdue', 'atrasado'].includes(v)) return 'destructive';

  return 'secondary';
}

export function hearingStatusVariant(value?: string): Variant {
  const v = (value || '').toLowerCase();

  if (!v) return 'secondary';

  if (['agendada', 'scheduled'].includes(v)) return 'default';
  if (['realizada', 'done', 'concluida'].includes(v)) return 'secondary';
  if (['cancelada', 'cancelled'].includes(v)) return 'destructive';
  if (['redesignada', 'rescheduled'].includes(v)) return 'outline';

  return 'secondary';
}

export function hearingModalityVariant(value?: string): Variant {
  const v = (value || '').toLowerCase();

  if (!v) return 'secondary';

  if (['presencial', 'in_person'].includes(v)) return 'default';
  if (['online', 'virtual', 'remota'].includes(v)) return 'outline';
  if (['hibrida', 'hybrid'].includes(v)) return 'secondary';

  return 'secondary';
}
