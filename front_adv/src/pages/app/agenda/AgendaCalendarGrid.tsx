import { format, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AGENDA_EVENT_TYPE_META } from './types';
import type { AgendaEvent } from './types';
import { formatAgendaEventTimeLabel, isDeadlineSoon, isEventOverdue } from './utils';

type AgendaCalendarGridProps = {
  days: Date[];
  currentDate: Date;
  selectedDate: Date | null;
  eventsByDay: Map<string, AgendaEvent[]>;
  onSelectDate: (date: Date) => void;
  onEventClick: (event: AgendaEvent) => void;
  view: 'month' | 'week';
};

function resolveEventPalette(event: AgendaEvent) {
  if (event.status === 'ATRASADO' || isEventOverdue(event)) {
    return {
      backgroundColor: 'rgba(220, 38, 38, 0.10)',
      color: '#dc2626',
    };
  }

  if (event.type === 'PRAZO_PROCESSUAL' || event.type === 'VENCIMENTO' || isDeadlineSoon(event)) {
    return {
      backgroundColor: 'rgba(234, 88, 12, 0.10)',
      color: '#ea580c',
    };
  }

  if (event.type === 'REUNIAO_CLIENTE' || event.type === 'CONSULTA') {
    return {
      backgroundColor: 'rgba(37, 99, 235, 0.10)',
      color: '#2563eb',
    };
  }

  const meta = AGENDA_EVENT_TYPE_META[event.type];
  return {
    backgroundColor: meta.surface,
    color: meta.color,
  };
}

function EventChip({ event, onOpen }: { event: AgendaEvent; onOpen: (event: AgendaEvent) => void }) {
  const palette = resolveEventPalette(event);

  return (
    <button
      type="button"
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onOpen(event);
      }}
      className="w-full truncate rounded-md px-2 py-1 text-left text-[12px] leading-tight transition hover:opacity-85"
      style={palette}
      title={event.title}
    >
      <span className="font-mono-ui">{formatAgendaEventTimeLabel(event)}</span> {event.title}
    </button>
  );
}

export function AgendaCalendarGrid({
  days,
  currentDate,
  selectedDate,
  eventsByDay,
  onSelectDate,
  onEventClick,
  view,
}: AgendaCalendarGridProps) {
  const visibleLimit = view === 'month' ? 3 : 6;

  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((label) => (
          <div
            key={label}
            className="border-r border-border px-4 py-3 font-mono-ui text-[10px] uppercase tracking-[0.18em] text-muted-foreground last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const key = format(day, 'yyyy-MM-dd');
          const events = eventsByDay.get(key) ?? [];
          const outsideMonth = view === 'month' && !isSameMonth(day, currentDate);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isLastColumn = index % 7 === 6;
          const isLastRow = index >= days.length - 7;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                'flex min-h-[150px] flex-col items-start gap-2 px-3 py-3 text-left transition-colors md:min-h-[170px]',
                !isLastColumn && 'border-r border-border',
                !isLastRow && 'border-b border-border',
                outsideMonth ? 'bg-surface-2/25 text-muted-foreground' : 'bg-card',
                isSelected && 'bg-accent/25',
                view === 'week' && 'min-h-[200px]',
              )}
            >
              <span
                className={cn(
                  'font-mono-ui text-[13px] leading-none',
                  outsideMonth ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {format(day, 'd', { locale: ptBR })}
              </span>

              <div className="flex w-full flex-col gap-2">
                {events.slice(0, visibleLimit).map((event) => (
                  <EventChip key={event.id} event={event} onOpen={onEventClick} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
