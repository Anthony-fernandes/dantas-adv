import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

import { useCreateProcess } from '@/hooks/useApiData';
import { apiGetAllPages } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { loadWorkspaceStateMap, saveWorkspaceStateItem } from '@/services/workspaceState';
import { invalidateProcessRelatedQueries } from '@/services/processQueryInvalidation';
import { resolvePracticeAreaByCode, type PracticeAreaUiMeta } from '@/lib/practice-area';
import { ProcessForm } from '@/components/processes/ProcessForm';
import { useProcessForm } from '@/components/processes/useProcessForm';
import { buildProcessSubmitPayload } from '@/components/processes/ProcessValidation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ds';

type AreaCatalog = { id: string; name?: string | null; area?: string | null; is_active?: boolean };
type ClientItem = { id: string; name?: string | null; full_name?: string | null; razao_social?: string | null };
type EmployeeItem = { id: string; full_name?: string | null; email?: string | null; is_active?: boolean | null };

/** Tela dedicada de cadastro de processo (separada da listagem e do detalhe). */
export default function ProcessCreatePage() {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const createProcess = useCreateProcess();

  const clientsQuery = useQuery({
    queryKey: ['processes-clients', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<ClientItem>('/clients/'),
  });
  const areasQuery = useQuery({
    queryKey: ['practice-areas-for-process', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<AreaCatalog>('/causes/'),
  });
  const employeesQuery = useQuery({
    queryKey: ['processes-employees', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<EmployeeItem>('/employees/'),
  });
  const practiceAreaUiQuery = useQuery({
    queryKey: ['workspace-state', 'practice_area_ui', activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => loadWorkspaceStateMap<PracticeAreaUiMeta>('practice_area_ui'),
  });

  const clients = clientsQuery.data ?? [];
  const areas = areasQuery.data ?? [];
  const employees = employeesQuery.data ?? [];
  const practiceAreaUiMap = practiceAreaUiQuery.data ?? {};

  const areaOptions = useMemo(() => {
    const active = areas.filter((item) => item.is_active !== false);
    if (active.length === 0) {
      return [
        { value: 'civel', label: 'Direito Civil' },
        { value: 'trabalhista', label: 'Direito Trabalhista' },
        { value: 'criminal', label: 'Direito Penal' },
        { value: 'tributario', label: 'Direito Tributário' },
        { value: 'empresarial', label: 'Direito Empresarial' },
        { value: 'familia', label: 'Direito de Família' },
      ];
    }
    return active.map((area) => {
      const meta = resolvePracticeAreaByCode(area.area, areas, practiceAreaUiMap);
      return { value: meta.code, label: meta.label };
    });
  }, [areas, practiceAreaUiMap]);

  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.is_active !== false)
        .map((e) => ({ value: e.id, label: e.full_name || e.email || 'Responsável' }))
        .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
    [employees],
  );

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: String(c.name || c.full_name || c.razao_social || 'Cliente') })),
    [clients],
  );

  const employeeMap = useMemo(
    () => Object.fromEntries(employeeOptions.map((o) => [o.value, o.label] as const)),
    [employeeOptions],
  );

  const defaultArea = areaOptions[0]?.value || 'civel';
  const form = useProcessForm({ open: true, mode: 'create', defaultArea });

  async function handleSubmit() {
    if (!form.validateBeforeSave()) return;
    const payload = buildProcessSubmitPayload(form.values, { clients: clientOptions, employees: employeeOptions });
    const saved = await createProcess.mutateAsync(payload as any);
    if (form.values.responsibleId) {
      await saveWorkspaceStateItem('process_ui', saved.id, {
        responsibleId: form.values.responsibleId,
        responsibleName: employeeMap[form.values.responsibleId] || '',
      });
    }
    await invalidateProcessRelatedQueries(queryClient, activeTenantId);
    navigate(`/app/processos/${saved.id}`);
  }

  return (
    <div className="animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => navigate('/app/processos')}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Processos
      </Button>

      <PageHeader
        eyebrow="Contencioso"
        title="Novo processo"
        description="Cadastre CNJ, cliente, área, foro, risco e responsável principal."
      />

      <form
        onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
        className="surface-card space-y-6 p-6"
      >
        <ProcessForm
          values={form.values}
          errors={form.errors}
          clients={clientOptions}
          employees={employeeOptions}
          areas={areaOptions}
          disabled={createProcess.isPending}
          onChange={form.updateField}
          onBlur={form.touchField}
        />

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/app/processos')} disabled={createProcess.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createProcess.isPending}>
            {createProcess.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Criar processo
          </Button>
        </div>
      </form>
    </div>
  );
}
