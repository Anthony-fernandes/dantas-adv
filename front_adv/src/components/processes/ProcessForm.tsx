import type { ReactNode } from 'react';
import { BriefcaseBusiness, Scale, ShieldCheck } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProcessFormSection } from '@/components/processes/ProcessFormSection';
import { CurrencyInput } from '@/components/processes/CurrencyInput';
import {
  ensureOptionAvailability,
  PROCESS_PHASE_OPTIONS,
  PROCESS_PROBABILITY_OPTIONS,
  PROCESS_STATUS_OPTIONS,
  type ProcessFormErrors,
  type ProcessFormValues,
  type ProcessSelectOption,
  formatCnjValue,
} from '@/components/processes/ProcessValidation';
import { cn } from '@/lib/utils';

type ProcessFormProps = {
  values: ProcessFormValues;
  errors: ProcessFormErrors;
  clients: ProcessSelectOption[];
  employees: ProcessSelectOption[];
  areas: ProcessSelectOption[];
  disabled?: boolean;
  onChange: <K extends keyof ProcessFormValues>(field: K, value: ProcessFormValues[K]) => void;
  onBlur: <K extends keyof ProcessFormValues>(field: K) => void;
};

function ensureLookupSelection(
  options: ProcessSelectOption[],
  currentValue: string,
  fallbackLabel: string,
) {
  if (!currentValue || options.some((option) => option.value === currentValue)) {
    return options;
  }

  return [
    { value: currentValue, label: fallbackLabel },
    ...options,
  ];
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function fieldClassName(error?: string) {
  return cn(
    'transition-colors',
    error && 'border-destructive focus-visible:ring-destructive',
  );
}

export function ProcessForm({
  values,
  errors,
  clients,
  employees,
  areas,
  disabled,
  onChange,
  onBlur,
}: ProcessFormProps) {
  const clientOptions = ensureLookupSelection(clients, values.clientId, 'Cliente vinculado');
  const employeeOptions = ensureLookupSelection(employees, values.responsibleId, 'Responsavel atual');
  const areaOptions = ensureOptionAvailability(areas, values.area);
  const statusOptions = ensureOptionAvailability(PROCESS_STATUS_OPTIONS, values.status);
  const phaseOptions = ensureOptionAvailability(PROCESS_PHASE_OPTIONS, values.phase);
  const probabilityOptions = ensureOptionAvailability(PROCESS_PROBABILITY_OPTIONS, values.probability);

  return (
    <div className="space-y-5">
      <ProcessFormSection
        icon={Scale}
        title="Identificacao"
        description="Dados centrais para localizar o processo e manter a ficha juridica consistente entre as telas."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Numero CNJ" required error={errors.cnj}>
            <Input
              value={values.cnj}
              disabled={disabled}
              placeholder="0000000-00.0000.0.00.0000"
              aria-invalid={Boolean(errors.cnj)}
              className={fieldClassName(errors.cnj)}
              onBlur={() => onBlur('cnj')}
              onChange={(event) => onChange('cnj', formatCnjValue(event.target.value))}
            />
          </Field>

          <Field label="Cliente">
            <Select
              value={values.clientId || '__none'}
              disabled={disabled}
              onValueChange={(value) => {
                onChange('clientId', value === '__none' ? '' : value);
                onBlur('clientId');
              }}
            >
              <SelectTrigger className={fieldClassName(errors.clientId)}>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Sem cliente</SelectItem>
                {clientOptions.map((client) => (
                  <SelectItem key={client.value} value={client.value}>
                    {client.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Parte contraria">
            <Input
              value={values.parteContraria}
              disabled={disabled}
              placeholder="Nome da parte contraria"
              onBlur={() => onBlur('parteContraria')}
              onChange={(event) => onChange('parteContraria', event.target.value)}
            />
          </Field>

          <Field label="Polo ativo">
            <Input
              value={values.poloAtivo}
              disabled={disabled}
              placeholder="Parte autora ou representada"
              onBlur={() => onBlur('poloAtivo')}
              onChange={(event) => onChange('poloAtivo', event.target.value)}
            />
          </Field>

          <Field label="Classe">
            <Input
              value={values.className}
              disabled={disabled}
              placeholder="Ex.: Acao de cobranca"
              onBlur={() => onBlur('className')}
              onChange={(event) => onChange('className', event.target.value)}
            />
          </Field>

          <Field label="Assunto" className="md:col-span-2">
            <Input
              value={values.subject}
              disabled={disabled}
              placeholder="Tema principal do processo"
              onBlur={() => onBlur('subject')}
              onChange={(event) => onChange('subject', event.target.value)}
            />
          </Field>
        </div>
      </ProcessFormSection>

      <ProcessFormSection
        icon={ShieldCheck}
        title="Classificacao juridica"
        description="Informacoes usadas em filtros, indicadores e futuras integracoes com API e automacoes do sistema."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Area" required error={errors.area}>
            <Select
              value={values.area}
              disabled={disabled}
              onValueChange={(value) => {
                onChange('area', value);
                onBlur('area');
              }}
            >
              <SelectTrigger className={fieldClassName(errors.area)}>
                <SelectValue placeholder="Selecione a area" />
              </SelectTrigger>
              <SelectContent>
                {areaOptions.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Tribunal">
            <Input
              value={values.court}
              disabled={disabled}
              placeholder="Ex.: TJCE, TRT 7, TRF5"
              onBlur={() => onBlur('court')}
              onChange={(event) => onChange('court', event.target.value)}
            />
          </Field>

          <Field label="Vara">
            <Input
              value={values.courtDivision}
              disabled={disabled}
              placeholder="Ex.: 3a Vara Civel"
              onBlur={() => onBlur('courtDivision')}
              onChange={(event) => onChange('courtDivision', event.target.value)}
            />
          </Field>

          <Field label="Fase" required error={errors.phase}>
            <Select
              value={values.phase}
              disabled={disabled}
              onValueChange={(value) => {
                onChange('phase', value);
                onBlur('phase');
              }}
            >
              <SelectTrigger className={fieldClassName(errors.phase)}>
                <SelectValue placeholder="Selecione a fase" />
              </SelectTrigger>
              <SelectContent>
                {phaseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Status" required error={errors.status}>
            <Select
              value={values.status}
              disabled={disabled}
              onValueChange={(value) => {
                onChange('status', value);
                onBlur('status');
              }}
            >
              <SelectTrigger className={fieldClassName(errors.status)}>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Probabilidade de exito">
            <Select
              value={values.probability}
              disabled={disabled}
              onValueChange={(value) => {
                onChange('probability', value);
                onBlur('probability');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a probabilidade" />
              </SelectTrigger>
              <SelectContent>
                {probabilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </ProcessFormSection>

      <ProcessFormSection
        icon={BriefcaseBusiness}
        title="Gestao interna"
        description="Controle interno e financeiro do processo."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Advogado responsavel">
            <Select
              value={values.responsibleId || '__none'}
              disabled={disabled}
              onValueChange={(value) => {
                onChange('responsibleId', value === '__none' ? '' : value);
                onBlur('responsibleId');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Definir depois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Definir depois</SelectItem>
                {employeeOptions.map((employee) => (
                  <SelectItem key={employee.value} value={employee.value}>
                    {employee.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Valor da causa" error={errors.causeValue}>
            <CurrencyInput
              value={values.causeValue}
              disabled={disabled}
              placeholder="R$ 0,00"
              className={fieldClassName(errors.causeValue)}
              aria-invalid={Boolean(errors.causeValue)}
              onBlur={() => onBlur('causeValue')}
              onValueChange={(value) => onChange('causeValue', value)}
            />
          </Field>

          <Field label="Observacoes" className="md:col-span-2">
            <Textarea
              rows={5}
              value={values.observations}
              disabled={disabled}
              placeholder="Contexto juridico, estrategia, ponto de atencao ou resumo relevante para o time."
              onBlur={() => onBlur('observations')}
              onChange={(event) => onChange('observations', event.target.value)}
            />
          </Field>
        </div>
      </ProcessFormSection>
    </div>
  );
}
