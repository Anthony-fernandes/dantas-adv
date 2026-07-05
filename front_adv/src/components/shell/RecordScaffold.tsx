import { Link } from "@tanstack/react-router";
import { ArrowLeft, Edit3, Trash2, Loader2 } from "lucide-react";
import { PageHeader, StatusPill } from "./PageHeader";
import { useState, type ReactNode } from "react";

export type FieldOption = string | { value: string; label: string };

export type FieldDef = {
  label: string;
  name: string;
  type?: "text" | "number" | "date" | "email" | "tel" | "textarea" | "select" | "money";
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[];
  full?: boolean;
  mono?: boolean;
  defaultValue?: string;
};

function optionValue(o: FieldOption) {
  return typeof o === "string" ? o : o.value;
}
function optionLabel(o: FieldOption) {
  return typeof o === "string" ? o : o.label;
}

export function RecordDetail({
  backTo,
  backLabel,
  eyebrow,
  title,
  subtitle,
  status,
  statusTone,
  fields,
  extra,
}: {
  backTo: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusTone?: "default" | "success" | "warning" | "info" | "destructive" | "muted";
  fields: { label: string; value: ReactNode }[];
  extra?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1200px] p-6 md:p-8 space-y-6">
      <Link to={backTo as any} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </Link>

      <div className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mt-1">{title}</h1>
            {subtitle && <p className="text-[13px] text-muted-foreground mt-1">{subtitle}</p>}
            {status && <div className="mt-3"><StatusPill tone={statusTone || "info"}>{status}</StatusPill></div>}
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[13px] hover:bg-muted">
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">
              <Edit3 className="h-3.5 w-3.5" /> Editar
            </button>
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-display text-[15px] font-semibold mb-4">Informações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {fields.map((f) => (
            <div key={f.label} className="border-b border-border/60 pb-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{f.label}</p>
              <p className="mt-1 text-[13.5px] font-medium">{f.value ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {extra}
    </div>
  );
}

export function RecordForm({
  backTo,
  backLabel,
  eyebrow,
  title,
  description,
  fields,
  onSubmit,
  submitLabel = "Salvar",
}: {
  backTo: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  onSubmit?: (values: Record<string, string>) => void | Promise<void>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? (f.type === "select" && f.options?.length ? optionValue(f.options[0]) : "")])),
  );
  const [submitting, setSubmitting] = useState(false);

  const set = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }));

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit?.(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[900px] p-6 md:p-8 space-y-6">
      <Link to={backTo as any} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
      </Link>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <form onSubmit={handle} className="surface-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f) => (
            <FieldControl key={f.name} field={f} value={values[f.name] ?? ""} onChange={(v) => set(f.name, v)} />
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Link to={backTo as any} className="rounded-md border border-border bg-card px-4 py-2 text-[13px] hover:bg-muted">Cancelar</Link>
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export function FieldControl({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  const cls = `mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${field.mono ? "font-mono" : ""}`;
  return (
    <div className={field.full || field.type === "textarea" ? "md:col-span-2" : ""}>
      <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {field.label}{field.required && <span className="text-destructive"> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea rows={3} placeholder={field.placeholder} required={field.required} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      ) : field.type === "select" ? (
        <select required={field.required} value={value} onChange={(e) => onChange(e.target.value)} className={cls}>
          {(field.options || []).map((o) => <option key={optionValue(o)} value={optionValue(o)}>{optionLabel(o)}</option>)}
        </select>
      ) : (
        <input
          type={field.type === "money" ? "number" : (field.type || "text")}
          step={field.type === "money" ? "0.01" : undefined}
          placeholder={field.placeholder}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  );
}
