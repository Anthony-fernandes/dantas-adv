import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Building2, User } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";

export const Route = createFileRoute("/app/clientes/novo")({
  head: () => ({ meta: [{ title: "Novo cliente — JurisFlow" }] }),
  component: NovoCliente,
});

function NovoCliente() {
  const nav = useNavigate();
  const [tipo, setTipo] = useState<"PF" | "PJ">("PJ");
  return (
    <div className="mx-auto max-w-[900px] p-6 md:p-8 space-y-6">
      <Link to="/app/clientes" className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>
      <PageHeader eyebrow="Cadastros" title="Novo cliente" description="Cadastre uma pessoa física ou jurídica para vincular a processos e contratos." />

      <form onSubmit={(e) => { e.preventDefault(); nav({ to: "/app/clientes" }); }} className="surface-card p-6 space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Tipo de pessoa</p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
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
          <Field label={tipo === "PJ" ? "Razão social" : "Nome completo"} placeholder={tipo === "PJ" ? "Ex.: Construtora Aurora S.A." : "Ex.: Maria Oliveira"} required />
          <Field label={tipo === "PJ" ? "CNPJ" : "CPF"} placeholder={tipo === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"} required mono />
          {tipo === "PJ" && <Field label="Nome fantasia" placeholder="Nome comercial" />}
          {tipo === "PJ" && <Field label="Inscrição Estadual" placeholder="Somente números" />}
          {tipo === "PF" && <Field label="RG" placeholder="00.000.000-0" />}
          {tipo === "PF" && <Field label="Data de nascimento" type="date" />}
        </Section>

        <Section title="Contato">
          <Field label="E-mail" type="email" placeholder="contato@empresa.com.br" required />
          <Field label="Telefone" placeholder="(11) 00000-0000" />
          <Field label="Celular" placeholder="(11) 90000-0000" />
        </Section>

        <Section title="Endereço">
          <Field label="CEP" placeholder="00000-000" />
          <Field label="Logradouro" placeholder="Rua / Avenida" full />
          <Field label="Cidade" placeholder="Cidade" />
          <Field label="UF" placeholder="SP" />
        </Section>

        <Section title="Atendimento">
          <div>
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Responsável</label>
            <select className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]">
              <option>Dra. Marina Souza</option><option>Dr. Ricardo Lima</option><option>Dr. André Palma</option><option>Dra. Luísa Prado</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Origem</label>
            <select className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]">
              <option>Indicação</option><option>Marketing digital</option><option>Site</option><option>Parceria</option><option>Outro</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Observações</label>
            <textarea rows={3} className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px]" placeholder="Notas internas..." />
          </div>
        </Section>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Link to="/app/clientes" className="rounded-md border border-border bg-card px-4 py-2 text-[13px] hover:bg-muted">Cancelar</Link>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90">Salvar cliente</button>
        </div>
      </form>
    </div>
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

function Field({ label, placeholder, type = "text", required, mono, full }: { label: string; placeholder?: string; type?: string; required?: boolean; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}{required && <span className="text-destructive"> *</span>}</label>
      <input type={type} placeholder={placeholder} required={required}
        className={`mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 ${mono ? "font-mono" : ""}`} />
    </div>
  );
}