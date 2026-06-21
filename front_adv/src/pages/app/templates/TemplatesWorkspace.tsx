import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Pencil, Trash2, Copy, Download, Loader2, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/integrations/api/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/EmptyState';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { useToast } from '@/hooks/use-toast';
import {
  useLegalTemplatesPaged,
  useCreateLegalTemplate,
  useUpdateLegalTemplate,
  useDeleteLegalTemplate,
  useProcesses,
  getTotalPages,
} from '@/hooks/useApiData';
import { api } from '@/integrations/api/client';

const CATEGORY_OPTIONS = [
  'geral',
  'contrato',
  'procuracao',
  'peticao',
  'notificacao',
  'parecer',
  'recurso',
  'acordo',
  'declaracao',
];

const FORMAT_LABELS: Record<string, string> = {
  RICH_TEXT: 'Rich Text',
  PLAIN_TEXT: 'Texto Simples',
};

const CATEGORY_COLORS: Record<string, string> = {
  contrato: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  procuracao: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  peticao: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
  notificacao: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  parecer: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400',
  recurso: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400',
  acordo: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  declaracao: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400',
};

const PAGE_SIZE = 20;

type TemplateForm = {
  name: string;
  description: string;
  category: string;
  format: string;
  content: string;
};

const EMPTY_FORM: TemplateForm = {
  name: '',
  description: '',
  category: 'geral',
  format: 'RICH_TEXT',
  content: '',
};

function TemplateDialog({
  open,
  onClose,
  initial,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  initial?: TemplateForm | null;
  onSave: (data: TemplateForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<TemplateForm>(initial ?? EMPTY_FORM);

  // Sync form when dialog opens or initial data changes
  useEffect(() => {
    if (open) setForm(initial ?? EMPTY_FORM);
  }, [open, initial]);

  function set(key: keyof TemplateForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar modelo' : 'Novo modelo de documento'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Nome do modelo *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Contrato de honorários advocatícios" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Formato</Label>
              <Select value={form.format} onValueChange={(v) => set('format', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RICH_TEXT">Rich Text</SelectItem>
                  <SelectItem value="PLAIN_TEXT">Texto Simples</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Breve descrição do modelo (opcional)" />
          </div>
          <div className="grid gap-1.5">
            <Label>Conteúdo *</Label>
            {form.format === 'PLAIN_TEXT' ? (
              <textarea
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                rows={12}
                placeholder="Conteúdo do modelo..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            ) : (
              <RichTextEditor
                value={form.content}
                onChange={(html) => set('content', html)}
                placeholder="Conteúdo do modelo..."
                minHeight={320}
              />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim() || !form.content.trim()}
          >
            {saving ? 'Salvando...' : 'Salvar modelo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GenerateDialog({
  template,
  onClose,
}: {
  template: any | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: processes = [] } = useProcesses();
  const [processId, setProcessId] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);

  function reset() {
    setProcessId('');
    setTitle('');
    setResult(null);
  }

  async function generate() {
    if (!template || !processId) return;
    setLoading(true);
    try {
      // Step 1: create editor document from template content
      const doc: any = await api.post('/editor-documents/', {
        title: title.trim() || template.name,
        content_html: template.content,
        process: processId,
      });
      // Step 2: export to PDF
      const pdf: any = await api.post(`/editor-documents/${doc.id}/export-pdf/`, {});
      setResult({ url: pdf.file_download_url ?? pdf.file ?? pdf.url ?? '', name: doc.title ?? template.name });
      toast({ title: 'Documento gerado com sucesso!' });
    } catch (e: any) {
      toast({ title: e?.message || 'Erro ao gerar documento.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const open = !!template;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar documento</DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/40 dark:bg-green-950/20">
              <FileText className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Documento gerado</p>
                <p className="truncate text-xs text-green-700 dark:text-green-400">{result.name}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); onClose(); }}>Fechar</Button>
              {result.url && (
                <Button asChild className="gap-2">
                  <a href={result.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                    Baixar PDF
                  </a>
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="grid gap-1.5">
                <Label>Processo *</Label>
                <Select value={processId} onValueChange={setProcessId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o processo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(processes as any[]).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.number ? `${p.number} — ` : ''}{p.title ?? p.name ?? p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Título do documento <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={template?.name ?? 'Deixe em branco para usar o nome do modelo'}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
              <Button onClick={generate} disabled={loading || !processId} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {loading ? 'Gerando...' : 'Gerar PDF'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VersionHistoryDialog({
  template,
  onClose,
  onRestore,
}: {
  template: any | null;
  onClose: () => void;
  onRestore: (content: string) => void;
}) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ['template-versions', template?.id],
    queryFn: () => api.get<any[]>(`/legal-templates/${template!.id}/versions/`),
    enabled: !!template?.id,
    retry: false,
  });

  const open = !!template;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de versões</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{template?.name}</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !versions?.length ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Nenhuma versão anterior registrada.
            <p className="mt-1 text-xs">As versões são salvas automaticamente a cada edição.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[360px]">
            <div className="space-y-2 pr-1">
              {versions.map((v: any, i: number) => (
                <div key={v.id ?? i} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">v{v.version ?? (versions.length - i)}</span>
                      <span className="text-xs text-muted-foreground">
                        {v.created_at ? new Date(v.created_at).toLocaleString('pt-BR') : '—'}
                      </span>
                    </div>
                    {v.changed_by_email && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Por: {v.changed_by_email}</p>
                    )}
                    {v.change_summary && (
                      <p className="mt-0.5 text-xs text-foreground">{v.change_summary}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-xs"
                    onClick={() => { onRestore(v.content ?? ''); onClose(); }}
                  >
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TemplatesWorkspace() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [generateTarget, setGenerateTarget] = useState<any | null>(null);
  const [historyTarget, setHistoryTarget] = useState<any | null>(null);

  const filters: Record<string, any> = {};
  if (categoryFilter !== 'all') filters.category = categoryFilter;

  const { data: paged, isLoading } = useLegalTemplatesPaged(
    filters,
    search || undefined,
    page,
    { column: 'created_at', ascending: false },
  );

  const templates = paged?.results ?? [];
  const totalCount = paged?.count ?? 0;
  const totalPages = getTotalPages(totalCount, PAGE_SIZE);

  const createMutation = useCreateLegalTemplate();
  const updateMutation = useUpdateLegalTemplate();
  const deleteMutation = useDeleteLegalTemplate();

  const saving = createMutation.isPending || updateMutation.isPending;

  function openCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(t: any) {
    setEditTarget(t);
    setDialogOpen(true);
  }

  function handleDuplicate(t: any) {
    setEditTarget(null);
    setDialogOpen(true);
    setTimeout(() => {
      setEditTarget({
        name: `${t.name} (cópia)`,
        description: t.description ?? '',
        category: t.category,
        format: t.format,
        content: t.content,
      });
    }, 0);
  }

  async function handleSave(form: TemplateForm) {
    try {
      if (editTarget?.id) {
        await updateMutation.mutateAsync({ id: editTarget.id, ...form });
        toast({ title: 'Modelo atualizado com sucesso.' });
      } else {
        await createMutation.mutateAsync(form);
        toast({ title: 'Modelo criado com sucesso.' });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: 'Erro ao salvar modelo.', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: 'Modelo excluído.' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Erro ao excluir modelo.', variant: 'destructive' });
    }
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  const dialogInitial = editTarget
    ? {
        name: editTarget.name ?? '',
        description: editTarget.description ?? '',
        category: editTarget.category ?? 'geral',
        format: editTarget.format ?? 'RICH_TEXT',
        content: editTarget.content ?? '',
      }
    : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Documentos</p>
          <h1 className="page-title">Modelos de documentos</h1>
          <p className="page-subtitle mt-1">Gerencie templates reutilizáveis com variáveis dinâmicas.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo modelo
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="kpi">
          <p className="kpi-label">Total de modelos</p>
          <p className="kpi-value">{totalCount}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Categorias ativas</p>
          <p className="kpi-value">
            {new Set(templates.map((t: any) => t.category)).size}
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Rich text</p>
          <p className="kpi-value">{templates.filter((t: any) => t.format === 'RICH_TEXT').length}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Texto simples</p>
          <p className="kpi-value">{templates.filter((t: any) => t.format === 'PLAIN_TEXT').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nome, categoria..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="table-editorial w-full">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Formato</th>
              <th>Versão</th>
              <th>Criado em</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </td>
              </tr>
            ) : templates.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={FileText}
                    title="Nenhum modelo cadastrado"
                    description="Crie modelos de documentos reutilizáveis com variáveis dinâmicas."
                    action={{ label: 'Criar modelo', onClick: openCreate }}
                  />
                </td>
              </tr>
            ) : (
              templates.map((t: any) => (
                <tr key={t.id}>
                  <td>
                    <div>
                      <p className="font-medium text-foreground text-sm">{t.name}</p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5">{t.description}</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium capitalize ${CATEGORY_COLORS[t.category] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {t.category}
                    </Badge>
                  </td>
                  <td className="text-sm text-muted-foreground">{FORMAT_LABELS[t.format] ?? t.format}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setHistoryTarget(t)}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      title="Ver histórico de versões"
                    >
                      v{t.version}
                    </button>
                  </td>
                  <td className="whitespace-nowrap text-xs text-muted-foreground font-mono-ui">{fmtDate(t.created_at)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        title="Gerar documento"
                        onClick={() => setGenerateTarget(t)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Histórico de versões"
                        onClick={() => setHistoryTarget(t)}
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Duplicar"
                        onClick={() => handleDuplicate(t)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Editar"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Excluir"
                        onClick={() => setDeleteTarget(t)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount} modelo{totalCount !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span className="flex items-center px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      <GenerateDialog
        template={generateTarget}
        onClose={() => setGenerateTarget(null)}
      />

      <VersionHistoryDialog
        template={historyTarget}
        onClose={() => setHistoryTarget(null)}
        onRestore={(content) => {
          if (!historyTarget) return;
          openEdit({ ...historyTarget, content });
        }}
      />

      <TemplateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={dialogInitial}
        onSave={handleSave}
        saving={saving}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir modelo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o modelo <strong className="text-foreground">"{deleteTarget?.name}"</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
