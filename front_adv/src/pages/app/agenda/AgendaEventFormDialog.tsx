import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type {
  AgendaClientLookup,
  AgendaEventFormState,
  AgendaProcessLookup,
  AgendaResponsibleLookup,
} from './types';
import {
  AGENDA_EVENT_TYPE_OPTIONS,
  AGENDA_PRIORITY_OPTIONS,
  AGENDA_RECURRENCE_OPTIONS,
  AGENDA_REMINDER_OPTIONS,
  AGENDA_STATUS_OPTIONS,
} from './types';

type AgendaEventFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AgendaEventFormState;
  onFormChange: (next: AgendaEventFormState) => void;
  onSave: () => void;
  onSaveAndCreateAnother: () => void;
  isSaving: boolean;
  mode: 'create' | 'edit' | 'duplicate';
  clients: AgendaClientLookup[];
  processes: AgendaProcessLookup[];
  responsibles: AgendaResponsibleLookup[];
};

export function AgendaEventFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSave,
  onSaveAndCreateAnother,
  isSaving,
  mode,
  clients,
  processes,
  responsibles,
}: AgendaEventFormDialogProps) {
  const updateField = <K extends keyof AgendaEventFormState>(key: K, value: AgendaEventFormState[K]) => {
    onFormChange({ ...form, [key]: value });
  };

  const title =
    mode === 'edit' ? 'Editar evento' : mode === 'duplicate' ? 'Duplicar evento' : 'Novo evento jurídico';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden p-0">
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Estruture compromissos jurídicos com tipo, prioridade, responsável, vínculos e informações operacionais.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <section className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr_1fr]">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => updateField('title', event.target.value)}
                    placeholder="Ex: Audiência de instrução do processo..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo do evento</Label>
                  <Select value={form.type} onValueChange={(value) => updateField('type', value as AgendaEventFormState['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENDA_EVENT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(value) => updateField('priority', value as AgendaEventFormState['priority'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENDA_PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Hora inicial</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    disabled={form.allDay}
                    onChange={(event) => updateField('startTime', event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hora final</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    disabled={form.allDay}
                    onChange={(event) => updateField('endTime', event.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-background px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Dia inteiro</p>
                    <p className="text-xs text-muted-foreground">Oculta os campos de horario.</p>
                  </div>
                  <Switch checked={form.allDay} onCheckedChange={(checked) => updateField('allDay', checked)} />
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={form.responsibleId || '__none'} onValueChange={(value) => updateField('responsibleId', value === '__none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Não vincular</SelectItem>
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
                <Select value={form.clientId || '__none'} onValueChange={(value) => updateField('clientId', value === '__none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Não vincular</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Processo</Label>
                <Select value={form.processId || '__none'} onValueChange={(value) => updateField('processId', value === '__none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o processo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Não vincular</SelectItem>
                    {processes.map((process) => (
                      <SelectItem key={process.id} value={process.id}>
                        {process.cnj || process.subject || process.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => updateField('status', value as AgendaEventFormState['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENDA_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Local</Label>
                <Input value={form.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Fórum, meet, escritório..." />
              </div>

              <div className="space-y-2">
                <Label>Lembrete</Label>
                <Select value={form.reminder} onValueChange={(value) => updateField('reminder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENDA_REMINDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recorrencia</Label>
                <Select value={form.recurrence} onValueChange={(value) => updateField('recurrence', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENDA_RECURRENCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Tribunal</Label>
                <Input value={form.court} onChange={(event) => updateField('court', event.target.value)} placeholder="Ex: TJSP" />
              </div>
              <div className="space-y-2">
                <Label>Vara</Label>
                <Input value={form.branch} onChange={(event) => updateField('branch', event.target.value)} placeholder="Ex: 1a Vara Civel" />
              </div>
              <div className="space-y-2">
                <Label>Comarca</Label>
                <Input value={form.district} onChange={(event) => updateField('district', event.target.value)} placeholder="Ex: Sao Paulo/SP" />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Descreva o objetivo do compromisso, contexto jurídico e pontos críticos."
                />
              </div>

              <div className="space-y-2">
                <Label>Observações operacionais</Label>
                <Textarea
                  rows={4}
                  value={form.observations}
                  onChange={(event) => updateField('observations', event.target.value)}
                  placeholder="Documentos, pauta, diligencias, orientacoes internas..."
                />
              </div>
            </section>

            <section className="space-y-2">
              <Label>Link de videoconferência</Label>
              <Input
                value={form.videoLink}
                onChange={(event) => updateField('videoLink', event.target.value)}
                placeholder="https://meet.google.com/... ou link do tribunal"
              />
            </section>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={onSaveAndCreateAnother} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar e criar outro'}
            </Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : mode === 'edit' ? 'Salvar alterações' : 'Salvar evento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
