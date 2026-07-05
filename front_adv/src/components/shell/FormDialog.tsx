import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FieldControl, type FieldDef, type FieldOption } from "./RecordScaffold";

function optionValue(o: FieldOption) {
  return typeof o === "string" ? o : o.value;
}

function initialValues(fields: FieldDef[], initial?: Record<string, string>) {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      initial?.[f.name] ??
        f.defaultValue ??
        (f.type === "select" && f.options?.length ? optionValue(f.options[0]) : ""),
    ]),
  );
}

/**
 * Formulário em pop-up (modal) reutilizável — mesmo estilo Navy Trust dos
 * cadastros em página, porém dentro de um Dialog. Recebe a mesma API de
 * `fields`/`onSubmit` usada pelo RecordForm.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSubmit,
  submitLabel = "Salvar",
  initial,
  extra,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  submitLabel?: string;
  initial?: Record<string, string>;
  extra?: ReactNode;
  wide?: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(fields, initial));
  const [submitting, setSubmitting] = useState(false);

  // Reinicia os valores sempre que o modal abre (ou muda o registro em edição).
  useEffect(() => {
    if (open) setValues(initialValues(fields, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const set = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }));

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!submitting ? onOpenChange(o) : null)}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
      >
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handle} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f) => (
              <FieldControl key={f.name} field={f} value={values[f.name] ?? ""} onChange={(v) => set(f.name, v)} />
            ))}
          </div>
          {extra}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-border bg-card px-4 py-2 text-[13px] hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
