import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, FileText, Loader2, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, apiUpload } from '@/integrations/api/client';

type PortalProcess = { id: string; title?: string | null; cnj?: string | null };
type Doc = {
  id: string;
  title?: string | null;
  filename?: string | null;
  category?: string | null;
  created_at?: string;
  download_url?: string | null;
  file_download_url?: string | null;
};
type Paginated<T> = { results: T[]; count: number; next: string | null; previous: string | null };

type DocWithProcess = Doc & { processId: string; processTitle: string };

async function loadProcesses(): Promise<PortalProcess[]> {
  const processes = await api.get<Paginated<PortalProcess>>('/portal/processes/');
  return processes?.results ?? [];
}

async function loadDocuments(): Promise<DocWithProcess[]> {
  const base = await loadProcesses();
  const docsByProcess = await Promise.all(
    base.slice(0, 12).map(async (p) => {
      try {
        const docs = await api.get<Paginated<Doc>>(`/portal/processes/${p.id}/documents/`);
        return (docs?.results ?? []).map((d) => ({
          ...d,
          processId: p.id,
          processTitle: p.title || p.cnj || 'Processo',
        }));
      } catch {
        return [];
      }
    }),
  );
  return docsByProcess.flat();
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PortalDocuments() {
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadProcessId, setUploadProcessId] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['portal-documents'],
    queryFn: loadDocuments,
  });

  const processesQuery = useQuery({
    queryKey: ['portal-processes-for-upload'],
    queryFn: loadProcesses,
    enabled: uploadOpen,
  });

  const docs = useMemo(() => {
    const all = data ?? [];
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (d) =>
        (d.title || d.filename || '').toLowerCase().includes(q) ||
        d.processTitle.toLowerCase().includes(q) ||
        (d.category || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  async function handleUpload() {
    if (!uploadProcessId || !uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadTitle.trim()) formData.append('title', uploadTitle.trim());
      await apiUpload(`/portal/processes/${uploadProcessId}/documents/upload/`, formData);
      toast.success('Documento enviado ao escritório com sucesso.');
      setUploadOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadProcessId('');
      queryClient.invalidateQueries({ queryKey: ['portal-documents'] });
    } catch (error: any) {
      toast.error(error?.message || 'Falha ao enviar o documento.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Portal do cliente</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
            Documentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arquivos disponibilizados pelo escritório e envio de documentos do seu caso.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2 self-start sm:self-auto">
          <Upload className="h-4 w-4" />
          Enviar documento
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar documentos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">Nenhum documento encontrado</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {search ? 'Tente buscar por outro termo.' : 'O escritório ainda não disponibilizou documentos.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {docs.map((d, i) => (
            <div
              key={d.id}
              className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? 'border-t border-border' : ''}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {d.title || d.filename || 'Documento'}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <Link
                    to={`/portal/processos/${d.processId}`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {d.processTitle}
                  </Link>
                  {d.category && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {d.category === 'portal' ? 'Enviado por você' : d.category}
                    </Badge>
                  )}
                  {d.created_at && (
                    <span className="text-[10px] text-muted-foreground">{formatDate(d.created_at)}</span>
                  )}
                </div>
              </div>
              {d.download_url || d.file_download_url ? (
                <a
                  href={d.download_url || d.file_download_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                    <Download className="h-3.5 w-3.5" />
                    Baixar
                  </Button>
                </a>
              ) : (
                <Button size="sm" variant="outline" disabled className="shrink-0">
                  Indisponível
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!open) setUploadOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar documento ao escritório</DialogTitle>
            <DialogDescription>
              Anexe contratos, comprovantes ou qualquer arquivo do seu caso (até 25 MB).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Processo *</Label>
              <Select value={uploadProcessId} onValueChange={setUploadProcessId}>
                <SelectTrigger>
                  <SelectValue placeholder={processesQuery.isLoading ? 'Carregando processos…' : 'Selecione o processo'} />
                </SelectTrigger>
                <SelectContent>
                  {(processesQuery.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.cnj || p.title || 'Processo'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Título (opcional)</Label>
              <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Ex.: Comprovante de pagamento" />
            </div>
            <div className="grid gap-1.5">
              <Label>Arquivo *</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:opacity-90"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  {uploadFile.name} · {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadProcessId || !uploadFile}>
              {uploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</>) : 'Enviar documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
