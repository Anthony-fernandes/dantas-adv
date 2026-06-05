import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, CardHeader } from "@/components/ui-kit/PageKit";
import { GripVertical, Eye, Save } from "lucide-react";

export const Route = createFileRoute("/app/cms/landing")({ component: CmsLanding });

const blocks = ["Hero", "Áreas de Atuação", "Sobre o escritório", "Diferenciais", "Fluxo de atendimento", "Insights / Blog", "Depoimentos", "Mapa & Contato", "CTA Final", "Rodapé"];

function CmsLanding() {
  return (
    <AppShell eyebrow="Conteúdo · CMS" title="Editor da landing pública" actions={<><button className="px-4 h-10 border border-rule text-xs rounded-md inline-flex items-center gap-2"><Eye className="size-3.5" /> Pré-visualizar</button><button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest rounded-md inline-flex items-center gap-2"><Save className="size-3.5" /> Publicar</button></>}>
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-4">
          <CardHeader title="Blocos da página" eyebrow="Arraste para reordenar" />
          <div className="p-2">
            {blocks.map((b, i) => (
              <div key={b} className={`flex items-center gap-3 px-3 py-2.5 rounded hover:bg-paper cursor-pointer text-sm ${i===0?"bg-paper":""}`}>
                <GripVertical className="size-4 text-ink-soft" />
                <span className="flex-1">{b}</span>
                <span className="text-[10px] font-mono-ui text-ink-soft">{String(i+1).padStart(2,"0")}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="col-span-8">
          <CardHeader title="Hero" eyebrow="Bloco selecionado" />
          <div className="p-6 space-y-4">
            <label className="block"><div className="eyebrow mb-1.5">Eyebrow</div><input defaultValue="Advocacia Empresarial · Desde 1987" className="w-full h-10 px-3 bg-surface border border-rule rounded text-sm" /></label>
            <label className="block"><div className="eyebrow mb-1.5">Título principal</div><textarea defaultValue="Precisão técnica.&#10;Autoridade jurídica." rows={3} className="w-full p-3 bg-surface border border-rule rounded text-sm font-display text-2xl" /></label>
            <label className="block"><div className="eyebrow mb-1.5">Subtítulo</div><textarea defaultValue="Um escritório full service com 38 anos de tradição..." rows={3} className="w-full p-3 bg-surface border border-rule rounded text-sm" /></label>
            <div className="grid grid-cols-2 gap-4">
              <label><div className="eyebrow mb-1.5">CTA primário</div><input defaultValue="Agendar Consulta" className="w-full h-10 px-3 bg-surface border border-rule rounded text-sm" /></label>
              <label><div className="eyebrow mb-1.5">CTA secundário</div><input defaultValue="Acessar Portal" className="w-full h-10 px-3 bg-surface border border-rule rounded text-sm" /></label>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
