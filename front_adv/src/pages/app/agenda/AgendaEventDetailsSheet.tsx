import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Copy, Pencil, RotateCcw, Trash2, CheckCircle2, ExternalLink, CalendarRange } from 'lucide-react';
import { AGENDA_EVENT_TYPE_META } from './types';
import type { AgendaEvent } from './types';
import { formatAgendaEventDateRange, isDeadlineSoon, isEventOverdue } from './utils';

type AgendaEventDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: AgendaEvent | null;
  onEdit: (event: AgendaEvent) => void;
  onDuplicate: (event: AgendaEvent) => void;
  onDeleteRequest: (event: AgendaEvent) => void;
  onMarkAsDone: (event: AgendaEvent) => void;
  onReschedule: (event: AgendaEvent) => void;
  onCopyLink: (event: AgendaEvent) => void;
};

function statusVariant(event: AgendaEvent) {
  if (event.status === 'REALIZADO') return 'success' as const;
  if (event.status === 'CANCELADO') return 'muted' as const;
  if (event.status === 'ATRASADO' || isEventOverdue(event)) return 'destructive' as const;
  if (event.status === 'PENDENTE' || isDeadlineSoon(event)) return 'warning' as const;
  if (event.status === 'CONFIRMADO') return 'info' as const;
  return 'active' as const;
}

function priorityVariant(priority: AgendaEvent['priority']) {
  if (priority === 'URGENTE') return 'destructive' as const;
  if (priority === 'ALTA') return 'warning' as const;
  if (priority === 'MEDIA') return 'info' as const;
  return 'muted' as const;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="max-w-[65%] text-right text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function AgendaEventDetailsSheet({
  open,
  onOpenChange,
  event,
  onEdit,
  onDuplicate,
  onDeleteRequest,
  onMarkAsDone,
  onReschedule,
  onCopyLink,
}: AgendaEventDetailsSheetProps) {
  if (!event) {
    return <Sheet open={open} onOpenChange={onOpenChange} />;
  }

  const typeMeta = AGENDA_EVENT_TYPE_META[event.type];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="space-y-4 border-b pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ backgroundColor: typeMeta.surface, color: typeMeta.color }}
            >
              {typeMeta.label}
            </span>
            <StatusBadge variant={statusVariant(event)} dot={false}>
              {event.status}
            </StatusBadge>
            <StatusBadge variant={priorityVariant(event.priority)} dot={false}>
              {event.priority}
            </StatusBadge>
          </div>

          <div className="space-y-2">
            <SheetTitle className="text-2xl leading-tight">{event.title}</SheetTitle>
            <SheetDescription>{formatAgendaEventDateRange(event)}</SheetDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onEdit(event)} disabled={!event.editable}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" onClick={() => onDuplicate(event)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </Button>
            <Button variant="outline" onClick={() => onMarkAsDone(event)} disabled={event.status === 'REALIZADO'}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marcar como realizado
            </Button>
            <Button variant="outline" onClick={() => onReschedule(event)}>
              <CalendarRange className="mr-2 h-4 w-4" />
              Remarcar
            </Button>
            {event.videoLink ? (
              <Button variant="outline" onClick={() => onCopyLink(event)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Copiar link
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => onDeleteRequest(event)} disabled={!event.deletable}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </div>

          {!event.editable ? (
            <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Este item está sincronizado com outra origem do sistema. A personalização fica disponível na agenda, mas a edição estrutural pode depender do módulo de origem.
            </div>
          ) : null}
        </SheetHeader>

        <div className="space-y-6 py-6">
          {event.description ? (
            <section className="rounded-2xl border bg-muted/20 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Descrição</p>
              <p className="text-sm leading-7 text-foreground/90">{event.description}</p>
            </section>
          ) : null}

          <section className="rounded-2xl border bg-background">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Contexto do compromisso</p>
            </div>
            <div className="divide-y px-4">
              <DetailRow label="Cliente" value={event.clientName} />
              <DetailRow label="Processo" value={event.processNumber || event.processLabel} />
              <DetailRow label="Responsável" value={event.responsibleName} />
              <DetailRow label="Local" value={event.location} />
              <DetailRow label="Tribunal" value={event.court} />
              <DetailRow label="Vara" value={event.branch} />
              <DetailRow label="Comarca" value={event.district} />
              <DetailRow label="Link de reunião" value={event.videoLink} />
              <DetailRow label="Lembrete" value={event.reminder} />
              <DetailRow label="Recorrencia" value={event.recurrence} />
              <DetailRow label="Origem" value={event.sourceLabel} />
            </div>
          </section>

          {event.observations ? (
            <section className="rounded-2xl border bg-muted/20 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Observações</p>
              <p className="text-sm leading-7 text-foreground/90">{event.observations}</p>
            </section>
          ) : null}

          <section className="rounded-2xl border bg-background">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Histórico básico</p>
            </div>
            <div className="space-y-3 px-4 py-4">
              {event.history.map((entry, index) => (
                <div key={`${entry}-${index}`} className="rounded-xl border bg-muted/20 px-3 py-3 text-sm text-foreground/85">
                  {entry}
                </div>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
