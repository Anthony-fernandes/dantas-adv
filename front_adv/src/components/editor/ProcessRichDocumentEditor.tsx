import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bold, Italic, Underline, List, ListOrdered, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, Save, FilePlus2, Eye, FileOutput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { editorDocumentService } from "@/services/api";
import { getActiveTenantId } from "@/integrations/api/client";

type EditorDoc = {
  id: string;
  process?: string | null;
  client?: string | null;
  title: string;
  category?: string | null;
  content_html: string;
  version: number;
  is_latest: boolean;
  status: "DRAFT" | "FINAL";
  access_level: "TENANT" | "ROLES";
  allowed_roles: string[];
  updated_at?: string;
  created_at?: string;
};

function toList<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data.results)) return data.results as T[];
  if (Array.isArray(data.editor_documents)) return data.editor_documents as T[];
  return [];
}

function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export function ProcessRichDocumentEditor({ processId, clientId }: { processId: string; clientId?: string | null }) {
  const queryClient = useQueryClient();
  const activeTenantId = getActiveTenantId();
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [title, setTitle] = React.useState("Relatório do Processo");
  const [category, setCategory] = React.useState("relatório");
  const [status, setStatus] = React.useState<"DRAFT" | "FINAL">("DRAFT");
  const [accessLevel, setAccessLevel] = React.useState<"TENANT" | "ROLES">("TENANT");
  const [allowedRolesText, setAllowedRolesText] = React.useState("");
  const [contentHtml, setContentHtml] = React.useState("<p>Comece seu relatório aqui...</p>");
  const [previewHtml, setPreviewHtml] = React.useState("");
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const lastSavedSnapshot = React.useRef("");

  const docsQuery = useQuery({
    queryKey: ["editor-documents", activeTenantId, processId],
    enabled: !!processId && !!activeTenantId,
    queryFn: async () => {
      const data = await editorDocumentService.list({ process: processId, latest: true });
      return toList<EditorDoc>(data);
    },
  });

  const placeholdersQuery = useQuery({
    queryKey: ["editor-documents-placeholders", activeTenantId],
    enabled: !!activeTenantId,
    queryFn: async () => {
      const data = await editorDocumentService.placeholders();
      return Array.isArray(data?.placeholders) ? (data.placeholders as string[]) : [];
    },
  });

  const docs = docsQuery.data ?? [];
  const selectedDoc = docs.find((d) => d.id === selectedId) ?? null;

  React.useEffect(() => {
    if (!docs.length) {
      setSelectedId("");
      return;
    }
    if (!selectedId || !docs.some((d) => d.id === selectedId)) {
      setSelectedId(docs[0].id);
    }
  }, [docs, selectedId]);

  React.useEffect(() => {
    if (!selectedDoc) return;
    setTitle(selectedDoc.title || "Relatório do Processo");
    setCategory(selectedDoc.category || "relatorio");
    setStatus(selectedDoc.status || "DRAFT");
    setAccessLevel(selectedDoc.access_level || "TENANT");
    setAllowedRolesText((selectedDoc.allowed_roles || []).join(","));
    setContentHtml(selectedDoc.content_html || "<p></p>");
    const snapshot = JSON.stringify({
      title: selectedDoc.title || "",
      category: selectedDoc.category || "",
      status: selectedDoc.status || "DRAFT",
      access_level: selectedDoc.access_level || "TENANT",
      allowed_roles: (selectedDoc.allowed_roles || []).join(","),
      content_html: selectedDoc.content_html || "",
    });
    lastSavedSnapshot.current = snapshot;
    setIsDirty(false);
  }, [selectedDoc?.id]);

  const createMutation = useMutation({
    mutationFn: async () => {
      return await editorDocumentService.create({
        process: processId,
        client: clientId || undefined,
        title: "Novo Relatório",
        category: "relatorio",
        content_html: "<p>Novo documento...</p>",
        status: "DRAFT",
        access_level: "TENANT",
        allowed_roles: [],
      });
    },
    onSuccess: async (created: any) => {
      await queryClient.invalidateQueries({ queryKey: ["editor-documents", activeTenantId, processId] });
      if (created?.id) setSelectedId(created.id);
      toast.success("Documento editavel criado.");
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao criar documento."),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return null;
      const payload = {
        title: title.trim() || "Relatório do Processo",
        category: category.trim() || "relatorio",
        status,
        access_level: accessLevel,
        allowed_roles: accessLevel === "ROLES"
          ? allowedRolesText.split(",").map((r) => r.trim()).filter(Boolean)
          : [],
        content_html: contentHtml,
      };
      return await editorDocumentService.update(selectedId, payload);
    },
    onSuccess: async () => {
      const snapshot = JSON.stringify({
        title: title.trim(),
        category: category.trim(),
        status,
        access_level: accessLevel,
        allowed_roles: allowedRolesText,
        content_html: contentHtml,
      });
      lastSavedSnapshot.current = snapshot;
      setIsDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["editor-documents", activeTenantId, processId] });
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao salvar."),
  });

  const newVersionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return null;
      return await editorDocumentService.newVersion(selectedId, {
        title: `${title.trim() || "Relatório"} v${(selectedDoc?.version ?? 0) + 1}`,
        content_html: contentHtml,
      });
    },
    onSuccess: async (created: any) => {
      await queryClient.invalidateQueries({ queryKey: ["editor-documents", activeTenantId, processId] });
      if (created?.id) setSelectedId(created.id);
      toast.success("Nova versão criada.");
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao criar nova versão."),
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return null;
      return await editorDocumentService.preview(selectedId, {});
    },
    onSuccess: (data: any) => {
      setPreviewHtml(String(data?.rendered_html || ""));
      setPreviewOpen(true);
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao gerar preview."),
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) return null;
      return await editorDocumentService.exportPdf(selectedId, {
        title: `${title.trim() || "Relatório"} Final`,
        category: category.trim() || "relatorio",
      });
    },
    onSuccess: async (data: any) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["process", activeTenantId, processId, "documents"] }),
        queryClient.invalidateQueries({ queryKey: ["documents-files", activeTenantId] }),
      ]);
      const url = data?.file_download_url || data?.file_url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      toast.success("PDF gerado.");
    },
    onError: (e: any) => toast.error(e?.message || "Falha ao exportar PDF."),
  });

  React.useEffect(() => {
    if (!selectedId) return;
    const current = JSON.stringify({
      title: title.trim(),
      category: category.trim(),
      status,
      access_level: accessLevel,
      allowed_roles: allowedRolesText,
      content_html: contentHtml,
    });
    const changed = current !== lastSavedSnapshot.current;
    setIsDirty(changed);
    if (!changed || saveMutation.isPending) return;

    const timer = window.setTimeout(() => {
      saveMutation.mutate();
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [selectedId, title, category, status, accessLevel, allowedRolesText, contentHtml, saveMutation]);

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Editor de Relatórios (Word-like)</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              <FilePlus2 className="mr-2 h-4 w-4" /> Novo
            </Button>
            <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={!selectedId || saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
            <Button variant="outline" size="sm" onClick={() => newVersionMutation.mutate()} disabled={!selectedId || newVersionMutation.isPending}>
              Nova versão
            </Button>
            <Button variant="outline" size="sm" onClick={() => previewMutation.mutate()} disabled={!selectedId || previewMutation.isPending}>
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
            <Button size="sm" onClick={() => exportMutation.mutate()} disabled={!selectedId || exportMutation.isPending}>
              <FileOutput className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label>Documento</Label>
            <Select value={selectedId || "__none"} onValueChange={(v) => setSelectedId(v === "__none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder={docsQuery.isLoading ? "Carregando..." : "Selecione um documento"} />
              </SelectTrigger>
              <SelectContent>
                {!docs.length ? <SelectItem value="__none">Nenhum documento</SelectItem> : null}
                {docs.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.title} (v{doc.version})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "DRAFT" | "FINAL")} disabled={!selectedId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">DRAFT</SelectItem>
                <SelectItem value="FINAL">FINAL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Acesso</Label>
            <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as "TENANT" | "ROLES")} disabled={!selectedId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TENANT">TENANT</SelectItem>
                <SelectItem value="ROLES">ROLES</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!selectedId} />
          </div>
          <div>
            <Label>Categoria</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} disabled={!selectedId} />
          </div>
        </div>

        {accessLevel === "ROLES" ? (
          <div>
            <Label>Roles permitidas</Label>
            <Input
              value={allowedRolesText}
              onChange={(e) => setAllowedRolesText(e.target.value)}
              placeholder="OWNER,ADMIN,LAWYER"
              disabled={!selectedId}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 rounded-md border bg-muted/30 p-2">
          <Button size="sm" variant="outline" type="button" onClick={() => exec("bold")}><Bold className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("italic")}><Italic className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("underline")}><Underline className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("justifyLeft")}><AlignLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("justifyCenter")}><AlignCenter className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("justifyRight")}><AlignRight className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("undo")}><Undo2 className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" type="button" onClick={() => exec("redo")}><Redo2 className="h-4 w-4" /></Button>
          <Select
            onValueChange={(token) => {
              if (!token || token === "__placeholder") return;
              exec("insertText", `{{ ${token} }}`);
              if (editorRef.current) setContentHtml(editorRef.current.innerHTML);
            }}
          >
            <SelectTrigger className="h-9 w-[240px]">
              <SelectValue placeholder="Inserir placeholder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__placeholder">Selecione</SelectItem>
              {(placeholdersQuery.data ?? []).map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border bg-white p-6">
          <div
            ref={editorRef}
            className="min-h-[420px] w-full border border-dashed border-border p-4 text-sm leading-7 focus:outline-none"
            contentEditable={!!selectedId}
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: contentHtml }}
            onInput={(e) => setContentHtml((e.target as HTMLDivElement).innerHTML)}
          />
        </div>

        <div className="text-xs text-muted-foreground">
          {selectedId ? (isDirty ? "Alterações pendentes (autosave em ~1.2s)." : "Tudo salvo.") : "Crie ou selecione um documento para editar."}
        </div>
      </CardContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Preview renderizado</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-auto rounded-md border bg-white p-6">
            <div dangerouslySetInnerHTML={{ __html: previewHtml || "<p>Sem conteúdo.</p>" }} />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
