import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AudioLines,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FolderInput,
  Grid2X2,
  LayoutList,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Search,
  Share2,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useTenant } from '@/contexts/TenantContext';
import type { DocumentFile } from '@/types/models';
import {
  DOCUMENT_CATEGORY_OPTIONS,
  canPreviewInline,
  deleteDocument,
  fetchDocumentAsFile,
  filterDocumentGroups,
  formatDocumentDate,
  formatFileSize,
  getDocumentKind,
  getDocumentUrl,
  groupDocuments,
  patchDocument,
  type DocumentGroup,
  type UploadQueueItem,
  uploadProcessDocumentWithProgress,
} from './utils';

type ProcessDocumentsCenterProps = {
  processId: string;
  processNumber?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  documents: DocumentFile[];
  isLoading: boolean;
  isError: boolean;
};

function fileIcon(kind: ReturnType<typeof getDocumentKind>) {
  if (kind === 'image') return FileImage;
  if (kind === 'video') return FileVideo;
  if (kind === 'audio') return AudioLines;
  if (kind === 'sheet') return FileSpreadsheet;
  if (kind === 'archive') return FileArchive;
  return FileText;
}

function UploadQueueCard({
  items,
  onAddFiles,
  onChangeTitle,
  onRemove,
  onUpload,
  category,
  accessLevel,
  allowedRolesText,
  onCategoryChange,
  onAccessLevelChange,
  onAllowedRolesChange,
  isUploading,
}: {
  items: UploadQueueItem[];
  onAddFiles: (files: File[]) => void;
  onChangeTitle: (id: string, title: string) => void;
  onRemove: (id: string) => void;
  onUpload: () => Promise<void>;
  category: string;
  accessLevel: 'TENANT' | 'ROLES';
  allowedRolesText: string;
  onCategoryChange: (value: string) => void;
  onAccessLevelChange: (value: 'TENANT' | 'ROLES') => void;
  onAllowedRolesChange: (value: string) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="text-base">Upload de arquivos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onAddFiles(Array.from(event.dataTransfer.files));
          }}
          className="rounded-2xl border-2 border-dashed border-border p-6 text-center transition hover:border-primary/50 hover:bg-primary/5"
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.mp4,.mp3,.txt,.csv"
            onChange={(event) => onAddFiles(Array.from(event.target.files ?? []))}
          />
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Arraste arquivos aqui ou selecione do computador</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF, DOC, imagens, vídeos, áudios e formatos usuais do escritório.</p>
          <Button variant="outline" className="mt-4" onClick={() => inputRef.current?.click()}>
            Enviar arquivo
          </Button>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={onCategoryChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select value={accessLevel} onValueChange={(value) => onAccessLevelChange(value as 'TENANT' | 'ROLES')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TENANT">Interno do escritório</SelectItem>
                  <SelectItem value="ROLES">Perfis específicos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {accessLevel === 'ROLES' ? (
            <div className="space-y-2">
              <Label>Perfis permitidos</Label>
              <Input value={allowedRolesText} onChange={(event) => onAllowedRolesChange(event.target.value)} placeholder="OWNER,ADMIN,LAWYER,ASSISTANT" />
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
              Nenhum arquivo na fila. Adicione um ou mais documentos para iniciar o envio.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input value={item.title} onChange={(event) => onChangeTitle(item.id, event.target.value)} />
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{item.file.name}</span>
                      <span>{formatFileSize(item.file.size)}</span>
                      <span>{item.status === 'error' ? item.error || 'Erro' : item.status}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)} disabled={item.status === 'uploading'}>
                    Remover
                  </Button>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        <Button className="w-full" onClick={onUpload} disabled={items.length === 0 || isUploading}>
          {isUploading ? 'Enviando arquivos...' : 'Iniciar upload'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ProcessDocumentsCenter({
  processId,
  processNumber,
  clientId,
  clientName,
  documents,
  isLoading,
  isError,
}: ProcessDocumentsCenterProps) {
  const qc = useQueryClient();
  const { activeTenantId } = useTenant();
  const [layout, setLayout] = useState<'list' | 'cards'>('list');
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState('all');
  const [category, setCategory] = useState('all');
  const [responsible, setResponsible] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [uploadCategory, setUploadCategory] = useState('geral');
  const [uploadAccessLevel, setUploadAccessLevel] = useState<'TENANT' | 'ROLES'>('TENANT');
  const [uploadAllowedRolesText, setUploadAllowedRolesText] = useState('');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [renameTargetKey, setRenameTargetKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTargetKey, setDeleteTargetKey] = useState<string | null>(null);

  const groups = useMemo(() => groupDocuments(documents), [documents]);
  const filteredGroups = useMemo(
    () => filterDocumentGroups(groups, { search, fileType, category, responsible, dateRange, sortBy, processNumber, clientName }),
    [groups, search, fileType, category, responsible, dateRange, sortBy, processNumber, clientName],
  );
  const previewGroup = useMemo(() => groups.find((group) => group.key === previewKey) || null, [groups, previewKey]);
  const renameTarget = useMemo(() => groups.find((group) => group.key === renameTargetKey) || null, [groups, renameTargetKey]);
  const deleteTarget = useMemo(() => groups.find((group) => group.key === deleteTargetKey) || null, [groups, deleteTargetKey]);
  const responsibleOptions = useMemo(
    () => Array.from(new Set(groups.map((group) => String(group.latest.uploaded_by || 'escritório')))).sort(),
    [groups],
  );

  const invalidateDocuments = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['process', activeTenantId, processId, 'documents'] }),
      qc.invalidateQueries({ queryKey: ['documents-files', activeTenantId] }),
    ]);
  };

  const updateQueueItem = (id: string, patch: Partial<UploadQueueItem>) => {
    setUploadQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addFilesToQueue = (files: File[]) => {
    const allowedRoles = uploadAccessLevel === 'ROLES' ? uploadAllowedRolesText.split(',').map((item) => item.trim()).filter(Boolean) : [];
    const nextItems = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      title: file.name,
      category: uploadCategory,
      accessLevel: uploadAccessLevel,
      allowedRoles,
      progress: 0,
      status: 'queued',
    })) satisfies UploadQueueItem[];

    setUploadQueue((current) => [...current, ...nextItems]);
  };

  const runUploadQueue = async () => {
    setIsUploading(true);
    try {
      for (const item of uploadQueue.filter((current) => current.status === 'queued' || current.status === 'error')) {
        updateQueueItem(item.id, { status: 'uploading', progress: 0, error: undefined });
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('title', item.title || item.file.name);
        formData.append('category', item.category || 'geral');
        formData.append('access_level', item.accessLevel);
        if (clientId) formData.append('client', clientId);
        if (item.allowedRoles.length) formData.append('allowed_roles', JSON.stringify(item.allowedRoles));

        try {
          await uploadProcessDocumentWithProgress(processId, formData, (progress) => updateQueueItem(item.id, { progress }));
          updateQueueItem(item.id, { status: 'success', progress: 100 });
        } catch (error: any) {
          updateQueueItem(item.id, { status: 'error', error: error?.message || 'Falha no upload.' });
        }
      }
      await invalidateDocuments();
      toast.success('Fila de upload processada.');
      setUploadQueue((current) => current.filter((item) => item.status !== 'success'));
    } finally {
      setIsUploading(false);
    }
  };

  const runGroupUpload = async (group: DocumentGroup, restoreFrom?: DocumentFile) => {
    const source = restoreFrom || group.latest;
    const file = await fetchDocumentAsFile(source, source.filename || source.title || 'documento');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('group_id', group.latest.group_id || group.latest.id);
    formData.append('title', source.title || source.filename || file.name);
    formData.append('category', source.category || 'geral');
    formData.append('access_level', source.access_level || 'TENANT');
    if (clientId) formData.append('client', clientId);
    if (source.allowed_roles?.length) formData.append('allowed_roles', JSON.stringify(source.allowed_roles));
    await uploadProcessDocumentWithProgress(processId, formData, () => {});
    await invalidateDocuments();
  };

  const duplicateAsNewDocument = async (group: DocumentGroup) => {
    const source = group.latest;
    const file = await fetchDocumentAsFile(source, source.filename || source.title || 'documento');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', `${source.title || source.filename || file.name} (copia)`);
    formData.append('category', source.category || 'geral');
    formData.append('access_level', source.access_level || 'TENANT');
    if (clientId) formData.append('client', clientId);
    if (source.allowed_roles?.length) formData.append('allowed_roles', JSON.stringify(source.allowed_roles));
    await uploadProcessDocumentWithProgress(processId, formData, () => {});
    await invalidateDocuments();
  };

  const openRenameDialog = (group: DocumentGroup) => {
    setRenameTargetKey(group.key);
    setRenameValue(group.latest.title || group.latest.filename || 'Documento');
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    await patchDocument(renameTarget.latest.id, { title: renameValue.trim() || renameTarget.latest.filename });
    await invalidateDocuments();
    toast.success('Documento renomeado.');
    setRenameTargetKey(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await Promise.all(deleteTarget.versions.map((version) => deleteDocument(version.id)));
    await invalidateDocuments();
    toast.success('Documento removido com todas as versões.');
    setDeleteTargetKey(null);
    setPreviewKey(null);
  };

  const handleShare = async (document: DocumentFile) => {
    const url = getDocumentUrl(document);
    if (!url) {
      toast.error('Documento sem link disponível.');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado.');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const renderPreview = (document: DocumentFile) => {
    const url = getDocumentUrl(document);
    const kind = getDocumentKind(document);
    if (!url) return <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">Arquivo indisponível para visualização.</div>;
    if (kind === 'image') return <img src={url} alt={document.title || document.filename || 'Documento'} className="max-h-[60vh] w-full rounded-2xl object-contain" />;
    if (kind === 'video') return <video src={url} controls className="max-h-[60vh] w-full rounded-2xl border bg-black" />;
    if (kind === 'audio') return <audio src={url} controls className="w-full" />;
    if (kind === 'pdf' || kind === 'text') return <iframe src={url} title={document.title || document.filename || 'Documento'} className="h-[65vh] w-full rounded-2xl border" />;
    return <div className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">Preview não disponível para este formato. Use download ou compartilhamento.</div>;
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_420px]">
      <div className="space-y-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-xl">Central de documentos</CardTitle>
            <p className="text-sm text-muted-foreground">Arquivos reais, histórico de versões, permissões e acesso rápido por processo.</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border bg-background p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Documentos</p><p className="mt-2 text-2xl font-semibold">{groups.length}</p></div>
              <div className="rounded-2xl border bg-background p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Versões</p><p className="mt-2 text-2xl font-semibold">{documents.length}</p></div>
              <div className="rounded-2xl border bg-background p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Restritos</p><p className="mt-2 text-2xl font-semibold">{groups.filter((group) => group.latest.access_level === 'ROLES').length}</p></div>
              <div className="rounded-2xl border bg-background p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cliente</p><p className="mt-2 truncate text-base font-semibold">{clientName || 'Não vinculado'}</p></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_repeat(4,180px)_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por nome, cliente ou processo" />
              </div>
              <Select value={fileType} onValueChange={setFileType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="pdf">PDF</SelectItem><SelectItem value="image">Imagem</SelectItem><SelectItem value="video">Vídeo</SelectItem><SelectItem value="audio">Áudio</SelectItem><SelectItem value="doc">Documento</SelectItem><SelectItem value="sheet">Planilha</SelectItem></SelectContent></Select>
              <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{DOCUMENT_CATEGORY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
              <Select value={responsible} onValueChange={setResponsible}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os responsáveis</SelectItem>{responsibleOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>
              <Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Qualquer data</SelectItem><SelectItem value="today">Hoje</SelectItem><SelectItem value="7d">7 dias</SelectItem><SelectItem value="30d">30 dias</SelectItem></SelectContent></Select>
              <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">Mais recentes</SelectItem><SelectItem value="name">Nome</SelectItem><SelectItem value="size">Tamanho</SelectItem><SelectItem value="type">Tipo</SelectItem></SelectContent></Select>
              <div className="flex items-center gap-2">
                <Button variant={layout === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setLayout('list')}><LayoutList className="h-4 w-4" /></Button>
                <Button variant={layout === 'cards' ? 'default' : 'outline'} size="icon" onClick={() => setLayout('cards')}><Grid2X2 className="h-4 w-4" /></Button>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-20 rounded-2xl bg-muted" />)}</div>
            ) : isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">Não foi possível carregar a central de documentos.</div>
            ) : filteredGroups.length === 0 ? (
              <EmptyState title="Nenhum documento encontrado" description="Envie arquivos ou ajuste os filtros para popular a central deste processo." />
            ) : (
              <div className={layout === 'cards' ? 'grid gap-4 md:grid-cols-2' : 'space-y-3'}>
                {filteredGroups.map((group) => {
                  const latest = group.latest;
                  const kind = getDocumentKind(latest);
                  const Icon = fileIcon(kind);
                  const url = getDocumentUrl(latest);
                  return (
                    <div key={group.key} className="rounded-2xl border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <button type="button" className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => setPreviewKey(group.key)}>
                          <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                          <div className="min-w-0 space-y-2">
                            <p className="truncate text-base font-semibold">{latest.title || latest.filename || 'Documento'}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span>{formatFileSize(latest.file_size)}</span>
                              <span>{formatDocumentDate(latest.created_at)}</span>
                              <span>{latest.uploaded_by || 'Escritório'}</span>
                              <span>{processNumber || 'Processo vinculado'}</span>
                              {clientName ? <span>{clientName}</span> : null}
                            </div>
                          </div>
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Ações do documento</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setPreviewKey(group.key)}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')} disabled={!url}><Download className="mr-2 h-4 w-4" />Baixar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRenameDialog(group)}><Pencil className="mr-2 h-4 w-4" />Renomear</DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => { await duplicateAsNewDocument(group); toast.success('Documento duplicado como novo arquivo.'); }}><Copy className="mr-2 h-4 w-4" />Duplicar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(latest)}><Share2 className="mr-2 h-4 w-4" />Compartilhar</DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger><FolderInput className="mr-2 h-4 w-4" />Mover para categoria</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
                                  <DropdownMenuItem key={option.value} onClick={async () => { await patchDocument(latest.id, { category: option.value }); await invalidateDocuments(); toast.success('Categoria atualizada.'); }}>
                                    {option.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger><Shield className="mr-2 h-4 w-4" />Permissão</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={async () => { await patchDocument(latest.id, { access_level: 'TENANT', allowed_roles: [] }); await invalidateDocuments(); toast.success('Documento liberado para o escritório.'); }}>Interno do escritório</DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => { await patchDocument(latest.id, { access_level: 'ROLES', allowed_roles: ['OWNER', 'ADMIN', 'LAWYER', 'ASSISTANT'] }); await invalidateDocuments(); toast.success('Documento restrito a perfis internos.'); }}>Equipe jurídica</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteTargetKey(group.key)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-muted px-2.5 py-1">{latest.category || 'geral'}</span>
                        <span className="rounded-full bg-muted px-2.5 py-1">{latest.access_level === 'ROLES' ? 'Restrito' : 'Interno'}</span>
                        <span className="rounded-full bg-muted px-2.5 py-1">{group.versions.length} versão(ões)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <UploadQueueCard
          items={uploadQueue}
          onAddFiles={addFilesToQueue}
          onChangeTitle={(id, title) => updateQueueItem(id, { title })}
          onRemove={(id) => setUploadQueue((current) => current.filter((item) => item.id !== id))}
          onUpload={runUploadQueue}
          category={uploadCategory}
          accessLevel={uploadAccessLevel}
          allowedRolesText={uploadAllowedRolesText}
          onCategoryChange={setUploadCategory}
          onAccessLevelChange={setUploadAccessLevel}
          onAllowedRolesChange={setUploadAllowedRolesText}
          isUploading={isUploading}
        />
      </div>

      <Sheet open={!!previewGroup} onOpenChange={(open) => !open && setPreviewKey(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-3xl">
          {previewGroup ? (
            <>
              <SheetHeader className="border-b pb-5">
                <SheetTitle>{previewGroup.latest.title || previewGroup.latest.filename || 'Documento'}</SheetTitle>
                <SheetDescription>{formatDocumentDate(previewGroup.latest.created_at)} - {formatFileSize(previewGroup.latest.file_size)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 py-6">
                {renderPreview(previewGroup.latest)}
                <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
                  <div className="rounded-2xl border p-4">Tipo: {getDocumentKind(previewGroup.latest)}</div>
                  <div className="rounded-2xl border p-4">Responsável: {previewGroup.latest.uploaded_by || 'Escritório'}</div>
                  <div className="rounded-2xl border p-4">Processo: {processNumber || 'Vinculado ao processo atual'}</div>
                  <div className="rounded-2xl border p-4">Cliente: {clientName || 'Não vinculado'}</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Histórico de versões</p>
                  </div>
                  {previewGroup.versions.map((version) => (
                    <div key={version.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">v{version.version || 1} - {version.title || version.filename || 'Documento'}</p>
                        <p className="text-sm text-muted-foreground">{formatDocumentDate(version.created_at)} - {version.uploaded_by || 'Escritório'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(getDocumentUrl(version) || '#', '_blank', 'noopener,noreferrer')} disabled={!getDocumentUrl(version)}>Baixar</Button>
                        {!version.is_latest ? <Button size="sm" variant="secondary" onClick={async () => { await runGroupUpload(previewGroup, version); toast.success('Versão restaurada como atual.'); }}>Restaurar versão</Button> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTargetKey(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear documento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo nome</Label>
              <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameTargetKey(null)}>Cancelar</Button>
              <Button onClick={handleRename}>Salvar nome</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTargetKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>Esta ação remove o documento e todas as versões relacionadas a este processo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir definitivamente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
