import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Plus, Scale, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { api, apiGetAllPages } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';
import { maskCpfCnpj, maskPhoneBR } from '@/lib/masks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/EmptyState';

export type ProcessPartyRecord = {
  id: string;
  process: string;
  role: string;
  role_label?: string;
  name: string;
  doc?: string | null;
  is_client?: boolean;
  client?: string | null;
  lawyer_name?: string;
  lawyer_oab?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string;
};

const ROLE_OPTIONS = [
  { value: 'autor', label: 'Autor / Requerente' },
  { value: 'reu', label: 'Réu / Requerido' },
  { value: 'terceiro', label: 'Terceiro interessado' },
  { value: 'assistente', label: 'Assistente' },
  { value: 'testemunha', label: 'Testemunha' },
  { value: 'perito', label: 'Perito' },
  { value: 'mp', label: 'Ministério Público' },
  { value: 'outro', label: 'Outro' },
];

const ROLE_BADGE: Record<string, string> = {
  autor: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  reu: 'border-rose-200 bg-rose-50 text-rose-700',
  terceiro: 'border-sky-200 bg-sky-50 text-sky-700',
  assistente: 'border-violet-200 bg-violet-50 text-violet-700',
  testemunha: 'border-amber-200 bg-amber-50 text-amber-700',
  perito: 'border-slate-200 bg-slate-100 text-slate-700',
  mp: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  outro: 'border-slate-200 bg-slate-100 text-slate-700',
};

type PartyForm = {
  role: string;
  name: string;
  doc: string;
  is_client: boolean;
  lawyer_name: string;
  lawyer_oab: string;
  email: string;
  phone: string;
  notes: string;
};

const EMPTY_FORM: PartyForm = {
  role: 'autor',
  name: '',
  doc: '',
  is_client: false,
  lawyer_name: '',
  lawyer_oab: '',
  email: '',
  phone: '',
  notes: '',
};

export function ProcessPartiesTab({ processId }: { processId: string }) {
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessPartyRecord | null>(null);
  const [form, setForm] = useState<PartyForm>(EMPTY_FORM);

  const partiesQuery = useQuery({
    queryKey: ['process-parties', activeTenantId, processId],
    queryFn: () => apiGetAllPages<ProcessPartyRecord>(`/process-parties/?process=${processId}`),
    enabled: !!activeTenantId && !!processId,
  });

  const parties = useMemo(() => {
    const data = partiesQuery.data;
    return !data ? [] : Array.isArray(data) ? data : (data as any).results ?? [];
  }, [partiesQuery.data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['process-parties', activeTenantId, processId] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        process: processId,
        role: form.role,
        name: form.name.trim(),
        doc: form.doc.trim() || null,
        is_client: form.is_client,
        lawyer_name: form.lawyer_name.trim(),
        lawyer_oab: form.lawyer_oab.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim(),
      };
      if (editing) return api.patch(`/process-parties/${editing.id}/`, payload);
      return api.post('/process-parties/', payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Parte atualizada.' : 'Parte adicionada ao processo.');
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || 'Falha ao salvar a parte.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/process-parties/${id}/`),
    onSuccess: () => {
      toast.success('Parte removida.');
      invalidate();
    },
    onError: (error: any) => toast.error(error?.message || 'Falha ao remover a parte.'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(party: ProcessPartyRecord) {
    setEditing(party);
    setForm({
      role: party.role || 'autor',
      name: party.name || '',
      doc: party.doc || '',
      is_client: !!party.is_client,
      lawyer_name: party.lawyer_name || '',
      lawyer_oab: party.lawyer_oab || '',
      email: party.email || '',
      phone: party.phone || '',
      notes: party.notes || '',
    });
    setDialogOpen(true);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Partes do processo
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Autores, réus, terceiros e demais envolvidos, com advogados e contatos.
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar parte
        </Button>
      </CardHeader>
      <CardContent>
        {partiesQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : parties.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Nenhuma parte cadastrada"
            description="Cadastre autores, réus e demais envolvidos para uma ficha processual completa."
            action={{ label: 'Adicionar parte', onClick: openCreate }}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Papel</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF / CNPJ</TableHead>
                  <TableHead>Advogado</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="w-[70px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parties.map((party: ProcessPartyRecord) => (
                  <TableRow key={party.id}>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[party.role] || ROLE_BADGE.outro}`}>
                        {party.role_label || party.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{party.name}</span>
                        {party.is_client && <Badge variant="outline" className="border-primary/30 text-primary">Cliente</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono-ui text-xs text-muted-foreground">{party.doc || '—'}</TableCell>
                    <TableCell>
                      {party.lawyer_name ? (
                        <div>
                          <p className="text-sm">{party.lawyer_name}</p>
                          {party.lawyer_oab && <p className="text-xs text-muted-foreground">OAB {party.lawyer_oab}</p>}
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[party.email, party.phone].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações da parte">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(party)}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteMutation.mutate(party.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditing(null); } }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar parte' : 'Nova parte do processo'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Papel no processo *</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>CPF / CNPJ</Label>
                <Input value={form.doc} onChange={(e) => setForm((f) => ({ ...f, doc: maskCpfCnpj(e.target.value) }))} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Nome completo *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome da parte" />
            </div>
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Parte representada pelo escritório</p>
                <p className="text-xs text-muted-foreground">Marque quando esta parte for o cliente do caso.</p>
              </div>
              <Switch checked={form.is_client} onCheckedChange={(checked) => setForm((f) => ({ ...f, is_client: checked }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Advogado da parte</Label>
                <Input value={form.lawyer_name} onChange={(e) => setForm((f) => ({ ...f, lawyer_name: e.target.value }))} placeholder="Nome do advogado adverso" />
              </div>
              <div className="grid gap-1.5">
                <Label>OAB</Label>
                <Input value={form.lawyer_oab} onChange={(e) => setForm((f) => ({ ...f, lawyer_oab: e.target.value }))} placeholder="SP 123456" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="contato@exemplo.com" />
              </div>
              <div className="grid gap-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: maskPhoneBR(e.target.value) }))} placeholder="(11) 99999-0000" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Observações</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Contexto relevante sobre a parte." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()}>
              {saveMutation.isPending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar parte'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
