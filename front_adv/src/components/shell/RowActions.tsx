import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormDialog } from "@/components/shell/FormDialog";
import type { FieldDef } from "@/components/shell/RecordScaffold";
import { useUpdate, useRemove } from "@/lib/resources";

/**
 * Menu de ações da linha (Editar em pop-up + Excluir com confirmação).
 * Reaproveita FormDialog para edição, com os mesmos campos do cadastro.
 */
export function RowActions({
  resource,
  id,
  editTitle,
  fields,
  initial,
  buildPayload,
  invalidate = [],
  deleteLabel = "Excluir registro",
  onDone,
}: {
  resource: string;
  id: string;
  editTitle: string;
  fields: FieldDef[];
  initial: Record<string, string>;
  buildPayload: (values: Record<string, string>) => Record<string, unknown>;
  invalidate?: string[];
  deleteLabel?: string;
  onDone?: () => void;
}) {
  const update = useUpdate<any>(resource, invalidate);
  const remove = useRemove(resource, invalidate);
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button aria-label="Ações" className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted transition">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditOpen(true); }}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => { e.preventDefault(); setDelOpen(true); }}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editTitle}
        submitLabel="Salvar alterações"
        fields={fields}
        initial={initial}
        onSubmit={async (v) => {
          try {
            await update.mutateAsync({ id, ...buildPayload(v) });
            toast.success("Alterações salvas.");
            setEditOpen(false);
            onDone?.();
          } catch (err: any) {
            toast.error(err?.detail || "Não foi possível salvar as alterações.");
          }
        }}
      />

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await remove.mutateAsync(id);
                  toast.success("Registro excluído.");
                  setDelOpen(false);
                  onDone?.();
                } catch (err: any) {
                  toast.error(err?.detail || "Não foi possível excluir.");
                }
              }}
            >
              {remove.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
