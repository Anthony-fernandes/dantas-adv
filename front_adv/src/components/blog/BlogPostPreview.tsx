import { ArrowLeft, CalendarDays, Clock3, Eye, Star, User2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ResolvedLandingPost } from "@/components/blog/blog-meta";
import { formatDateLabel } from "@/components/blog/blog-meta";

type BlogPostPreviewProps = {
  article: ResolvedLandingPost;
  companyName?: string;
  backHref?: string;
  backLabel?: string;
  mode?: "full" | "compact";
};

export function BlogPostPreview({
  article,
  companyName,
  backHref,
  backLabel = "Voltar ao site",
  mode = "full",
}: BlogPostPreviewProps) {
  const compact = mode === "compact";

  return (
    <article className="mx-auto w-full max-w-4xl space-y-8">
      {!compact && backHref ? (
        <Button variant="ghost" className="gap-2 px-0 text-muted-foreground hover:bg-transparent" asChild>
          <a href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </a>
        </Button>
      ) : null}

      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {companyName ? <Badge variant="outline">{companyName}</Badge> : null}
          {article.category_label ? <Badge variant="secondary">{article.category_label}</Badge> : null}
          {article.is_featured_resolved ? (
            <Badge className="gap-1">
              <Star className="h-3.5 w-3.5" />
              Em destaque
            </Badge>
          ) : null}
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {article.title}
          </h1>
          {article.summary ? (
            <p className="max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              {article.summary}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {article.author_name ? (
            <span className="inline-flex items-center gap-2">
              <User2 className="h-4 w-4" />
              {article.author_name}
            </span>
          ) : null}
          {article.published_at ? (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDateLabel(article.published_at, true)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {article.reading_time_minutes_resolved} min de leitura
          </span>
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {article.view_count_resolved.toLocaleString("pt-BR")} visualizacoes
          </span>
        </div>
      </header>

      {article.image_url ? (
        <div className="overflow-hidden rounded-3xl border bg-muted">
          <img
            src={article.image_url}
            alt={article.title}
            className="h-auto max-h-[460px] w-full object-cover"
          />
        </div>
      ) : null}

      <Separator />

      <div
        className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: article.body_html || "<p>Sem conteúdo.</p>" }}
      />

      {article.gallery_urls.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Galeria</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {article.gallery_urls.map((imageUrl) => (
              <div key={imageUrl} className="overflow-hidden rounded-2xl border bg-muted">
                <img src={imageUrl} alt={article.title} className="h-64 w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {article.tags_list.length ? (
        <footer className="space-y-3">
          <p className="text-sm font-medium text-foreground">Palavras-chave do artigo</p>
          <div className="flex flex-wrap gap-2">
            {article.tags_list.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </footer>
      ) : null}
    </article>
  );
}
