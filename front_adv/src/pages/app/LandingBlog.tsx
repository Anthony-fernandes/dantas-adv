import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenText, Copy, Eye, FilePlus2, Globe, Pencil, RefreshCw, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { BlogPostPreview } from "@/components/blog/BlogPostPreview";
import { BlogRichEditor } from "@/components/blog/BlogRichEditor";
import {
  type BlogPublicationStatus,
  type ResolvedLandingPost,
  buildSlug,
  composeBlogPostContent,
  deriveBlogPublicationStatus,
  enrichLandingPost,
  formatDateLabel,
  sanitizeBlogMetadata,
} from "@/components/blog/blog-meta";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useScopedTenant } from "@/hooks/useScopedTenant";
import { landingCmsService } from "@/services/api";
import type { LandingPost, LandingSettings } from "@/types/landing";

type PostFormState = {
  title: string;
  slug: string;
  summary: string;
  body_html: string;
  author_name: string;
  category: string;
  tags_text: string;
  seo_title: string;
  seo_description: string;
  seo_keywords_text: string;
  published_at: string;
  sort_order: number;
  publication_status: BlogPublicationStatus;
  is_featured: boolean;
  gallery_text: string;
  clear_image: boolean;
};

type BlogCategoryRecord = {
  id: string;
  label: string;
  slug: string;
};

const EMPTY_POST: PostFormState = {
  title: "",
  slug: "",
  summary: "",
  body_html: "<p></p>",
  author_name: "",
  category: "",
  tags_text: "",
  seo_title: "",
  seo_description: "",
  seo_keywords_text: "",
  published_at: "",
  sort_order: 0,
  publication_status: "RASCUNHO",
  is_featured: false,
  gallery_text: "",
  clear_image: false,
};

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function appendFormDataValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (typeof value === "boolean") {
    formData.append(key, value ? "true" : "false");
    return;
  }
  if (typeof value === "number") {
    formData.append(key, String(value));
    return;
  }
  formData.append(key, String(value));
}

function publicationVariant(status: BlogPublicationStatus) {
  if (status === "PUBLICADO") return "success" as const;
  if (status === "AGENDADO") return "warning" as const;
  return "muted" as const;
}

function publicationLabel(status: BlogPublicationStatus) {
  if (status === "PUBLICADO") return "Publicado";
  if (status === "AGENDADO") return "Agendado";
  return "Rascunho";
}

function normalizeCategories(rawTheme: unknown): BlogCategoryRecord[] {
  if (!Array.isArray(rawTheme)) return [];
  const seen = new Set<string>();
  const output: BlogCategoryRecord[] = [];

  rawTheme.forEach((item) => {
    const label = String((item as any)?.label || "").trim();
    const slug = buildSlug(String((item as any)?.slug || label));
    if (!label || !slug || seen.has(slug)) return;
    seen.add(slug);
    output.push({ id: String((item as any)?.id || slug), label, slug });
  });

  return output;
}

function buildCategoryRecord(label: string, seed?: string): BlogCategoryRecord {
  const normalizedLabel = label.trim();
  const slug = buildSlug(seed || normalizedLabel);
  return { id: slug, label: normalizedLabel, slug };
}

function buildPostFormDataFromRecord(
  post: LandingPost,
  overrides: Partial<{ title: string; summary: string; content: string; author_name: string; slug: string; seo_title: string; seo_description: string; published_at: string; sort_order: number; is_published: boolean; clear_image: boolean }> = {},
) {
  const formData = new FormData();
  appendFormDataValue(formData, "title", overrides.title ?? post.title);
  appendFormDataValue(formData, "summary", overrides.summary ?? post.summary);
  appendFormDataValue(formData, "content", overrides.content ?? post.content);
  appendFormDataValue(formData, "author_name", overrides.author_name ?? post.author_name ?? "");
  appendFormDataValue(formData, "slug", overrides.slug ?? post.slug ?? "");
  appendFormDataValue(formData, "seo_title", overrides.seo_title ?? post.seo_title ?? "");
  appendFormDataValue(formData, "seo_description", overrides.seo_description ?? post.seo_description ?? "");
  appendFormDataValue(formData, "published_at", overrides.published_at ?? post.published_at ?? "");
  appendFormDataValue(formData, "sort_order", overrides.sort_order ?? post.sort_order ?? 0);
  appendFormDataValue(formData, "is_published", overrides.is_published ?? (post.is_published !== false));
  appendFormDataValue(formData, "clear_image", overrides.clear_image ?? false);
  return formData;
}

export default function LandingBlog() {
  const queryClient = useQueryClient();
  const { hasRole, hasPermission, isSuperuser } = useAuth();
  const { companies, selectedTenantId, setSelectedTenantId } = useScopedTenant("landing-blog");

  const canEdit = isSuperuser || hasRole("OWNER", "ADMIN") || hasPermission("blog.editar", "blog.edit", "admin.manage_users");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<PostFormState>(EMPTY_POST);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [previewArticle, setPreviewArticle] = useState<ResolvedLandingPost | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategorySlug, setEditingCategorySlug] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [categoryFilter, setCategoryFilter] = useState("todas");

  const postsQuery = useQuery({ queryKey: ["landing-blog-posts", selectedTenantId], enabled: !!selectedTenantId, queryFn: () => landingCmsService.listAllPosts() });
  const settingsQuery = useQuery({ queryKey: ["landing-blog-settings", selectedTenantId], enabled: !!selectedTenantId && canEdit, queryFn: () => landingCmsService.getSettings() });

  const posts = useMemo(() => (Array.isArray(postsQuery.data) ? postsQuery.data : []), [postsQuery.data]);
  const resolvedPosts = useMemo(() => posts.map((post) => enrichLandingPost(post)), [posts]);
  const resolvedPostMap = useMemo(() => new Map(resolvedPosts.map((post) => [post.id, post])), [resolvedPosts]);
  const categoryCatalog = useMemo(() => normalizeCategories((settingsQuery.data as LandingSettings | undefined)?.theme?.blog_categories), [settingsQuery.data]);
  const categories = useMemo(() => {
    const usageMap = new Map<string, number>();
    resolvedPosts.forEach((post) => {
      if (!post.category_label) return;
      const slug = buildSlug(post.category_label);
      usageMap.set(slug, (usageMap.get(slug) || 0) + 1);
    });

    const merged = new Map<string, { id: string; slug: string; label: string; usageCount: number }>();
    categoryCatalog.forEach((category) => {
      merged.set(category.slug, { id: category.id, slug: category.slug, label: category.label, usageCount: usageMap.get(category.slug) || 0 });
    });

    resolvedPosts.forEach((post) => {
      if (!post.category_label) return;
      const slug = buildSlug(post.category_label);
      if (!slug || merged.has(slug)) return;
      merged.set(slug, { id: slug, slug, label: post.category_label, usageCount: usageMap.get(slug) || 0 });
    });

    return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [categoryCatalog, resolvedPosts]);

  const filteredPosts = useMemo(() => {
    return resolvedPosts.filter((post) => {
      const matchesSearch = !searchTerm.trim() || post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "todos"
        ? true
        : statusFilter === "destaque"
          ? post.is_featured_resolved
          : statusFilter === "publicados"
            ? post.publication_status === "PUBLICADO"
            : statusFilter === "agendados"
              ? post.publication_status === "AGENDADO"
              : post.publication_status === "RASCUNHO";
      const matchesCategory = categoryFilter === "todas" ? true : buildSlug(post.category_label) === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, resolvedPosts, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const published = resolvedPosts.filter((post) => post.publication_status === "PUBLICADO").length;
    const drafts = resolvedPosts.filter((post) => post.publication_status === "RASCUNHO").length;
    const totalViews = resolvedPosts.reduce((sum, post) => sum + post.view_count_resolved, 0);
    const mostViewed = [...resolvedPosts].sort((a, b) => b.view_count_resolved - a.view_count_resolved)[0] || null;
    return { total: resolvedPosts.length, published, drafts, totalViews, mostViewed };
  }, [resolvedPosts]);

  const savePostMutation = useMutation({
    mutationFn: async () => {
      if (!postForm.title.trim()) throw new Error("Informe o titulo do artigo.");
      if (postForm.publication_status === "AGENDADO") {
        if (!postForm.published_at) throw new Error("Informe a data e hora do agendamento.");
        const scheduledDate = new Date(postForm.published_at);
        if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) throw new Error("Use uma data futura para marcar como agendado.");
      }

      const sourcePost = editingPostId ? resolvedPostMap.get(editingPostId) : null;
      const metadata = sanitizeBlogMetadata({
        category: postForm.category,
        tags: postForm.tags_text,
        seo_keywords: postForm.seo_keywords_text,
        is_featured: postForm.is_featured,
        gallery: postForm.gallery_text,
        view_count: sourcePost?.view_count_resolved ?? 0,
      });

      const isPublished = postForm.publication_status === "PUBLICADO";
      const publishedAt = isPublished ? fromDateTimeLocal(postForm.published_at || new Date().toISOString().slice(0, 16)) : postForm.published_at ? fromDateTimeLocal(postForm.published_at) : "";

      const formData = new FormData();
      appendFormDataValue(formData, "title", postForm.title.trim());
      appendFormDataValue(formData, "summary", postForm.summary.trim());
      appendFormDataValue(formData, "content", composeBlogPostContent(postForm.body_html, metadata));
      appendFormDataValue(formData, "author_name", postForm.author_name.trim());
      appendFormDataValue(formData, "slug", buildSlug(postForm.slug || postForm.title));
      appendFormDataValue(formData, "seo_title", postForm.seo_title.trim());
      appendFormDataValue(formData, "seo_description", postForm.seo_description.trim());
      appendFormDataValue(formData, "published_at", publishedAt);
      appendFormDataValue(formData, "sort_order", postForm.sort_order);
      appendFormDataValue(formData, "is_published", isPublished);
      appendFormDataValue(formData, "clear_image", postForm.clear_image);
      if (postImageFile) formData.append("image", postImageFile);
      if (editingPostId) return landingCmsService.updatePost(editingPostId, formData);
      return landingCmsService.createPost(formData);
    },
    onSuccess: async () => {
      toast.success(editingPostId ? "Artigo atualizado com sucesso." : "Artigo criado com sucesso.");
      setDialogOpen(false);
      setEditingPostId(null);
      setPostForm(EMPTY_POST);
      setPostImageFile(null);
      await queryClient.invalidateQueries({ queryKey: ["landing-blog-posts", selectedTenantId] });
    },
    onError: (error: any) => toast.error(error?.message || "Nao foi possivel salvar o artigo."),
  });

  const rowActionMutation = useMutation({
    mutationFn: async (payload: { type: "publicar" | "despublicar" | "duplicar" | "excluir"; post: ResolvedLandingPost }) => {
      if (payload.type === "excluir") {
        await landingCmsService.removePost(payload.post.id);
        return;
      }
      if (payload.type === "duplicar") {
        const formData = buildPostFormDataFromRecord(payload.post, { title: `${payload.post.title} (Copia)`, slug: "", is_published: false, published_at: "", sort_order: (payload.post.sort_order || 0) + 1 });
        await landingCmsService.createPost(formData);
        return;
      }
      const shouldPublish = payload.type === "publicar";
      const formData = buildPostFormDataFromRecord(payload.post, { is_published: shouldPublish, published_at: shouldPublish ? new Date().toISOString() : payload.post.published_at || "" });
      await landingCmsService.updatePost(payload.post.id, formData);
    },
    onSuccess: async (_data, variables) => {
      const messageMap = { publicar: "Artigo publicado.", despublicar: "Artigo movido para rascunho.", duplicar: "Copia criada como rascunho.", excluir: "Artigo removido." } as const;
      toast.success(messageMap[variables.type]);
      await queryClient.invalidateQueries({ queryKey: ["landing-blog-posts", selectedTenantId] });
    },
    onError: (error: any) => toast.error(error?.message || "Nao foi possivel concluir a acao."),
  });

  const categoryMutation = useMutation({
    mutationFn: async (payload: { nextCatalog: BlogCategoryRecord[]; fromCategorySlug?: string; nextCategoryLabel?: string }) => {
      const currentSettings = (settingsQuery.data as LandingSettings | undefined) || {};
      const currentTheme = (currentSettings.theme || {}) as Record<string, unknown>;
      await landingCmsService.updateSettings({ theme: { ...currentTheme, blog_categories: payload.nextCatalog } });

      if (payload.fromCategorySlug) {
        const affectedPosts = resolvedPosts.filter((post) => buildSlug(post.category_label) === payload.fromCategorySlug);
        await Promise.all(affectedPosts.map((post) => {
          const nextContent = composeBlogPostContent(post.body_html, {
            category: payload.nextCategoryLabel || "",
            tags: post.tags_list,
            seo_keywords: post.seo_keywords_list,
            is_featured: post.is_featured_resolved,
            gallery: post.gallery_urls,
            view_count: post.view_count_resolved,
          });
          const formData = buildPostFormDataFromRecord(post, { content: nextContent });
          return landingCmsService.updatePost(post.id, formData);
        }));
      }
    },
    onSuccess: async () => {
      toast.success("Categorias atualizadas.");
      setCategoryDraft("");
      setEditingCategorySlug(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["landing-blog-settings", selectedTenantId] }),
        queryClient.invalidateQueries({ queryKey: ["landing-blog-posts", selectedTenantId] }),
      ]);
    },
    onError: (error: any) => toast.error(error?.message || "Nao foi possivel atualizar as categorias."),
  });

  function openPostDialog(post?: ResolvedLandingPost) {
    setEditingPostId(post?.id || null);
    setPostImageFile(null);
    setPostForm(post ? {
      title: post.title || "",
      slug: post.slug || "",
      summary: post.summary || "",
      body_html: post.body_html || "<p></p>",
      author_name: post.author_name || "",
      category: post.category_label || "",
      tags_text: post.tags_list.join(", "),
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
      seo_keywords_text: post.seo_keywords_list.join(", "),
      published_at: toDateTimeLocal(post.published_at),
      sort_order: post.sort_order || 0,
      publication_status: deriveBlogPublicationStatus(post),
      is_featured: post.is_featured_resolved,
      gallery_text: post.gallery_urls.join("\n"),
      clear_image: false,
    } : EMPTY_POST);
    setDialogOpen(true);
  }

  function openDuplicateDraft(post: ResolvedLandingPost) {
    setEditingPostId(null);
    setPostImageFile(null);
    setPostForm({
      title: `${post.title} (Copia)`, slug: "", summary: post.summary || "", body_html: post.body_html || "<p></p>", author_name: post.author_name || "", category: post.category_label || "", tags_text: post.tags_list.join(", "), seo_title: post.seo_title || "", seo_description: post.seo_description || "", seo_keywords_text: post.seo_keywords_list.join(", "), published_at: "", sort_order: (post.sort_order || 0) + 1, publication_status: "RASCUNHO", is_featured: false, gallery_text: post.gallery_urls.join("\n"), clear_image: false,
    });
    setDialogOpen(true);
  }

  function buildPreviewFromForm(): ResolvedLandingPost {
    const metadata = sanitizeBlogMetadata({ category: postForm.category, tags: postForm.tags_text, seo_keywords: postForm.seo_keywords_text, is_featured: postForm.is_featured, gallery: postForm.gallery_text, view_count: editingPostId ? resolvedPostMap.get(editingPostId)?.view_count_resolved || 0 : 0 });
    return enrichLandingPost({
      id: editingPostId || "preview",
      title: postForm.title || "Novo artigo",
      summary: postForm.summary || "",
      content: composeBlogPostContent(postForm.body_html, metadata),
      image_url: postImageFile ? URL.createObjectURL(postImageFile) : resolvedPostMap.get(editingPostId || "")?.image_url,
      author_name: postForm.author_name || "",
      slug: buildSlug(postForm.slug || postForm.title || "novo-artigo"),
      seo_title: postForm.seo_title || "",
      seo_description: postForm.seo_description || "",
      published_at: postForm.published_at ? fromDateTimeLocal(postForm.published_at) : null,
      sort_order: postForm.sort_order,
      is_published: postForm.publication_status === "PUBLICADO",
    });
  }
  async function handleSaveCategory() {
    const nextLabel = categoryDraft.trim();
    if (!nextLabel) {
      toast.error("Informe o nome da categoria.");
      return;
    }

    const nextRecord = buildCategoryRecord(nextLabel, editingCategorySlug || undefined);
    const alreadyExists = categories.some((category) => category.slug === nextRecord.slug && category.slug !== editingCategorySlug);
    if (alreadyExists) {
      toast.error("Já existe uma categoria com esse nome.");
      return;
    }

    const nextCatalog = editingCategorySlug
      ? categories.map((category) => (category.slug === editingCategorySlug ? nextRecord : buildCategoryRecord(category.label, category.slug)))
      : [...categories.map((category) => buildCategoryRecord(category.label, category.slug)), nextRecord];

    await categoryMutation.mutateAsync({ nextCatalog, fromCategorySlug: editingCategorySlug || undefined, nextCategoryLabel: nextLabel });
  }

  async function handleRemoveCategory(categorySlug: string) {
    const nextCatalog = categories.filter((category) => category.slug !== categorySlug).map((category) => buildCategoryRecord(category.label, category.slug));
    await categoryMutation.mutateAsync({ nextCatalog, fromCategorySlug: categorySlug, nextCategoryLabel: "" });
  }

  const loading = postsQuery.isLoading;
  const currentEditingPost = editingPostId ? resolvedPostMap.get(editingPostId) || null : null;

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                Marketing jurídico e gestão editorial
              </div>
              <div className="space-y-2">
                <h1 className="page-title">Blog Institucional</h1>
                <p className="max-w-3xl text-sm text-muted-foreground">
                  Planeje, publique e acompanhe os artigos do escritório com foco em autoridade, SEO e relacionamento com novos clientes.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 xl:max-w-sm">
              {isSuperuser ? (
                <div className="space-y-2">
                  <Label>Empresa ativa</Label>
                  <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <Button className="gap-2 xl:self-end" onClick={() => openPostDialog()} disabled={!canEdit || !selectedTenantId}>
                <FilePlus2 className="h-4 w-4" />
                Novo artigo
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border bg-muted/20 p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,0.8fr)_minmax(220px,0.8fr)_auto]">
            <div className="space-y-2 lg:col-span-4">
              <Label>Buscar artigo</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por título ou slug"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="publicados">Publicados</SelectItem>
                  <SelectItem value="rascunhos">Rascunhos</SelectItem>
                  <SelectItem value="agendados">Agendados</SelectItem>
                  <SelectItem value="destaque">Em destaque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end lg:justify-end lg:self-end">
              <Button
                variant="outline"
                className="w-full gap-2 lg:w-auto"
                onClick={() => {
                  setCategoryDialogOpen(true);
                  setCategoryDraft("");
                  setEditingCategorySlug(null);
                }}
                disabled={!canEdit || !selectedTenantId}
              >
                <Sparkles className="h-4 w-4" />
                Gerenciar categorias
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total de artigos</p><p className="mt-1 text-2xl font-semibold">{metrics.total}</p><p className="mt-1 text-xs text-muted-foreground">Base completa do blog institucional.</p></CardContent></Card>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Publicados</p><p className="mt-1 text-2xl font-semibold">{metrics.published}</p><p className="mt-1 text-xs text-muted-foreground">Conteúdos visíveis no site público.</p></CardContent></Card>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Rascunhos</p><p className="mt-1 text-2xl font-semibold">{metrics.drafts}</p><p className="mt-1 text-xs text-muted-foreground">Textos ainda em preparo interno.</p></CardContent></Card>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Visualizacoes registradas</p><p className="mt-1 text-2xl font-semibold">{metrics.totalViews.toLocaleString("pt-BR")}</p><p className="mt-1 text-xs text-muted-foreground">Pronto para acompanhar performance dos artigos.</p></CardContent></Card>
        <Card className="border-border/70 shadow-sm"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Artigo mais acessado</p><p className="mt-1 line-clamp-2 text-base font-semibold">{metrics.mostViewed?.title || "Sem historico ainda"}</p><p className="mt-1 text-xs text-muted-foreground">{metrics.mostViewed ? `${metrics.mostViewed.view_count_resolved.toLocaleString("pt-BR")} visualizacoes` : "O modulo esta pronto para acompanhar esse dado."}</p></CardContent></Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle>Categorias editoriais</CardTitle>
          <CardDescription>Organize os artigos por tema jurídico para facilitar SEO, filtragem e navegação pública.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          {categories.length ? <div className="flex flex-wrap gap-2">{categories.map((category) => <div key={category.slug} className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm"><span>{category.label}</span><span className="text-xs text-muted-foreground">{category.usageCount} artigo(s)</span></div>)}</div> : <p className="text-sm text-muted-foreground">Ainda não há categorias cadastradas. Crie as primeiras para orientar o planejamento editorial do escritório.</p>}
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border-border/70 shadow-sm"><CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" />Carregando blog institucional...</CardContent></Card>
      ) : postsQuery.isError ? (
        <Card className="border-border/70 shadow-sm"><CardContent className="space-y-4 p-6"><div className="space-y-1"><h2 className="text-lg font-semibold">Não foi possível carregar os artigos</h2><p className="text-sm text-muted-foreground">Verifique a conexão com a API e tente novamente.</p></div><Button variant="outline" onClick={() => postsQuery.refetch()}>Tentar novamente</Button></CardContent></Card>
      ) : (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle>Artigos do blog</CardTitle><CardDescription>{filteredPosts.length} artigo(s) encontrado(s) com os filtros atuais.</CardDescription></div><div className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">Preview, duplicação e publicação rapida</div></div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPosts.length === 0 ? <div className="p-6"><EmptyState icon={BookOpenText} title="Crie artigos para atrair clientes" description="Use o blog para responder dúvidas frequentes, fortalecer a autoridade do escritório e ampliar sua presença digital." action={canEdit ? { label: "Novo artigo", onClick: () => openPostDialog() } : undefined} /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[320px]">Artigo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Publicação</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Visualizacoes</TableHead>
                    <TableHead>Destaque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell><div className="flex items-start gap-3">{post.image_url ? <img src={post.image_url} alt={post.title} className="hidden h-14 w-14 rounded-xl object-cover md:block" /> : null}<div className="space-y-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{post.title}</p>{post.is_featured_resolved ? <StatusBadge variant="info" dot={false}>Destaque</StatusBadge> : null}</div><p className="line-clamp-2 text-sm text-muted-foreground">{post.summary || "Sem resumo informado."}</p><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>Slug: {post.slug}</span><span>{post.reading_time_minutes_resolved} min de leitura</span></div></div></div></TableCell>
                      <TableCell><StatusBadge variant={publicationVariant(post.publication_status)} dot={false}>{publicationLabel(post.publication_status)}</StatusBadge></TableCell>
                      <TableCell>{post.author_name || "-"}</TableCell>
                      <TableCell>{formatDateLabel(post.created_at)}</TableCell>
                      <TableCell>{formatDateLabel(post.published_at, true)}</TableCell>
                      <TableCell>{post.category_label || "Sem categoria"}</TableCell>
                      <TableCell>{post.view_count_resolved.toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{post.is_featured_resolved ? "Sim" : "Não"}</TableCell>
                      <TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setPreviewArticle(post)}><Eye className="h-4 w-4" /></Button>{post.slug && post.publication_status === "PUBLICADO" ? <Button variant="outline" size="sm" asChild><a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"><Globe className="h-4 w-4" /></a></Button> : null}<Button variant="outline" size="sm" onClick={() => openPostDialog(post)} disabled={!canEdit}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => openDuplicateDraft(post)} disabled={!canEdit}><Copy className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => rowActionMutation.mutate({ type: post.publication_status === "PUBLICADO" ? "despublicar" : "publicar", post })} disabled={!canEdit || rowActionMutation.isPending}>{post.publication_status === "PUBLICADO" ? "Rascunho" : "Publicar"}</Button><Button variant="ghost" size="sm" onClick={() => rowActionMutation.mutate({ type: "excluir", post })} disabled={!canEdit || rowActionMutation.isPending}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
          <DialogHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div><DialogTitle>{editingPostId ? "Editar artigo" : "Novo artigo"}</DialogTitle><DialogDescription>Monte artigos jurídicos com foco em publicação institucional, SEO e aproveitamento comercial.</DialogDescription></div>
              <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="gap-2" onClick={() => setPreviewArticle(buildPreviewFromForm())}><Eye className="h-4 w-4" />Preview</Button>{currentEditingPost?.slug && currentEditingPost.publication_status === "PUBLICADO" ? <Button type="button" variant="outline" className="gap-2" asChild><a href={`/blog/${currentEditingPost.slug}`} target="_blank" rel="noreferrer"><Globe className="h-4 w-4" />Abrir no site</a></Button> : null}</div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="basicos" className="space-y-6">
            <TabsList className="w-full justify-start overflow-auto"><TabsTrigger value="basicos">Dados básicos</TabsTrigger><TabsTrigger value="conteudo">Conteúdo</TabsTrigger><TabsTrigger value="organizacao">Organização</TabsTrigger><TabsTrigger value="seo">SEO</TabsTrigger><TabsTrigger value="publicacao">Publicação</TabsTrigger></TabsList>

            <TabsContent value="basicos" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2"><Label>Título do artigo</Label><Input value={postForm.title} onChange={(event) => setPostForm((previous) => ({ ...previous, title: event.target.value, slug: previous.slug ? previous.slug : buildSlug(event.target.value) }))} placeholder="Ex.: Como revisar contratos com segurança jurídica" /></div>
                <div className="space-y-2"><Label>Slug da URL</Label><Input value={postForm.slug} onChange={(event) => setPostForm((previous) => ({ ...previous, slug: buildSlug(event.target.value) }))} placeholder="como-revisar-contratos" /></div>
                <div className="space-y-2"><Label>Autor</Label><Input value={postForm.author_name} onChange={(event) => setPostForm((previous) => ({ ...previous, author_name: event.target.value }))} placeholder="Nome do responsável pelo artigo" /></div>
                <div className="space-y-2 md:col-span-2"><Label>Resumo</Label><Textarea value={postForm.summary} onChange={(event) => setPostForm((previous) => ({ ...previous, summary: event.target.value }))} rows={4} placeholder="Resumo curto usado na landing e na listagem do blog." /></div>
                <div className="space-y-2 md:col-span-2"><Label>Imagem de capa</Label><Input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0] || null; setPostImageFile(file); if (file) setPostForm((previous) => ({ ...previous, clear_image: false })); }} />{currentEditingPost?.image_url && !postForm.clear_image && !postImageFile ? <div className="overflow-hidden rounded-2xl border bg-muted"><img src={currentEditingPost.image_url} alt={currentEditingPost.title} className="h-52 w-full object-cover" /></div> : null}{postImageFile ? <p className="text-sm text-muted-foreground">Nova imagem pronta para envio: {postImageFile.name}</p> : null}{(currentEditingPost?.image_url || postImageFile) ? <Button type="button" variant="outline" className="gap-2" onClick={() => { setPostImageFile(null); setPostForm((previous) => ({ ...previous, clear_image: true })); }}><Trash2 className="h-4 w-4" />Remover imagem</Button> : null}</div>
              </div>
            </TabsContent>

            <TabsContent value="conteudo" className="space-y-4"><div className="space-y-2"><Label>Corpo do artigo</Label><BlogRichEditor value={postForm.body_html} onChange={(nextValue) => setPostForm((previous) => ({ ...previous, body_html: nextValue }))} placeholder="Escreva um artigo completo, com subtitulos, listas, links e imagens." /></div></TabsContent>

            <TabsContent value="organizacao" className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Categoria</Label><Input value={postForm.category} onChange={(event) => setPostForm((previous) => ({ ...previous, category: event.target.value }))} placeholder="Ex.: Direito Trabalhista" />{categories.length ? <div className="flex flex-wrap gap-2">{categories.map((category) => <Button key={category.slug} type="button" variant="outline" size="sm" onClick={() => setPostForm((previous) => ({ ...previous, category: category.label }))}>{category.label}</Button>)}</div> : null}</div><div className="space-y-2"><Label>Ordem de exibição</Label><Input type="number" value={postForm.sort_order} onChange={(event) => setPostForm((previous) => ({ ...previous, sort_order: Number(event.target.value) || 0 }))} placeholder="0" /></div><div className="space-y-2"><Label>Tags</Label><Textarea value={postForm.tags_text} onChange={(event) => setPostForm((previous) => ({ ...previous, tags_text: event.target.value }))} rows={3} placeholder="Separe por vírgula: bancos, revisão contratual, consumidor" /></div><div className="space-y-3"><div className="space-y-2"><Label>Galeria complementar</Label><Textarea value={postForm.gallery_text} onChange={(event) => setPostForm((previous) => ({ ...previous, gallery_text: event.target.value }))} rows={3} placeholder="Informe uma URL por linha para exibir imagens adicionais no artigo." /></div><div className="flex items-center justify-between rounded-2xl border px-4 py-3"><div className="space-y-1"><p className="font-medium">Artigo em destaque</p><p className="text-sm text-muted-foreground">Use para priorizar conteúdos importantes na estratégia institucional.</p></div><Switch checked={postForm.is_featured} onCheckedChange={(checked) => setPostForm((previous) => ({ ...previous, is_featured: checked }))} /></div></div></div></TabsContent>

            <TabsContent value="seo" className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Título para o Google</Label><Input value={postForm.seo_title} onChange={(event) => setPostForm((previous) => ({ ...previous, seo_title: event.target.value }))} placeholder="Título otimizado para busca" /></div><div className="space-y-2 md:col-span-2"><Label>Descrição para o Google</Label><Textarea value={postForm.seo_description} onChange={(event) => setPostForm((previous) => ({ ...previous, seo_description: event.target.value }))} rows={4} placeholder="Resumo com foco em clique e relevância para o mecanismo de busca." /></div><div className="space-y-2 md:col-span-2"><Label>Palavras-chave</Label><Textarea value={postForm.seo_keywords_text} onChange={(event) => setPostForm((previous) => ({ ...previous, seo_keywords_text: event.target.value }))} rows={3} placeholder="Separe por vírgula: juros abusivos, defesa do consumidor, contratos bancários" /></div></div></TabsContent>

            <TabsContent value="publicacao" className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Status do artigo</Label><Select value={postForm.publication_status} onValueChange={(value) => setPostForm((previous) => ({ ...previous, publication_status: value as BlogPublicationStatus }))}><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger><SelectContent><SelectItem value="RASCUNHO">Rascunho</SelectItem><SelectItem value="PUBLICADO">Publicado</SelectItem><SelectItem value="AGENDADO">Agendado</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Data de publicação</Label><Input type="datetime-local" value={postForm.published_at} onChange={(event) => setPostForm((previous) => ({ ...previous, published_at: event.target.value }))} /><p className="text-xs text-muted-foreground">O status agendado organiza a pauta editorial; a publicação automática depende da automação do backend.</p></div></div></TabsContent>
          </Tabs>

          <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between"><div className="text-sm text-muted-foreground">{postForm.publication_status === "PUBLICADO" ? "O artigo sera exibido no site publico." : postForm.publication_status === "AGENDADO" ? "O artigo fica preparado para publicacao futura." : "O artigo permanece como rascunho interno."}</div><Button className="gap-2" onClick={() => savePostMutation.mutate()} disabled={savePostMutation.isPending}><Upload className="h-4 w-4" />{savePostMutation.isPending ? "Salvando..." : "Salvar artigo"}</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader><DialogTitle>Gerenciar categorias</DialogTitle><DialogDescription>Defina a estrutura editorial do blog e mantenha os artigos organizados por área de interesse.</DialogDescription></DialogHeader>
          <div className="space-y-6"><div className="grid gap-3 md:grid-cols-[1fr_auto]"><div className="space-y-2"><Label>{editingCategorySlug ? "Editar categoria" : "Nova categoria"}</Label><Input value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="Ex.: Dicas jurídicas" /></div><div className="flex items-end gap-2"><Button onClick={handleSaveCategory} disabled={categoryMutation.isPending}>{editingCategorySlug ? "Salvar" : "Adicionar"}</Button>{editingCategorySlug ? <Button variant="outline" onClick={() => { setEditingCategorySlug(null); setCategoryDraft(""); }}>Cancelar</Button> : null}</div></div><div className="space-y-3">{categories.length ? categories.map((category) => <div key={category.slug} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{category.label}</p><p className="text-sm text-muted-foreground">{category.usageCount} artigo(s) vinculados</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setEditingCategorySlug(category.slug); setCategoryDraft(category.label); }}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button variant="ghost" size="sm" onClick={() => handleRemoveCategory(category.slug)} disabled={categoryMutation.isPending}><Trash2 className="mr-2 h-4 w-4" />Remover</Button></div></div>) : <EmptyState icon={Sparkles} title="Nenhuma categoria cadastrada" description="Crie categorias para agrupar os assuntos do blog e orientar a produção de novos artigos." />}</div></div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!previewArticle} onOpenChange={(open) => !open && setPreviewArticle(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-4xl">
          <SheetHeader className="border-b pb-5"><SheetTitle>Preview do artigo</SheetTitle><SheetDescription>Visualização real do conteúdo antes da publicação.</SheetDescription></SheetHeader>
          <div className="py-6">{previewArticle ? <BlogPostPreview article={previewArticle} mode="compact" /> : null}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
