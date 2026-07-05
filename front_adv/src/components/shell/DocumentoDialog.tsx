import { useEffect, useMemo, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { apiMultipart } from "@/lib/api";
import { useList, clientName } from "@/lib/resources";

/** Upload de documento (multipart) em pop-up. */
export function DocumentoDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: () => void;
}) {
  const qc = useQueryClient();
  const processes = useList<any>("processes");
  const clients = useList<any>("clients");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("geral");
  const [process, setProcess] = useState("");
  const [client, setClient] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(""); setCategory("geral"); setProcess(""); setClient(""); setFile(null);
    }
  }, [open]);

  const processOptions = useMemo(() => (processes.data ?? []).map((p) => ({ value: String(p.id), label: p.cnj || `Processo ${p.id}` })), [processes.data]);
  const clientOptions = useMemo(() => (clients.data ?? []).map((c) => ({ value: String(c.id), label: clientName(c) })), [clients.data]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Selecione um arquivo para enviar.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title || file.name);
      fd.append("category", category);
      if (process) fd.append("process", process);
      if (client) fd.append("client", client);
      await apiMultipart("/documents/", fd);
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documento enviado.");
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast.error(err?.detail || "Não foi possível enviar o documento.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-[13.5px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
  const labelCls = "text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={(o) => (!submitting ? onOpenChange(o) : null)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Novo documento</DialogTitle>
          <DialogDescription>Envie um arquivo e vincule opcionalmente a um processo ou cliente.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className={labelCls}>Arquivo *</label>
            <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-card px-4 py-8 text-[13px] text-muted-foreground hover:border-primary hover:text-primary transition">
              <Upload className="h-4 w-4" />
              {file ? file.name : "Clique para selecionar um arquivo"}
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Título</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Petição inicial" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {["geral", "peticao", "procuracao", "laudo", "contrato", "comprovante"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Processo</label>
              <select value={process} onChange={(e) => setProcess(e.target.value)} className={inputCls}>
                <option value="">Selecione…</option>
                {processOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Cliente</label>
              <select value={client} onChange={(e) => setClient(e.target.value)} className={inputCls}>
                <option value="">Selecione…</option>
                {clientOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-border bg-card px-4 py-2 text-[13px] hover:bg-muted">Cancelar</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Enviar documento
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
