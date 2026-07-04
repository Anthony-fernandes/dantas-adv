import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Scale, Users, Wallet, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";

export const Route = createFileRoute("/app/processos/novo")({
  head: () => ({ meta: [{ title: "Novo processo — JurisFlow" }] }),
  component: NovoProcesso,
});

const STEPS = [
  { id: "dados", label: "Dados do processo", icon: Scale },
  { id: "partes", label: "Partes envolvidas", icon: Users },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "revisao", label: "Revisão", icon: FileText },
] as const;

// Basic CNJ mask check
function validateCNJ(v: string) {
  const digits = v.replace(/\D/g, "");
  if (digits.length !== 20) return { ok: false, msg: "O número CNJ deve ter 20 dígitos." };
  return { ok: true, msg: "Formato CNJ válido." };
}

function NovoProcesso() {
  const nav = useNavigate();
  const [step, setStep] = useState<(typeof STEPS)[number]["id"]>("dados");
  const [cnj, setCnj] = useState("");
  const cnjCheck = cnj ? validateCNJ(cnj) : null;
  const idx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-[1100px] p-6 md:p-8 space-y-6">
      <Link to="/app/processos" className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>
      <PageHeader eyebrow="Cadastros" title="Novo processo" description="Cadastre um novo processo judicial ou administrativo." />

      {/* Stepper */}
      <div className="surface-card p-5">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < idx; const active = i === idx;
            return (
              <div key={s.id} className="flex-1 flex items-center">
                <button onClick={() => setStep(s.id)} className="flex items-center gap-2.5 min-w-0">
                  <span className={`grid h-8 w-8 place-items-center rounded-full border-2 shrink-0 ${done ? "bg-primary border-primary text-primary-foreground" : active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className={`text-[12.5px] font-medium truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-3 ${i < idx ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="surface-card p-6">
        {step === "dados" && (
          <div className="space-y-5">
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Número CNJ *</label>
              <input value={cnj} onChange={(e) => setCnj(e.target.value)} placeholder="0000000-00.0000.0.00.0000"
                className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
              {cnjCheck && (
                <div className={`mt-2 flex items-center gap-2 text-[12.5px] ${cnjCheck.ok ? "text-success" : "text-warning"}`}>
                  {cnjCheck.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {cnjCheck.msg}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Área do direito" options={["Cível", "Trabalhista", "Tributário", "Família", "Empresarial", "Ambiental", "Criminal", "Consumidor"]} />
              <Select label="Fase atual" options={["Petição inicial", "Contestação", "Instrução", "Sentença", "Recurso"]} />
              <Input label="Vara / Foro" placeholder="Ex.: 3ª Vara Cível — SP" />
              <Input label="Comarca" placeholder="Ex.: São Paulo/SP" />
              <Select label="Cliente" options={["Construtora Aurora S.A.", "Instituto Meridiano", "Petro Sul Refinaria", "Ana Beatriz Oliveira", "Grupo Vértice", "Marcelo Freitas"]} />
              <Select label="Responsável" options={["Dra. Marina Souza", "Dr. Ricardo Lima", "Dr. André Palma", "Dra. Luísa Prado"]} />
              <div className="md:col-span-2">
                <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Objeto / assunto</label>
                <textarea rows={3} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]" placeholder="Descreva brevemente o objeto do processo..." />
              </div>
            </div>
          </div>
        )}

        {step === "partes" && (
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">Adicione as partes envolvidas — autor, ré, terceiros, MP, perito.</p>
            {[
              { papel: "Autor", nome: "Construtora Aurora S.A.", doc: "12.345.678/0001-90" },
              { papel: "Ré", nome: "Contraparte Empresarial Ltda.", doc: "88.777.666/0001-55" },
            ].map((p) => (
              <div key={p.papel} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                <div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10.5px] font-medium ${p.papel === "Autor" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"}`}>{p.papel}</span>
                  <p className="mt-1 font-medium">{p.nome}</p>
                  <p className="text-[12px] text-muted-foreground font-mono">{p.doc}</p>
                </div>
                <button className="text-[12.5px] text-muted-foreground hover:text-foreground">Remover</button>
              </div>
            ))}
            <button className="w-full rounded-md border-2 border-dashed border-border py-3 text-[13px] text-muted-foreground hover:border-primary hover:text-primary transition">+ Adicionar parte</button>
          </div>
        )}

        {step === "financeiro" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Valor da causa (R$)" placeholder="0,00" />
            <Select label="Tipo de honorário" options={["Contratual fixo", "Êxito", "Hora técnica", "Consultivo"]} />
            <Input label="Valor honorário (R$)" placeholder="0,00" />
            <Select label="Forma de pagamento" options={["À vista", "Parcelado", "Mensal"]} />
            <div className="md:col-span-2 rounded-md bg-info/8 border border-info/20 p-4 text-[12.5px] text-foreground/85">
              Um contrato pode ser gerado automaticamente ao final. Você poderá revisar antes de enviar ao cliente.
            </div>
          </div>
        )}

        {step === "revisao" && (
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">Confirme os dados antes de salvar.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { k: "Número CNJ", v: cnj || "—" },
                { k: "Área", v: "Cível" },
                { k: "Cliente", v: "Construtora Aurora S.A." },
                { k: "Responsável", v: "Dra. Marina Souza" },
                { k: "Valor causa", v: "R$ 250.000,00" },
                { k: "Partes", v: "2 vinculadas" },
              ].map((r) => (
                <div key={r.k} className="rounded-md border border-border bg-card p-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{r.k}</p>
                  <p className="text-[13.5px] font-medium mt-0.5">{r.v}</p>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" className="rounded border-border" defaultChecked /> Gerar contrato de honorários automaticamente
            </label>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" className="rounded border-border" defaultChecked /> Notificar cliente por e-mail
            </label>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
          <button onClick={() => idx > 0 && setStep(STEPS[idx - 1].id)} disabled={idx === 0}
            className="rounded-md border border-border bg-card px-4 py-2 text-[13px] hover:bg-muted disabled:opacity-40">Voltar</button>
          {idx < STEPS.length - 1 ? (
            <button onClick={() => setStep(STEPS[idx + 1].id)} className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">Próximo</button>
          ) : (
            <button onClick={() => nav({ to: "/app/processos" })} className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">Criar processo</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <input placeholder={placeholder} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>
  );
}
function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <select className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}