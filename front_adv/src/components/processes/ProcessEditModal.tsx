import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ProcessForm } from '@/components/processes/ProcessForm';
import {
  buildProcessSubmitPayload,
  type ProcessFormValues,
  type ProcessSelectOption,
} from '@/components/processes/ProcessValidation';
import { useProcessForm } from '@/components/processes/useProcessForm';

type ProcessEditModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  processId?: string | null;
  process?: Record<string, any> | null;
  defaultArea?: string;
  seedCnj?: string;
  clients: ProcessSelectOption[];
  employees: ProcessSelectOption[];
  areas: ProcessSelectOption[];
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: Record<string, unknown>, values: ProcessFormValues) => Promise<void> | void;
};

export function ProcessEditModal({
  open,
  mode,
  processId,
  process,
  defaultArea = 'civel',
  seedCnj = '',
  clients,
  employees,
  areas,
  isSubmitting = false,
  onOpenChange,
  onSave,
}: ProcessEditModalProps) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const {
    values,
    validationErrors,
    isDirty,
    isValid,
    updateField,
    touchField,
    validateBeforeSave,
  } = useProcessForm({
    open,
    mode,
    process,
    defaultArea,
    seedCnj,
  });

  const saveDisabled = isSubmitting || !isValid || (mode === 'edit' && Boolean(processId) && !process);

  useEffect(() => {
    if (!open || !isDirty) return undefined;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, open]);

  function requestClose() {
    if (isSubmitting) return;
    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onOpenChange(false);
  }

  async function handleSave() {
    if (!validateBeforeSave()) {
      // Scroll to first visible error field
      setTimeout(() => {
        const el = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus({ preventScroll: true });
      }, 50);
      return;
    }

    await onSave(
      buildProcessSubmitPayload(values, {
        clients,
        employees,
      }),
      values,
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : requestClose())}>
        <DialogContent className="max-h-[94vh] overflow-hidden p-0 sm:max-w-5xl">
          <div className="flex max-h-[94vh] flex-col">
            <DialogHeader className="border-b border-border/70 bg-background px-6 py-5 text-left">
              <DialogTitle>{mode === 'edit' ? 'Editar processo' : 'Novo processo'}</DialogTitle>
              <DialogDescription>
                Atualize os dados principais do processo.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {mode === 'edit' && processId && !process ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando dados do processo para edição...
                  </div>
                </div>
              ) : (
                <ProcessForm
                  values={values}
                  errors={validationErrors}
                  clients={clients}
                  employees={employees}
                  areas={areas}
                  disabled={isSubmitting}
                  onChange={updateField}
                  onBlur={touchField}
                />
              )}
            </div>

            <div className="border-t border-border/70 bg-background/95 px-6 py-4 backdrop-blur">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={requestClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSave} disabled={saveDisabled}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Salvando...' : mode === 'edit' ? 'Salvar alteracoes' : 'Criar processo'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Descartar alteracoes?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Existem mudancas não salvas neste formulario. Se você sair agora, os ajustes feitos no modal serão descartados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardDialogOpen(false);
                onOpenChange(false);
              }}
            >
              Descartar e fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
