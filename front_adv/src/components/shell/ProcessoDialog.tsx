import { useEffect, useMemo, useState } from "react";
import { Scale, Users, Wallet, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useList, useCreate, clientName } from "@/lib/resources";

const STEPS = [
  { id: "dados", label: "Dados do processo", icon: Scale },
  { id: "partes", label: "Partes envolvidas", icon: Users },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "revisao", label: "Revisão", icon: FileText },
] as const;

function validateCNJ(v: string) {
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 20) return { ok: false, msg: "O número CNJ deve ter 20 dígitos." };
  return { ok: true, msg: "Formato CNJ válido." };
}

type Form = {
  cnj: string; area: string; phase: string; status: string;
  court: string; court_division: string; client: string;
  plaintiff: string; defendant: string; subject: string;
  cause_value: string; probability: string;
};

const EMPTY: Form = {
  cnj: "", area: "civel", phase: "conhecimento", status: "em_andamento",
  court: "", court_division: "", client: "", plaintiff: "", defendant: "",
  subject: "", cause_value: "", probability: "media",
};

/** Cadastro de processo (stepper) em pop-up. */
export function ProcessoDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (process: any) => void;
}) {
  const clients = useList<any>("clients");
  const areas = useList<any>("causes");
  const createProcess = useCreate<any>("processes");

  const [step, setStep] = useState<(typeof STEPS)[number]["id"]>("dados");
  const [form, setForm] = useState<Form>(EMPTY);
  const idx = STEPS.findIndex((s) => s.id === step);
  const cnjCheck = form.cnj ? validateCNJ(form.cnj) : null;

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setStep("dados");
    }
  }, [open]);

  const clientOptions = useMemo(
    () => (clients.data ?? []).map((c) => ({ value: String(c.id), label: clientName(c) })),
    [clients.data],
  );
  const areaOptions = useMemo(() => {
    const list = (areas.data ?? []).filter((a) => a.is_active !== false);
    if (list.length === 0) {
      return [
        { value: "civel", label: "Cível" }, { value: "trabalhista", label: "Trabalhista" },
        { value: "tributario", label: "Tributário" }, { value: "familia", label: "Família" },
        { value: "empresarial", label: "Empresarial" }, { value: "criminal", label: "Criminal" },
      ];
    }
    return list.map((a) => ({ value: String(a.area || a.id), label: a.name || a.area || "Área" }));
  }, [areas.data]);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit() {
    if (!form.cnj || !validateCNJ(form.cnj).ok) {
      toast.error("Informe um número CNJ válido (20 dígitos).");
      setStep("dados");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        cnj: form.cnj,
        area: form.area,
        phase: form.phase,
        status: form.status,
        court: form.court || null,
        court_division: form.court_division || null,
        client: form.client || null,
        plaintiff: form.plaintiff || null,
        defendant: form.defendant || null,
        subject: form.subject || null,
        cause_value: form.cause_value ? Number(form.cause_value.replace(/\./g, "").replace(",", ".")) : null,
        probability: form.probability,
      };
      const saved = await createProcess.mutateAsync(payload);
      toast.success("Processo criado com sucesso.");
      onOpenChange(false);
      onCreated?.(saved);
    } catch (err: any) {
      toast.error(err?.detail || "Não foi possível criar o processo.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (!createProcess.isPending ? onOpenChange(o) : null)}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Novo processo</DialogTitle>
          <DialogDescription>Cadastre um novo processo judicial ou administrativo.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < idx; const active = i === idx;
              return (
                <div key={s.id} className="flex-1 flex items-center">
                  <button type="button" onClick={() => setStep(s.id)} className="flex items-center gap-2.5 min-w-0">
                    <span className={`grid h-8 w-8 place-items-center rounded-full border-2 shrink-0 ${done ? "bg-primary border-primary text-primary-foreground" : active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className={`hidden sm:block text-[12.5px] font-medium truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-3 ${i < idx ? "bg-primary" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {step === "dados" && (
            <div className="space-y-5">
              <div>
                <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Número CNJ *</label>
                <input value={form.cnj} onChange={(e) => set("cnj", e.target.value)} placeholder="0000000-00.0000.0.00.0000"
                  className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                {cnjCheck && (
                  <div className={`mt-2 flex items-center gap-2 text-[12.5px] ${cnjCheck.ok ? "text-success" : "text-warning"}`}>
                    {cnjCheck.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                    {cnjCheck.msg}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Área do direito" value={form.area} onChange={(v) => set("area", v)} options={areaOptions} />
                <Select label="Fase atual" value={form.phase} onChange={(v) => set("phase", v)}
                  options={[
                    { value: "conhecimento", label: "Conhecimento" }, { value: "recursal", label: "Recursal" },
                    { value: "execucao", label: "Execução" }, { value: "cumprimento", label: "Cumprimento" },
                  ]} />
                <Input label="Tribunal" value={form.court} onChange={(v) => set("court", v)} placeholder="Ex.: TJSP" />
                <Input label="Vara / Foro" value={form.court_division} onChange={(v) => set("court_division", v)} placeholder="Ex.: 3ª Vara Cível" />
                <Select label="Cliente" value={form.client} onChange={(v) => set("client", v)}
                  options={[{ value: "", label: "Selecione…" }, ...clientOptions]} />
                <Select label="Status" value={form.status} onChange={(v) => set("status", v)}
                  options={[
                    { value: "em_andamento", label: "Em andamento" }, { value: "pre_processual", label: "Pré-processual" },
                    { value: "suspenso", label: "Suspenso" }, { value: "finalizado", label: "Finalizado" },
                  ]} />
                <div className="md:col-span-2">
                  <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Objeto / assunto</label>
                  <textarea value={form.subject} onChange={(e) => set("subject", e.target.value)} rows={3} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]" placeholder="Descreva brevemente o objeto do processo..." />
                </div>
              </div>
            </div>
          )}

          {step === "partes" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Polo ativo (autor)" value={form.plaintiff} onChange={(v) => set("plaintiff", v)} placeholder="Nome do autor" />
              <Input label="Parte contrária (ré)" value={form.defendant} onChange={(v) => set("defendant", v)} placeholder="Nome da parte contrária" />
            </div>
          )}

          {step === "financeiro" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Valor da causa (R$)" value={form.cause_value} onChange={(v) => set("cause_value", v)} placeholder="0,00" />
              <Select label="Probabilidade de êxito" value={form.probability} onChange={(v) => set("probability", v)}
                options={[{ value: "alta", label: "Alta" }, { value: "media", label: "Média" }, { value: "baixa", label: "Baixa" }]} />
            </div>
          )}

          {step === "revisao" && (
            <div className="space-y-4">
              <p className="text-[13px] text-muted-foreground">Confirme os dados antes de salvar.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { k: "Número CNJ", v: form.cnj || "—" },
                  { k: "Área", v: areaOptions.find((a) => a.value === form.area)?.label || form.area },
                  { k: "Cliente", v: clientOptions.find((c) => c.value === form.client)?.label || "—" },
                  { k: "Tribunal / Vara", v: [form.court_division, form.court].filter(Boolean).join(" · ") || "—" },
                  { k: "Valor causa", v: form.cause_value ? `R$ ${form.cause_value}` : "—" },
                  { k: "Parte contrária", v: form.defendant || "—" },
                ].map((r) => (
                  <div key={r.k} className="rounded-md border border-border bg-card p-3">
                    <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{r.k}</p>
                    <p className="text-[13.5px] font-medium mt-0.5">{r.v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
            <button type="button" onClick={() => idx > 0 && setStep(STEPS[idx - 1].id)} disabled={idx === 0}
              className="rounded-md border border-border bg-card px-4 py-2 text-[13px] hover:bg-muted disabled:opacity-40">Voltar</button>
            {idx < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep(STEPS[idx + 1].id)} className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">Próximo</button>
            ) : (
              <button type="button" onClick={submit} disabled={createProcess.isPending}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {createProcess.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Criar processo
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Input({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>
  );
}
function Select({ label, options, value, onChange }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] outline-none focus:border-primary">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
