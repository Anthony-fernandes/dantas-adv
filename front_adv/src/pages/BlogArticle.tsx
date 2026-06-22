import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenText, RefreshCw } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";

import { BlogPostPreview } from "@/components/blog/BlogPostPreview";
import { enrichLandingPost } from "@/components/blog/blog-meta";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { landingPublicService, leadService } from "@/services/api";
import type { LandingPost } from "@/types/landing";

function safePosts(payload: LandingPost[] | undefined) {
  return Array.isArray(payload) ? payload : [];
}

export default function BlogArticle() {
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const siteSlug = useMemo(() => {
    const value = new URLSearchParams(location.search).get("slug");
    return value?.trim() || undefined;
  }, [location.search]);

  const siteQuery = useQuery({
    queryKey: ["public-blog-site", siteSlug],
    queryFn: async () => await leadService.getPublicSite(siteSlug),
  });

  const companySlug = String((siteQuery.data as any)?.company?.slug || "").trim();
  const companyName = String((siteQuery.data as any)?.company?.name || "").trim();

  const postsQuery = useQuery({
    queryKey: ["public-blog-posts", companySlug],
    enabled: siteQuery.isSuccess,
    queryFn: async () => await landingPublicService.getPosts(companySlug || undefined),
  });

  const article = useMemo(() => {
    const posts = safePosts(postsQuery.data);
    return posts.map(enrichLandingPost).find((item) => item.slug === slug) || null;
  }, [postsQuery.data, slug]);

  if (siteQuery.isLoading || postsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f1] px-4">
        <Card className="w-full max-w-lg border-border/70 shadow-sm">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Carregando artigo...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (siteQuery.isError || postsQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f1] px-4">
        <Card className="w-full max-w-lg border-border/70 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">Não foi possível carregar o artigo</h1>
              <p className="text-sm text-muted-foreground">
                Verifique a conexão com a API e tente novamente.
              </p>
            </div>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f1] px-4">
        <Card className="w-full max-w-xl border-border/70 shadow-sm">
          <CardContent className="p-6">
            <EmptyState
              icon={BookOpenText}
              title="Artigo não encontrado"
              description="Esse conteúdo não está publicado ou o endereço informado não existe."
              action={{ label: "Voltar ao site", onClick: () => (window.location.href = "/") }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1] px-4 py-10 md:px-6 md:py-14">
      <BlogPostPreview
        article={article}
        companyName={companyName}
        backHref={siteSlug ? `/?slug=${encodeURIComponent(siteSlug)}` : "/"}
        backLabel="Voltar para a pagina inicial"
      />
    </div>
  );
}
