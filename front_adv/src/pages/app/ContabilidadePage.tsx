import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Edit2, Trash2, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/integrations/api/client';
import { useToast } from '@/hooks/use-toast';

// ---- Types ----
type ContaContabil = {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'ativo' | 'passivo' | 'receita' | 'despesa' | 'patrimonio';
  parent: string | null;
  is_synthetic: boolean;
};

type LancamentoLinha = {
  conta: string;
  natureza: 'debito' | 'credito';
  valor: string;
};

type Lancamento = {
  id: string;
  data: string;
  historico: string;
  linhas: LancamentoLinha[];
};

type DREResult = {
  receitas: number;
  despesas: number;
  resultado: number;
  grupos?: Record<string, number>;
};

const TIPO_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'passivo', label: 'Passivo' },
  { value: 'receita', label: 'Receita' },
  { value: 'despesa', label: 'Despesa' },
  { value: 'patrimonio', label: 'Patrimônio Líquido' },
];

const TIPO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  passivo: 'Passivo',
  receita: 'Receita',
  despesa: 'Despesa',
  patrimonio: 'Patrimônio Líquido',
};

// ---- Plano de Contas Tab ----
function PlanoContasTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContaContabil | null>(null);
  const [form, setForm] = useState({ codigo: '', nome: '', tipo: 'ativo', parent: '', is_synthetic: false });

  const contasQuery = useQuery({
    queryKey: ['contas-contabeis'],
    queryFn: () => api.get<{ results: ContaContabil[] }>('/contas-contabeis/')
      .then((r) => (Array.isArray(r) ? r : r.results ?? [])),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        codigo: form.codigo,
        nome: form.nome,
        tipo: form.tipo,
        parent: form.parent || null,
        is_synthetic: form.is_synthetic,
      };
      return editing
        ? api.patch(`/contas-contabeis/${editing.id}/`, payload)
        : api.post('/contas-contabeis/', payload);
    },
    onSuccess: () => {
      toast({ title: editing ? 'Conta atualizada!' : 'Conta criada!' });
      qc.invalidateQueries({ queryKey: ['contas-contabeis'] });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: any) => toast({ title: e?.message || 'Erro ao salvar', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contas-contabeis/${id}/`),
    onSuccess: () => {
      toast({ title: 'Conta excluída.' });
      qc.invalidateQueries({ queryKey: ['contas-contabeis'] });
    },
    onError: (e: any) => toast({ title: e?.message || 'Erro ao excluir', variant: 'destructive' }),
  });

  const contas: ContaContabil[] = contasQuery.data ?? [];
  const byTipo = TIPO_OPTIONS.reduce<Record<string, ContaContabil[]>>((acc, t) => {
    acc[t.value] = contas.filter((c) => c.tipo === t.value);
    return acc;
  }, {});

  function openNew() {
    setEditing(null);
    setForm({ codigo: '', nome: '', tipo: 'ativo', parent: '', is_synthetic: false });
    setDialogOpen(true);
  }

  function openEdit(c: ContaContabil) {
    setEditing(c);
    setForm({ codigo: c.codigo, nome: c.nome, tipo: c.tipo, parent: c.parent ?? '', is_synthetic: c.is_synthetic });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova conta
        </Button>
      </div>

      {contasQuery.isLoading && <Skeleton className="h-40 w-full" />}

      {!contasQuery.isLoading && contas.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Plano de contas vazio</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>Criar primeira conta</Button>
        </div>
      )}

      {Object.entries(byTipo).filter(([, items]) => items.length > 0).map(([tipo, items]) => (
        <div key={tipo}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{TIPO_LABELS[tipo]}</p>
          <div className="rounded-lg border border-border">
            <Table>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs w-24">{c.codigo}</TableCell>
                    <TableCell>
                      <span className="text-sm">{c.nome}</span>
                      {c.is_synthetic && <Badge variant="outline" className="ml-2 text-xs">Sintética</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(c)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar conta' : 'Nova conta contábil'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Código *</Label>
                <Input value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} placeholder="1.1.01" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Caixa" />
            </div>
            <div className="space-y-1.5">
              <Label>Conta pai <span className="text-muted-foreground">(opcional)</span></Label>
              <Select value={form.parent || '__none__'} onValueChange={(v) => setForm((f) => ({ ...f, parent: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {(contasQuery.data ?? []).filter((c) => c.id !== editing?.id && c.is_synthetic).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_synthetic}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_synthetic: v }))}
              />
              <Label>Conta sintética (agrupadora)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.codigo || !form.nome}
              className="gap-2"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Lançamentos Tab ----
function LancamentosTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [historico, setHistorico] = useState('');
  const [linhas, setLinhas] = useState<LancamentoLinha[]>([
    { conta: '', natureza: 'debito', valor: '' },
    { conta: '', natureza: 'credito', valor: '' },
  ]);

  const contasQuery = useQuery({
    queryKey: ['contas-contabeis'],
    queryFn: () => api.get<{ results: ContaContabil[] }>('/contas-contabeis/')
      .then((r) => (Array.isArray(r) ? r : r.results ?? [])),
  });

  const lancamentosQuery = useQuery({
    queryKey: ['lancamentos', dataInicio, dataFim],
    queryFn: () => api.get<{ results: Lancamento[] }>('/lancamentos/', {
      data_inicio: dataInicio || undefined,
      data_fim: dataFim || undefined,
    }).then((r) => (Array.isArray(r) ? r : r.results ?? [])),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/lancamentos/', { data: date, historico, linhas }),
    onSuccess: () => {
      toast({ title: 'Lançamento criado!' });
      qc.invalidateQueries({ queryKey: ['lancamentos'] });
      setDialogOpen(false);
      setHistorico('');
      setLinhas([{ conta: '', natureza: 'debito', valor: '' }, { conta: '', natureza: 'credito', valor: '' }]);
    },
    onError: (e: any) => toast({ title: e?.message || 'Erro ao criar lançamento', variant: 'destructive' }),
  });

  const contas: ContaContabil[] = contasQuery.data ?? [];
  const lancamentos: Lancamento[] = lancamentosQuery.data ?? [];

  const totalDebito = linhas.filter((l) => l.natureza === 'debito').reduce((s, l) => s + parseFloat(l.valor || '0'), 0);
  const totalCredito = linhas.filter((l) => l.natureza === 'credito').reduce((s, l) => s + parseFloat(l.valor || '0'), 0);
  const balanced = Math.abs(totalDebito - totalCredito) < 0.01;

  function updateLinha(i: number, field: keyof LancamentoLinha, value: string) {
    setLinhas((ls) => ls.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  }

  function addLinha() {
    setLinhas((ls) => [...ls, { conta: '', natureza: 'debito', valor: '' }]);
  }

  function removeLinha(i: number) {
    setLinhas((ls) => ls.filter((_, idx) => idx !== i));
  }

  const totalValue = (l: Lancamento) => {
    const debitos = l.linhas?.filter((x) => x.natureza === 'debito').reduce((s, x) => s + parseFloat(x.valor || '0'), 0) ?? 0;
    return debitos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Data início</Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="h-8 text-sm w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Data fim</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="h-8 text-sm w-36" />
        </div>
        <Button size="sm" className="gap-2 ml-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo lançamento
        </Button>
      </div>

      {lancamentosQuery.isLoading && <Skeleton className="h-40 w-full" />}

      {!lancamentosQuery.isLoading && lancamentos.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum lançamento encontrado</p>
        </div>
      )}

      {lancamentos.length > 0 && (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-sm">{l.historico}</TableCell>
                  <TableCell className="text-right text-sm font-mono">{totalValue(l)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo lançamento contábil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Histórico *</Label>
                <Input value={historico} onChange={(e) => setHistorico(e.target.value)} placeholder="Descrição do lançamento" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Linhas *</Label>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={addLinha}>
                  <Plus className="h-3.5 w-3.5" />
                  Linha
                </Button>
              </div>
              <div className="space-y-2">
                {linhas.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                    <Select value={l.conta || '__none__'} onValueChange={(v) => updateLinha(i, 'conta', v === '__none__' ? '' : v)}>
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue placeholder="Conta..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Selecionar...</SelectItem>
                        {contas.filter((c) => !c.is_synthetic).map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">{c.codigo} — {c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={l.natureza} onValueChange={(v) => updateLinha(i, 'natureza', v)}>
                      <SelectTrigger className="w-24 text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debito">Débito</SelectItem>
                        <SelectItem value="credito">Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.valor}
                      onChange={(e) => updateLinha(i, 'valor', e.target.value)}
                      placeholder="0,00"
                      className="w-24 text-xs h-8"
                    />
                    {linhas.length > 2 && (
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeLinha(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Débitos: {totalDebito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span>Créditos: {totalCredito.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              {!balanced && totalDebito > 0 && (
                <p className="text-xs text-red-600 mt-1">Débitos e créditos devem ser iguais.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !historico || !date || !balanced || linhas.some((l) => !l.conta || !l.valor)}
              className="gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- DRE Tab ----
function DRETab() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const [dataInicio, setDataInicio] = useState(`${currentYear}-01-01`);
  const [dataFim, setDataFim] = useState(`${currentYear}-12-31`);
  const [loading, setLoading] = useState(false);
  const [dre, setDre] = useState<DREResult | null>(null);

  async function gerarDRE() {
    setLoading(true);
    try {
      const res = await api.get<DREResult>('/lancamentos/dre/', { data_inicio: dataInicio, data_fim: dataFim });
      setDre(res);
    } catch (e: any) {
      toast({ title: e?.message || 'Erro ao gerar DRE', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Período início</Label>
          <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="h-8 text-sm w-36" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Período fim</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="h-8 text-sm w-36" />
        </div>
        <Button size="sm" onClick={gerarDRE} disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Gerar DRE
        </Button>
      </div>

      {dre && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Demonstrativo de Resultado — {new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} a {new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="divide-y divide-border">
              <div className="flex justify-between py-3">
                <span className="text-sm font-medium">RECEITAS</span>
                <span className="text-sm font-mono text-green-700 dark:text-green-400">{fmt(dre.receitas ?? 0)}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm font-medium text-muted-foreground">(-) DESPESAS</span>
                <span className="text-sm font-mono text-red-600 dark:text-red-400">{fmt(dre.despesas ?? 0)}</span>
              </div>
              <div className="flex justify-between py-4 font-bold">
                <span className="text-sm">= RESULTADO LÍQUIDO</span>
                <span className={`text-sm font-mono ${(dre.resultado ?? 0) >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {fmt(dre.resultado ?? 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---- Main Page ----
export default function ContabilidadePage() {
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);

  async function importarPlanoOAB() {
    setSeeding(true);
    try {
      await api.post('/plano-contas/seed/');
      toast({ title: 'Plano de contas OAB importado com sucesso!' });
    } catch (e: any) {
      toast({ title: e?.message || 'Erro ao importar plano de contas', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="page-container max-w-5xl">
      <div className="page-header">
        <div>
          <p className="eyebrow">Financeiro</p>
          <h1 className="page-title">Escrituração Contábil</h1>
        </div>
        <Button variant="outline" size="sm" onClick={importarPlanoOAB} disabled={seeding} className="gap-2">
          {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          Importar plano de contas OAB
        </Button>
      </div>

      <Tabs defaultValue="plano">
        <TabsList>
          <TabsTrigger value="plano">Plano de Contas</TabsTrigger>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
        </TabsList>

        <TabsContent value="plano" className="mt-4">
          <PlanoContasTab />
        </TabsContent>
        <TabsContent value="lancamentos" className="mt-4">
          <LancamentosTab />
        </TabsContent>
        <TabsContent value="dre" className="mt-4">
          <DRETab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
