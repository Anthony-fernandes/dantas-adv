import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicShell } from "@/components/shells/PublicShell";

export const Route = createFileRoute("/blog/$slug")({
  component: Article,
});

function Article() {
  const { slug } = Route.useParams();
  return (
    <PublicShell>
      <article className="max-w-3xl mx-auto px-6 py-20">
        <Link to="/" className="eyebrow text-gold">← Voltar para Insights</Link>
        <div className="mt-8 eyebrow">Civil · 12 mai 2026 · 8 min de leitura</div>
        <h1 className="font-display text-5xl md:text-6xl mt-4 leading-[1.05] text-balance">A nova jurisprudência do STJ sobre danos morais coletivos</h1>
        <div className="flex items-center gap-3 mt-8 pb-8 border-b border-rule">
          <div className="size-12 rounded-full bg-gold-soft grid place-items-center font-display text-lg">EM</div>
          <div>
            <div className="font-medium">Dra. Eliana Macedo</div>
            <div className="text-xs text-ink-soft">Sócia · Contencioso Cível Estratégico</div>
          </div>
        </div>

        <div className="prose-content space-y-6 mt-10 text-[17px] leading-[1.75] text-ink/90">
          <p className="font-display italic text-2xl leading-snug text-balance text-ink-soft">
            A Corte Especial firmou novo entendimento sobre o cabimento e a quantificação do dano moral coletivo, redesenhando o terreno para ações civis públicas de consumo. Caso #{slug}.
          </p>
          <p>O acórdão proferido nos autos do Recurso Especial nº 1.987.412/SP, de relatoria da Ministra Nancy Andrighi, consolidou tese que vinha sendo desenhada nos últimos cinco anos: o dano moral coletivo prescinde de prova de sofrimento individualizado, bastando a demonstração da lesão a interesses transindividuais juridicamente tutelados.</p>
          <h2 className="font-display text-3xl pt-6">O critério tripartite</h2>
          <p>Na fundamentação, três elementos foram destacados como necessários para a caracterização do dano: (i) a relevância social do bem jurídico afetado; (ii) a intolerabilidade da conduta lesiva; e (iii) a aptidão para gerar repercussão coletiva negativa.</p>
          <blockquote className="border-l-2 border-gold pl-6 my-8 font-display italic text-xl text-ink">
            "A defesa coletiva não pode permanecer refém de critérios concebidos para tutela individual."
          </blockquote>
          <h2 className="font-display text-3xl pt-6">Implicações práticas para escritórios contenciosos</h2>
          <p>Para os profissionais que atuam na defesa de empresas, três frentes exigem atenção imediata: a revisão de protocolos internos de compliance, o redesenho da matriz de provisionamento contábil e a recalibragem de estratégias de defesa em ações civis públicas em curso.</p>
          <p>O que antes era visto como risco difuso passa a ter previsibilidade jurisprudencial — o que paradoxalmente eleva o custo esperado da litigância, mas reduz a variância das condenações.</p>
        </div>

        <div className="mt-16 pt-8 border-t border-rule">
          <div className="eyebrow mb-4">Compartilhar</div>
          <div className="flex gap-3">
            {["LinkedIn", "X", "E-mail", "Copiar link"].map((s) => (
              <button key={s} className="px-4 h-9 border border-rule text-xs hover:bg-surface rounded-sm">{s}</button>
            ))}
          </div>
        </div>
      </article>
    </PublicShell>
  );
}
