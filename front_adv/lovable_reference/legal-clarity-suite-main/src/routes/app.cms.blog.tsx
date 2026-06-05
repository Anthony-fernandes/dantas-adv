import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shells/AppShell";
import { Card, Badge } from "@/components/ui-kit/PageKit";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/app/cms/blog")({ component: CmsBlog });

const posts = [
  ["A nova jurisprudência do STJ sobre danos morais coletivos", "Civil", "Dra. Eliana Macedo", "12 mai 2026", "active"],
  ["Reforma tributária: impactos para holdings familiares", "Tributário", "Dra. Clara Nunes", "08 mai 2026", "active"],
  ["ESG e responsabilidade contratual em cadeia produtiva", "Empresarial", "Dr. Daniel Marques", "30 abr 2026", "active"],
  ["Compliance trabalhista pós-reforma: o que mudou", "Trabalhista", "Dr. André Salles", "25 abr 2026", "neutral"],
];

function CmsBlog() {
  return (
    <AppShell eyebrow="Conteúdo · Blog" title="Editorial do blog" actions={<button className="px-4 h-10 bg-ink text-paper text-xs uppercase tracking-widest rounded-md inline-flex items-center gap-2"><Plus className="size-3.5" /> Novo artigo</button>}>
      <Card>
        <table className="table-editorial">
          <thead><tr><th>Título</th><th>Categoria</th><th>Autor</th><th>Publicação</th><th>Status</th></tr></thead>
          <tbody>{posts.map((p, i) => <tr key={i}><td className="font-medium max-w-md">{p[0]}</td><td className="text-ink-soft">{p[1]}</td><td>{p[2]}</td><td className="font-mono-ui text-[11px] text-ink-soft">{p[3]}</td><td><Badge tone={p[4] as any}>{p[4]==="active"?"Publicado":"Rascunho"}</Badge></td></tr>)}</tbody>
        </table>
      </Card>
    </AppShell>
  );
}
