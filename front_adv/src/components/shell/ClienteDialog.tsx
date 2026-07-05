import { useEffect, useState } from "react";
import { Building2, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCreate } from "@/lib/resources";

type Form = {
  name: string; doc: string; fantasy: string; ie: string; rg: string; birth: string;
  email: string; phone: string; mobile: string;
  cep: string; street: string; city: string; state: string;
  notes: string;
};
const EMPTY: Form = { name: "", doc: "", fantasy: "", ie: "", rg: "", birth: "", email: "", phone: "", mobile: "", cep: "", street: "", city: "", state: "", notes: "" };

/** Cadastro de cliente (PF/PJ) em pop-up. */
export function ClienteDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (client: any) => void;
}) {
  const createClient = useCreate<any>("clients");
  const [tipo, setTipo] = useState<"PF" | "PJ">("PJ");
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setTipo("PJ");
    }
  }, [open]);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome/razão social.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        type: tipo,
        name: form.name,
        document: form.doc || null,
        email: form.email || null,
        phone: form.phone || null,
        whatsapp: form.mobile || null,
        status: "ativo",
        address: {
          cep: form.cep || null,
          street: form.street || null,
          city: form.city || null,
          state: form.state || null,
        },
        notes: form.notes || null,
        ...(tipo === "PJ" ? { fantasy_name: form.fantasy || null, ie: form.ie || null } : { rg: form.rg || null, birth_date: form.birth || null }),
      };
      const saved = await createClient.mutateAsync(payload);
      toast.success("Cliente cadastrado com sucesso.");
      onOpenChange(false);
      onCreated?.(saved);
    } catch (err: any) {
      toast.error(err?.detail || "Não foi possível cadastrar o cliente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!createClient.isPending ? onOpenChange(o) : null)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Novo cliente</DialogTitle>
          <DialogDescription>Cadastre uma pessoa física ou jurídica para vincular a processos e contratos.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Tipo de pessoa</p>
            <div className="grid grid-cols-2 gap-3">
              {(["PJ", "PF"] as const).map((t) => {
                const Icon = t === "PJ" ? Building2 : User;
                return (
                  <button key={t} type="button" onClick={() => setTipo(t)}
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition ${tipo === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <Icon className={`h-5 w-5 ${tipo === t ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <p className="font-medium text-[13.5px]">{t === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}</p>
                      <p className="text-[11.5px] text-muted-foreground">{t === "PJ" ? "Empresa com CNPJ" : "Cliente individual"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Section title="Dados principais">
            <Field label={tipo === "PJ" ? "Razão social" : "Nome completo"} value={form.name} onChange={(v) => set("name", v)} required />
            <Field label={tipo === "PJ" ? "CNPJ" : "CPF"} value={form.doc} onChange={(v) => set("doc", v)} mono />
            {tipo === "PJ" && <Field label="Nome fantasia" value={form.fantasy} onChange={(v) => set("fantasy", v)} />}
            {tipo === "PJ" && <Field label="Inscrição Estadual" value={form.ie} onChange={(v) => set("ie", v)} />}
            {tipo === "PF" && <Field label="RG" value={form.rg} onChange={(v) => set("rg", v)} />}
            {tipo === "PF" && <Field label="Data de nascimento" type="date" value={form.birth} onChange={(v) => set("birth", v)} />}
          </Section>

          <Section title="Contato">
            <Field label="E-mail" type="email" value={form.email} onChange={(v) => set("email", v)} />
            <Field label="Telefone" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field label="Celular" value={form.mobile} onChange={(v) => set("mobile", v)} />
          </Section>

          <Section title="Endereço">
            <Field label="CEP" value={form.cep} onChange={(v) => set("cep", v)} />
            <Field label="Logradouro" value={form.street} onChange={(v) => set("street", v)} full />
            <Field label="Cidade" value={form.city} onChange={(v) => set("city", v)} />
            <Field label="UF" value={form.state} onChange={(v) => set("state", v)} />
          </Section>

          <Section title="Observações">
            <div className="md:col-span-2">
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Notas internas</label>
              <textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]" placeholder="Notas internas..." />
            </div>
          </Section>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-border bg-card px-4 py-2 text-[13px] hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={createClient.isPending} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {createClient.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar cliente
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-[15px] font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, type = "text", required, mono, full, value, onChange }: { label: string; type?: string; required?: boolean; mono?: boolean; full?: boolean; value: string; onChange: (v: string) => void }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
        className={`mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${mono ? "font-mono" : ""}`} />
    </div>
  );
}
