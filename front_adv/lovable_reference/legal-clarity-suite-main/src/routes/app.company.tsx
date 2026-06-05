import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, CardHeader } from "@/components/ui-kit/PageKit";

export const Route = createFileRoute("/app/company")({ component: Company });

const F = ({ l, v }: { l: string; v: string }) => (
  <label className="block">
    <div className="text-[11px] font-mono-ui uppercase tracking-widest text-ink-soft mb-1.5">{l}</div>
    <input defaultValue={v} className="w-full h-10 px-3 bg-surface border border-rule rounded-md text-sm" />
  </label>
);

function Company() {
  return (
    <AppShell eyebrow="Cadastros · Empresa" title="Dados do escritório" actions={<button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest rounded-md">Salvar alterações</button>}>
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8">
          <CardHeader title="Identificação" eyebrow="Dados públicos" />
          <div className="p-6 grid grid-cols-2 gap-4">
            <F l="Razão social" v="Silva & Bastos Advogados Associados" />
            <F l="Nome fantasia" v="Silva & Bastos" />
            <F l="CNPJ" v="00.123.456/0001-00" />
            <F l="OAB" v="OAB/SP 12.345" />
            <F l="E-mail principal" v="contato@silvabastos.adv" />
            <F l="Telefone" v="+55 11 3000-2200" />
          </div>
        </Card>
        <Card className="col-span-4">
          <CardHeader title="Marca" eyebrow="Identidade visual" />
          <div className="p-6 space-y-4">
            <div className="aspect-square bg-paper border border-dashed border-rule grid place-items-center text-ink-soft">
              <div className="text-center">
                <div className="font-display text-5xl italic text-gold">S&B</div>
                <div className="eyebrow mt-2">Logo atual</div>
              </div>
            </div>
            <button className="w-full h-9 border border-rule rounded text-xs hover:bg-paper">Substituir logo</button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
