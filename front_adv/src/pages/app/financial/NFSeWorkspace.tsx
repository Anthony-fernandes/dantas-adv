import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, ExternalLink, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';

type NFSe = {
  id: string;
  numero: string | null;
  cliente_nome: string;
  valor_servico: string;
  competencia: string;
  status: 'rascunho' | 'emitida' | 'cancelada' | 'erro';
  pdf_url: string | null;
  erro_mensagem: string | null;
};

type ClientItem = { id: string; full_name?: string; name?: string };

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-muted text-muted-foreground border-border' },
  emitida: { label: 'Emitida', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-700 border-red-200' },
  erro: { label: 'Erro', className: 'bg-red-100 text-red-700 border-red-200' },
};

type EmitirForm = {
  cliente: string;
  valor_servico: string;
  descricao: string;
  codigo_servico: string;
  aliquota_iss: string;
  competencia: string;
};

const EMPTY_FORM: EmitirForm = {
  cliente: '',
  valor_servico: '',
  descricao: '',
  codigo_servico: '6014',
  aliquota_iss: '5',
  competencia: new Date().toISOString().slice(0, 7),
};

export default function NFSeWorkspace() {
  const { activeTenantId } = useTenant();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<EmitirForm>({ ...EMPTY_FORM });
  const [emitindoId, setEmitindoId] = useState<string | null>(null);

  const nfseQuery = useQuery({
    queryKey: ['nfse'],
    queryFn: () => api.get<{ results: NFSe[] }>('/nfse/').then((r) => (Array.isArray(r) ? r : r.results ?? [])),
  });

  const clientsQuery = useQuery({
    queryKey: ['clients-light'],
    queryFn: () => api.get<{ results: ClientItem[] }>('/clients/').then((r) => (Array.isArray(r) ? r : r.results ?? [])),
  });

  const tenantQuery = useQuery({
    queryKey: ['tenant-settings', activeTenantId],
    queryFn: () => api.get<any>(`/tenants/${activeTenantId}/`),
    enabled: !!activeTenantId,
  });

  const settings = tenantQuery.data?.settings ?? {};

  const createMutation = useMutation({
    mutationFn: () => api.post('/nfse/', {
      cliente: form.cliente,
      valor_servico: form.valor_servico,
      descricao: form.descricao,
      codigo_servico: form.codigo_servico,
      aliquota_iss: form.aliquota_iss,
      competencia: form.competencia,
    }),
    onSuccess: () => {
      toast({ title: 'NFS-e criada com sucesso!' });
      qc.invalidateQueries({ queryKey: ['nfse'] });
      setDialogOpen(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (e: any) => {
      toast({ title: e?.message || 'Erro ao criar NFS-e', variant: 'destructive' });
    },
  });

  async function handleEmitir(id: string) {
    setEmitindoId(id);
    try {
      await api.post(`/nfse/${id}/emitir/`);
      toast({ title: 'NFS-e emitida com sucesso!' });
      qc.invalidateQueries({ queryKey: ['nfse'] });
    } catch (e: any) {
      toast({ title: e?.message || 'Erro ao emitir NFS-e', variant: 'destructive' });
    } finally {
      setEmitindoId(null);
    }
  }

  const nfses: NFSe[] = nfseQuery.data ?? [];
  const clients: ClientItem[] = clientsQuery.data ?? [];

  function setField(field: keyof EmitirForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function openDialog() {
    setForm({
      ...EMPTY_FORM,
      codigo_servico: settings?.nfse_codigo_servico ?? '6014',
      aliquota_iss: settings?.nfse_aliquota_iss ?? '5',
    });
    setDialogOpen(true);
  }

  const formatCurrency = (v: string) =>
    parseFloat(v || '0').toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatCompetencia = (v: string) => {
    if (!v) return '-';
    const [year, month] = v.split('-');
    return `${month}/${year}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">NFS-e</h2>
          <p className="text-sm text-muted-foreground">Notas fiscais de serviço eletrônicas</p>
        </div>
        <Button onClick={openDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Emitir NFS-e
        </Button>
      </div>

      {nfseQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : nfses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma NFS-e encontrada</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={openDialog}>
            Emitir primeira NFS-e
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nfses.map((n) => {
                const st = STATUS_MAP[n.status] ?? { label: n.status, className: 'bg-muted text-muted-foreground border-border' };
                return (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono text-sm">{n.numero ?? '—'}</TableCell>
                    <TableCell>{n.cliente_nome}</TableCell>
                    <TableCell>{formatCurrency(n.valor_servico)}</TableCell>
                    <TableCell>{formatCompetencia(n.competencia)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={st.className}>{st.label}</Badge>
                      {n.erro_mensagem && (
                        <p className="mt-0.5 text-xs text-red-600">{n.erro_mensagem}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {n.status === 'rascunho' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleEmitir(n.id)}
                            disabled={emitindoId === n.id}
                          >
                            {emitindoId === n.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Emitir
                          </Button>
                        )}
                        {n.pdf_url && (
                          <a href={n.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                              <ExternalLink className="h-3.5 w-3.5" />
                              PDF
                            </Button>
                          </a>
                        )}
                        {n.status === 'emitida' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                            onClick={async () => {
                              try {
                                await api.post(`/nfse/${n.id}/cancelar/`);
                                toast({ title: 'NFS-e cancelada.' });
                                qc.invalidateQueries({ queryKey: ['nfse'] });
                              } catch (e: any) {
                                toast({ title: e?.message || 'Erro ao cancelar', variant: 'destructive' });
                              }
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Emitir NFS-e</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Cliente *</Label>
              <Select value={form.cliente} onValueChange={(v) => setField('cliente', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name ?? c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor do serviço (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor_servico}
                  onChange={(e) => setField('valor_servico', e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Competência *</Label>
                <Input
                  type="month"
                  value={form.competencia}
                  onChange={(e) => setField('competencia', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição do serviço *</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setField('descricao', e.target.value)}
                placeholder="Prestação de serviços jurídicos"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Código serviço LC116</Label>
                <Input
                  value={form.codigo_servico}
                  onChange={(e) => setField('codigo_servico', e.target.value)}
                  placeholder="6014"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Alíquota ISS (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.aliquota_iss}
                  onChange={(e) => setField('aliquota_iss', e.target.value)}
                  placeholder="5"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.cliente || !form.valor_servico || !form.descricao}
              className="gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar NFS-e
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
