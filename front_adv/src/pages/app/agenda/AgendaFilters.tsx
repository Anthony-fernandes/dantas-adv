import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type {
  AgendaClientLookup,
  AgendaEventPriority,
  AgendaEventStatus,
  AgendaEventType,
  AgendaFiltersState,
  AgendaProcessLookup,
  AgendaResponsibleLookup,
} from './types';
import {
  AGENDA_EVENT_TYPE_OPTIONS,
  AGENDA_PRIORITY_OPTIONS,
  AGENDA_STATUS_OPTIONS,
} from './types';

type AgendaFiltersProps = {
  filters: AgendaFiltersState;
  onChange: (next: AgendaFiltersState) => void;
  onClear: () => void;
  clients: AgendaClientLookup[];
  processes: AgendaProcessLookup[];
  responsibles: AgendaResponsibleLookup[];
};

export function AgendaFilters({
  filters,
  onChange,
  onClear,
  clients,
  processes,
  responsibles,
}: AgendaFiltersProps) {
  const updateValue = <K extends keyof AgendaFiltersState>(key: K, value: AgendaFiltersState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const selectClassName = 'h-10 bg-background';

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Tipo do evento</Label>
          <Select value={filters.type} onValueChange={(value) => updateValue('type', value as AgendaEventType | 'all')}>
            <SelectTrigger className={selectClassName}>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {AGENDA_EVENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={filters.status} onValueChange={(value) => updateValue('status', value as AgendaEventStatus | 'all')}>
            <SelectTrigger className={selectClassName}>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {AGENDA_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={filters.priority} onValueChange={(value) => updateValue('priority', value as AgendaEventPriority | 'all')}>
            <SelectTrigger className={selectClassName}>
              <SelectValue placeholder="Todas as prioridades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              {AGENDA_PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={filters.period} onValueChange={(value) => updateValue('period', value as AgendaFiltersState['period'])}>
            <SelectTrigger className={selectClassName}>
              <SelectValue placeholder="Período livre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sem recorte</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Semana atual</SelectItem>
              <SelectItem value="month">Mês atual</SelectItem>
              <SelectItem value="next7">Próximos 7 dias</SelectItem>
              <SelectItem value="overdue">Somente atrasados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Responsável</Label>
          <Select value={filters.responsibleId} onValueChange={(value) => updateValue('responsibleId', value)}>
            <SelectTrigger className={selectClassName}>
              <SelectValue placeholder="Todos os responsáveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {responsibles.map((responsible) => (
                <SelectItem key={responsible.id} value={responsible.id}>
                  {responsible.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={filters.clientId} onValueChange={(value) => updateValue('clientId', value)}>
            <SelectTrigger className={selectClassName}>
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Processo</Label>
          <Select value={filters.processId} onValueChange={(value) => updateValue('processId', value)}>
            <SelectTrigger className={selectClassName}>
              <SelectValue placeholder="Todos os processos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os processos</SelectItem>
              {processes.map((process) => (
                <SelectItem key={process.id} value={process.id}>
                  {process.cnj || process.subject || process.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 md:grid-cols-3">
        <label className="flex items-start gap-3">
          <Checkbox checked={filters.mineOnly} onCheckedChange={(checked) => updateValue('mineOnly', checked === true)} />
          <div className="space-y-1">
            <p className="text-sm font-medium">Apenas meus eventos</p>
            <p className="text-xs text-muted-foreground">Mostra só compromissos do responsável atual.</p>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <Checkbox
            checked={filters.onlyHearings}
            onCheckedChange={(checked) => updateValue('onlyHearings', checked === true)}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Apenas audiências</p>
            <p className="text-xs text-muted-foreground">Foco total nas audiências sincronizadas e futuras.</p>
          </div>
        </label>

        <label className="flex items-start gap-3">
          <Checkbox
            checked={filters.onlyDeadlines}
            onCheckedChange={(checked) => updateValue('onlyDeadlines', checked === true)}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Apenas prazos</p>
            <p className="text-xs text-muted-foreground">Destaca prazos, vencimentos e protocolos do escritório.</p>
          </div>
        </label>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClear}>
          Limpar filtros
        </Button>
      </div>
    </div>
  );
}
