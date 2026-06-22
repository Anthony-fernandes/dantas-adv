import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  FolderKanban,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { api, apiGetAllPages } from "@/integrations/api/client";
import { useTenant } from "@/contexts/TenantContext";
import { cn } from "@/lib/utils";
import {
  PRACTICE_AREA_ICON_OPTIONS,
  PRACTICE_AREA_PRESETS,
  type PracticeAreaCore,
  type PracticeAreaIconKey,
  type PracticeAreaUiMeta,
  getPracticeAreaIcon,
  getPracticeAreaPreset,
  normalizePracticeAreaCode,
  practiceAreaIconToLandingIcon,
  practiceAreaAccentStyle,
  practiceAreaPillStyle,
  practiceAreaSolidStyle,
  resolvePracticeAreaMeta,
} from "@/lib/practice-area";
import {
  deleteWorkspaceStateItem,
  loadWorkspaceStateMap,
  saveWorkspaceStateItem,
} from "@/services/workspaceState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type AreaItem = PracticeAreaCore & {
  created_at?: string | null;
  updated_at?: string | null;
};

type ProcessItem = {
  id: string;
  cnj?: string | null;
  class_name?: string | null;
  court?: string | null;
  court_division?: string | null;
  area?: string | null;
  status?: string | null;
  client?: string | null;
  client_name?: string | null;
  cliente_nome?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type HearingItem = {
  id: string;
  process?: string | null;
  process_id?: string | null;
  hearing_date?: string | null;
  type?: string | null;
  status?: string | null;
};

type DeadlineItem = {
  id: string;
  process?: string | null;
  process_id?: string | null;
  due_date?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
};

type EmployeeItem = {
  id: string;
  full_name?: string | null;
  position_name?: string | null;
  email?: string | null;
  is_active?: boolean | null;
};

type AreaEvent = {
  id: string;
  kind: "hearing" | "deadline";
  title: string;
  date: string | null;
  status: string;
  processId: string;
  processLabel: string;
};

type AreaInsight = AreaItem & {
  code: string;
  label: string;
  description: string;
  color: string;
  icon: PracticeAreaIconKey;
  responsibleId: string;
  responsibleName: string;
  isActive: boolean;
  processCount: number;
  hearingCount: number;
  deadlineCount: number;
  linkedProcesses: ProcessItem[];
  recentEvents: AreaEvent[];
  currentWindowCount: number;
  previousWindowCount: number;
  growthDelta: number;
};

type AreaFormState = {
  name: string;
  code: string;
  description: string;
  landingLink: string;
  landingOrder: number;
  showOnLanding: boolean;
  color: string;
  icon: PracticeAreaIconKey;
  responsibleId: string;
  status: "active" | "inactive";
};

const DAYS_WINDOW = 30;

const EMPTY_FORM = (): AreaFormState => {
  const preset = getPracticeAreaPreset("civel");
  return {
    name: preset.label,
    code: preset.code,
    description: preset.description,
    landingLink: "",
    landingOrder: 0,
    showOnLanding: true,
    color: preset.color,
    icon: preset.icon,
    responsibleId: "",
    status: "active",
  };
};

function normalizeText(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(active: boolean) {
  return active ? "Ativa" : "Inativa";
}

function processLabel(process: ProcessItem) {
  return process.cnj || process.class_name || "Processo sem identificacao";
}

function resolveProcessId(item: { process?: string | null; process_id?: string | null }) {
  return String(item.process || item.process_id || "").trim();
}

function buildFormFromArea(area: AreaInsight | null, employeesById: Record<string, EmployeeItem>) {
  if (!area) return EMPTY_FORM();
  return {
    name: area.label,
    code: area.code,
    description: area.description,
    landingLink: area.landing_link || "",
    landingOrder: area.display_order || 0,
    showOnLanding: area.show_on_landing !== false,
    color: area.color,
    icon: area.icon,
    responsibleId: employeesById[area.responsibleId] ? area.responsibleId : area.responsibleId || "",
    status: area.isActive ? "active" : "inactive",
  };
}

function metricDelta(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? `+${current}` : "0";
  const ratio = ((current - previous) / previous) * 100;
  const rounded = Math.round(ratio);
  return rounded >= 0 ? `+${rounded}%` : `${rounded}%`;
}

function descriptionFallback(name: string) {
  return `Atuacao estrategica em ${name}.`;
}

export default function PracticeAreasWorkspace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeTenantId } = useTenant();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [layout, setLayout] = useState<"cards" | "list">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [areaPendingDelete, setAreaPendingDelete] = useState<AreaInsight | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [form, setForm] = useState<AreaFormState>(EMPTY_FORM);
  const [uiMap, setUiMap] = useState<Record<string, PracticeAreaUiMeta>>({});

  const areaUiQuery = useQuery({
    queryKey: ["workspace-state", "practice_area_ui", activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => loadWorkspaceStateMap<PracticeAreaUiMeta>("practice_area_ui"),
  });

  useEffect(() => {
    setUiMap(areaUiQuery.data ?? {});
  }, [areaUiQuery.data]);

  const areasQuery = useQuery({
    queryKey: ["practice-areas", activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<AreaItem>("/causes/"),
  });

  const processesQuery = useQuery({
    queryKey: ["practice-areas-processes", activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<ProcessItem>("/processes/"),
  });

  const hearingsQuery = useQuery({
    queryKey: ["practice-areas-hearings", activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<HearingItem>("/hearings/", { ordering: "-hearing_date" }),
  });

  const deadlinesQuery = useQuery({
    queryKey: ["practice-areas-deadlines", activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<DeadlineItem>("/deadlines/", { ordering: "-due_date" }),
  });

  const employeesQuery = useQuery({
    queryKey: ["practice-areas-employees", activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => apiGetAllPages<EmployeeItem>("/employees/"),
  });

  const areas = areasQuery.data ?? [];
  const processes = processesQuery.data ?? [];
  const hearings = hearingsQuery.data ?? [];
  const deadlines = deadlinesQuery.data ?? [];
  const employees = employeesQuery.data ?? [];

  const employeesById = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee] as const)),
    [employees],
  );

  const persistAreaMeta = async (areaId: string, meta: PracticeAreaUiMeta) => {
    const nextMap = { ...uiMap, [areaId]: meta };
    setUiMap(nextMap);
    await saveWorkspaceStateItem("practice_area_ui", areaId, meta);
    queryClient.setQueryData(["workspace-state", "practice_area_ui", activeTenantId], nextMap);
    return nextMap;
  };

  const removeAreaMeta = async (areaId: string) => {
    const nextMap = { ...uiMap };
    delete nextMap[areaId];
    setUiMap(nextMap);
    await deleteWorkspaceStateItem("practice_area_ui", areaId);
    queryClient.setQueryData(["workspace-state", "practice_area_ui", activeTenantId], nextMap);
    return nextMap;
  };

  const areaInsights = useMemo<AreaInsight[]>(() => {
    const processMap = Object.fromEntries(processes.map((process) => [process.id, process] as const));
    const areaProcesses = new Map<string, ProcessItem[]>();
    const areaHearings = new Map<string, HearingItem[]>();
    const areaDeadlines = new Map<string, DeadlineItem[]>();

    for (const process of processes) {
      const code = normalizePracticeAreaCode(process.area);
      if (!code) continue;
      const list = areaProcesses.get(code) || [];
      list.push(process);
      areaProcesses.set(code, list);
    }

    for (const hearing of hearings) {
      const process = processMap[resolveProcessId(hearing)];
      const code = normalizePracticeAreaCode(process?.area);
      if (!code) continue;
      const list = areaHearings.get(code) || [];
      list.push(hearing);
      areaHearings.set(code, list);
    }

    for (const deadline of deadlines) {
      const process = processMap[resolveProcessId(deadline)];
      const code = normalizePracticeAreaCode(process?.area);
      if (!code) continue;
      const list = areaDeadlines.get(code) || [];
      list.push(deadline);
      areaDeadlines.set(code, list);
    }

    const now = Date.now();
    const currentWindowStart = now - DAYS_WINDOW * 86400000;
    const previousWindowStart = now - DAYS_WINDOW * 2 * 86400000;

    return [...areas]
      .map((area) => {
        const meta = resolvePracticeAreaMeta(area, uiMap);
        const linkedProcesses = [...(areaProcesses.get(meta.code) || [])].sort((left, right) => {
          return new Date(right.updated_at || right.created_at || 0).getTime() - new Date(left.updated_at || left.created_at || 0).getTime();
        });
        const linkedHearings = areaHearings.get(meta.code) || [];
        const linkedDeadlines = areaDeadlines.get(meta.code) || [];
        const recentEvents: AreaEvent[] = [
          ...linkedHearings.map((hearing) => {
            const process = processMap[resolveProcessId(hearing)];
            return {
              id: `hearing-${hearing.id}`,
              kind: "hearing" as const,
              title: hearing.type || "Audiência",
              date: hearing.hearing_date || null,
              status: String(hearing.status || "agendada"),
              processId: process?.id || "",
              processLabel: process ? processLabel(process) : "Processo sem vinculo",
            };
          }),
          ...linkedDeadlines.map((deadline) => {
            const process = processMap[resolveProcessId(deadline)];
            return {
              id: `deadline-${deadline.id}`,
              kind: "deadline" as const,
              title: deadline.description || "Prazo processual",
              date: deadline.due_date || null,
              status: String(deadline.status || deadline.priority || "pendente"),
              processId: process?.id || "",
              processLabel: process ? processLabel(process) : "Processo sem vinculo",
            };
          }),
        ]
          .sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime())
          .slice(0, 6);

        const currentWindowCount = linkedProcesses.filter((process) => {
          const createdAt = new Date(process.created_at || 0).getTime();
          return createdAt >= currentWindowStart;
        }).length;
        const previousWindowCount = linkedProcesses.filter((process) => {
          const createdAt = new Date(process.created_at || 0).getTime();
          return createdAt < currentWindowStart && createdAt >= previousWindowStart;
        }).length;

        return {
          ...area,
          ...meta,
          processCount: linkedProcesses.length,
          hearingCount: linkedHearings.length,
          deadlineCount: linkedDeadlines.length,
          linkedProcesses,
          recentEvents,
          currentWindowCount,
          previousWindowCount,
          growthDelta: currentWindowCount - previousWindowCount,
        };
      })
      .sort((left, right) => right.processCount - left.processCount || left.label.localeCompare(right.label, "pt-BR"));
  }, [areas, deadlines, hearings, processes, uiMap]);

  const responsibleOptions = useMemo(() => {
    const values = new Map<string, string>();
    employees
      .filter((employee) => employee.is_active !== false)
      .forEach((employee) => values.set(employee.id, employee.full_name || employee.email || "Sem nome"));

    Object.values(uiMap).forEach((meta) => {
      if (meta.responsibleId && meta.responsibleName) {
        values.set(meta.responsibleId, meta.responsibleName);
      }
    });

    return Array.from(values.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
  }, [employees, uiMap]);

  const filteredAreas = useMemo(() => {
    const query = normalizeText(search);
    return areaInsights.filter((area) => {
      if (statusFilter !== "all" && area.isActive !== (statusFilter === "active")) return false;
      if (responsibleFilter !== "all" && area.responsibleId !== responsibleFilter) return false;
      if (!query) return true;

      return [area.label, area.description, area.code, area.responsibleName].some((value) => normalizeText(value).includes(query));
    });
  }, [areaInsights, responsibleFilter, search, statusFilter]);

  const selectedArea = useMemo(
    () => areaInsights.find((area) => area.id === selectedAreaId) || null,
    [areaInsights, selectedAreaId],
  );

  const headerMetrics = useMemo(() => {
    const activeAreas = areaInsights.filter((area) => area.isActive);
    const topByProcesses = [...areaInsights].sort((left, right) => right.processCount - left.processCount)[0] || null;
    const topByDeadlines = [...areaInsights].sort((left, right) => right.deadlineCount - left.deadlineCount)[0] || null;
    const topGrowth = [...areaInsights].sort((left, right) => right.growthDelta - left.growthDelta)[0] || null;

    return {
      totalAreas: areaInsights.length,
      activeAreas: activeAreas.length,
      topByProcesses,
      topByDeadlines,
      topGrowth,
      totalProcesses: areaInsights.reduce((accumulator, area) => accumulator + area.processCount, 0),
    };
  }, [areaInsights]);

  const landingSync = async (nextAreas: AreaItem[], nextMap: Record<string, PracticeAreaUiMeta>) => {
    void nextAreas;
    void nextMap;
    return;
    try {
      const source: any = await api.get("/landing-page/");
      const payload = {
        ...source,
        areas: nextAreas
          .filter((item) => resolvePracticeAreaMeta(item, nextMap).isActive)
          .map((item) => {
            const meta = resolvePracticeAreaMeta(item, nextMap);
            return {
              title: meta.label,
              desc: meta.description || descriptionFallback(meta.label),
            };
          }),
      };
      await api.patch("/landing-page/", payload);
    } catch (error: any) {
      toast.error(error?.message || "A área foi salva, mas a sincronização da landing falhou.");
    }
  };

  const closeFormDialog = () => {
    setDialogOpen(false);
    setEditingAreaId(null);
    setForm(EMPTY_FORM());
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        area: normalizePracticeAreaCode(form.code),
        description: form.description.trim(),
        landing_icon: practiceAreaIconToLandingIcon(form.icon),
        landing_link: form.landingLink.trim(),
        display_order: form.landingOrder,
        show_on_landing: form.showOnLanding,
        is_active: form.status === "active",
      };
      if (editingAreaId) return await api.patch<AreaItem>(`/causes/${editingAreaId}/`, payload);
      return await api.post<AreaItem>("/causes/", payload);
    },
    onSuccess: async (savedArea) => {
      const responsible = employeesById[form.responsibleId];
      const nextMeta: PracticeAreaUiMeta = {
        description: form.description.trim(),
        color: form.color,
        icon: form.icon,
        responsibleId: form.responsibleId,
        responsibleName: responsible?.full_name || responsible?.email || "",
        status: form.status,
      };
      let nextMap = uiMap;
      try {
        nextMap = await persistAreaMeta(savedArea.id, nextMeta);
      } catch (error: any) {
        toast.error(error?.message || "A área foi salva, mas os metadados visuais não puderam ser persistidos.");
      }

      const nextAreas = editingAreaId
        ? areas.map((item) => (item.id === savedArea.id ? { ...item, ...savedArea } : item))
        : [savedArea, ...areas];

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["practice-areas"] }),
        queryClient.invalidateQueries({ queryKey: ["practice-areas-for-process"] }),
      ]);
      await landingSync(nextAreas, nextMap);
      toast.success(editingAreaId ? "Área atualizada com sucesso." : "Área criada com sucesso.");
      closeFormDialog();
      setSelectedAreaId(savedArea.id);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Não foi possível salvar a área.");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (area: AreaInsight) => {
      return await api.patch<AreaItem>(`/causes/${area.id}/`, { is_active: !area.isActive });
    },
    onSuccess: async (savedArea, area) => {
      let nextMap = uiMap;
      try {
        nextMap = await persistAreaMeta(area.id, {
          ...(uiMap[area.id] || {}),
          status: area.isActive ? "inactive" : "active",
        });
      } catch (error: any) {
        toast.error(error?.message || "O status foi alterado, mas a configuração complementar da área não foi persistida.");
      }
      const nextAreas = areas.map((item) => (item.id === savedArea.id ? { ...item, ...savedArea } : item));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["practice-areas"] }),
        queryClient.invalidateQueries({ queryKey: ["practice-areas-for-process"] }),
      ]);
      await landingSync(nextAreas, nextMap);
      toast.success(area.isActive ? "Área desativada." : "Área reativada.");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Não foi possível atualizar o status da área.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (area: AreaInsight) => {
      await api.delete(`/causes/${area.id}/`);
      return area;
    },
    onSuccess: async (area) => {
      let nextMap = uiMap;
      try {
        nextMap = await removeAreaMeta(area.id);
      } catch (error: any) {
        toast.error(error?.message || "A área foi removida, mas os metadados complementares não puderam ser limpos.");
      }
      const nextAreas = areas.filter((item) => item.id !== area.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["practice-areas"] }),
        queryClient.invalidateQueries({ queryKey: ["practice-areas-for-process"] }),
      ]);
      await landingSync(nextAreas, nextMap);
      toast.success("Área removida com sucesso.");
      if (selectedAreaId === area.id) setSelectedAreaId(null);
      setAreaPendingDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Não foi possível excluir a área.");
    },
  });

  const startCreate = (presetCode?: string) => {
    const preset = getPracticeAreaPreset(presetCode || "civel");
    setEditingAreaId(null);
    setForm({
      name: preset.label,
      code: preset.code,
      description: preset.description,
      landingLink: "",
      landingOrder: areaInsights.length,
      showOnLanding: true,
      color: preset.color,
      icon: preset.icon,
      responsibleId: "",
      status: "active",
    });
    setDialogOpen(true);
  };

  const startEdit = (area: AreaInsight) => {
    setEditingAreaId(area.id);
    setForm(buildFormFromArea(area, employeesById));
    setDialogOpen(true);
  };

  const isLoading = [areasQuery.isLoading, processesQuery.isLoading, hearingsQuery.isLoading, deadlinesQuery.isLoading].some(Boolean);

  return (
    <div className="page-container space-y-6 animate-fade-in">
      <div className="page-header items-start gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Organização jurídica por especialidade
          </div>
          <div>
            <h1 className="page-title">Áreas de Atuação</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Estruture o escritório por especialidade, acompanhe a distribuição de processos, audiências e prazos e use a classificação das áreas como filtro real no sistema.
            </p>
          </div>
        </div>

        <Button className="shrink-0" onClick={() => startCreate()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova área
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome da área, descrição ou responsável"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
            <SelectTrigger className="min-w-[180px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              <SelectItem value="active">Somente ativas</SelectItem>
              <SelectItem value="inactive">Somente inativas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
            <SelectTrigger className="min-w-[210px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {responsibleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="inline-flex items-center rounded-lg border border-border/70 bg-background p-1">
            <Button type="button" size="sm" variant={layout === "cards" ? "default" : "ghost"} onClick={() => setLayout("cards")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant={layout === "list" ? "default" : "ghost"} onClick={() => setLayout("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BriefcaseBusiness}
          label="Áreas cadastradas"
          value={isLoading ? "..." : formatCount(headerMetrics.totalAreas)}
          helper={`${formatCount(headerMetrics.activeAreas)} ativas para uso em processos e filtros`}
        />
        <MetricCard
          icon={FolderKanban}
          label="Processos organizados"
          value={isLoading ? "..." : formatCount(headerMetrics.totalProcesses)}
          helper={headerMetrics.topByProcesses ? `${headerMetrics.topByProcesses.label} lidera a carteira atual` : "Cadastre áreas para medir a carteira"}
        />
        <MetricCard
          icon={Clock3}
          label="Área com mais prazos"
          value={headerMetrics.topByDeadlines ? formatCount(headerMetrics.topByDeadlines.deadlineCount) : "--"}
          helper={headerMetrics.topByDeadlines ? `${headerMetrics.topByDeadlines.label} concentra mais vencimentos` : "Sem prazos vinculados ainda"}
        />
        <MetricCard
          icon={BarChart3}
          label="Crescimento recente"
          value={headerMetrics.topGrowth ? metricDelta(headerMetrics.topGrowth.currentWindowCount, headerMetrics.topGrowth.previousWindowCount) : "--"}
          helper={headerMetrics.topGrowth ? `${headerMetrics.topGrowth.label} nos últimos ${DAYS_WINDOW} dias` : "Sem histórico suficiente para comparar"}
        />
      </div>

      {areasQuery.isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            {String((areasQuery.error as any)?.message || "Não foi possível carregar as áreas de atuação.")}
          </CardContent>
        </Card>
      ) : null}

      {filteredAreas.length === 0 && !areasQuery.isLoading ? (
        <Card className="border-dashed border-border/70 shadow-card">
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Comece estruturando as especialidades do escritório</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Crie áreas como Civil, Trabalhista, Previdenciário ou Empresarial para classificar processos, apoiar relatórios e melhorar filtros em toda a operação.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {PRACTICE_AREA_PRESETS.slice(0, 6).map((preset) => {
                const Icon = getPracticeAreaIcon(preset.icon);
                return (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => startCreate(preset.code)}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm"
                    style={practiceAreaPillStyle(preset.color)}
                  >
                    <Icon className="h-4 w-4" />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {filteredAreas.length > 0 ? (
        layout === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAreas.map((area) => (
              <AreaCard
                key={area.id}
                area={area}
                onOpen={() => setSelectedAreaId(area.id)}
                onEdit={() => startEdit(area)}
                onDelete={() => setAreaPendingDelete(area)}
                onToggleStatus={() => toggleStatusMutation.mutate(area)}
                onViewProcesses={() => navigate("/app/processos")}
                isBusy={toggleStatusMutation.isPending && toggleStatusMutation.variables?.id === area.id}
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Área</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[180px]">Responsável</TableHead>
                  <TableHead className="w-[110px] text-center">Processos</TableHead>
                  <TableHead className="w-[110px] text-center">Audiências</TableHead>
                  <TableHead className="w-[110px] text-center">Prazos</TableHead>
                  <TableHead className="w-[80px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <AreaRow
                    key={area.id}
                    area={area}
                    onOpen={() => setSelectedAreaId(area.id)}
                    onEdit={() => startEdit(area)}
                    onDelete={() => setAreaPendingDelete(area)}
                    onToggleStatus={() => toggleStatusMutation.mutate(area)}
                    onViewProcesses={() => navigate("/app/processos")}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={(nextOpen) => (!nextOpen ? closeFormDialog() : setDialogOpen(true))}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAreaId ? "Editar área de atuação" : "Nova área de atuação"}</DialogTitle>
            <DialogDescription>
              Cadastre a especialidade principal do escritório, com identidade visual e responsável para uso em processos, filtros e dashboards.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome da área</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Direito Civil" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Link do card na landing</Label>
              <Input value={form.landingLink} onChange={(event) => setForm((current) => ({ ...current, landingLink: event.target.value }))} placeholder="https://wa.me/... ou /contato" />
            </div>

            <div className="space-y-2">
              <Label>Classificacao base</Label>
              <Select value={form.code} onValueChange={(value) => setForm((current) => ({ ...current, code: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRACTICE_AREA_PRESETS.map((preset) => (
                    <SelectItem key={preset.code} value={preset.code}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={form.responsibleId || "__none"} onValueChange={(value) => setForm((current) => ({ ...current, responsibleId: value === "__none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Definir depois" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Definir depois</SelectItem>
                  {responsibleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Descrição estratégica</Label>
              <Textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select value={form.icon} onValueChange={(value) => setForm((current) => ({ ...current, icon: value as PracticeAreaIconKey }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRACTICE_AREA_ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor da área</Label>
              <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background px-3 py-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                  className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
                />
                <Input value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} placeholder="#2563eb" />
              </div>
            </div>

            <div className="md:col-span-2 rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">Status da área</Label>
                  <p className="text-sm text-muted-foreground">Áreas ativas aparecem como opção principal em processos e filtros do sistema.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{form.status === "active" ? "Ativa" : "Inativa"}</span>
                  <Switch checked={form.status === "active"} onCheckedChange={(checked) => setForm((current) => ({ ...current, status: checked ? "active" : "inactive" }))} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-xl border border-border/70 bg-muted/30 p-4">
              <div className="grid gap-4 md:grid-cols-[170px_minmax(0,1fr)] md:items-center">
                <div className="space-y-2">
                  <Label>Ordem na landing</Label>
                  <Input type="number" value={form.landingOrder} onChange={(event) => setForm((current) => ({ ...current, landingOrder: Number(event.target.value) }))} />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background px-4 py-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Mostrar na landing</Label>
                    <p className="text-sm text-muted-foreground">Controla se o card aparece na seÃ§Ã£o institucional do site.</p>
                  </div>
                  <Switch checked={form.showOnLanding} onCheckedChange={(checked) => setForm((current) => ({ ...current, showOnLanding: checked }))} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-border/70 p-4" style={practiceAreaAccentStyle(form.color)}>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={practiceAreaSolidStyle(form.color)}>
                  {(() => {
                    const Icon = getPracticeAreaIcon(form.icon);
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-foreground">{form.name || "Nova área"}</span>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" style={practiceAreaPillStyle(form.color)}>
                      {statusLabel(form.status === "active")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{form.description || "Defina uma descrição objetiva para explicar o uso da área no escritório."}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => saveMutation.mutate()} disabled={!form.name.trim() || !form.code.trim() || saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : editingAreaId ? "Salvar alterações" : "Salvar área"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedArea} onOpenChange={(open) => (!open ? setSelectedAreaId(null) : null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedArea ? (
            <div className="space-y-6">
              <SheetHeader className="border-b border-border/60 pb-4 pr-10">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm" style={practiceAreaSolidStyle(selectedArea.color)}>
                    {(() => {
                      const Icon = getPracticeAreaIcon(selectedArea.icon);
                      return <Icon className="h-6 w-6" />;
                    })()}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <SheetTitle>{selectedArea.label}</SheetTitle>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" style={practiceAreaPillStyle(selectedArea.color)}>
                        {selectedArea.code}
                      </span>
                      <Badge variant={selectedArea.isActive ? "default" : "secondary"}>{statusLabel(selectedArea.isActive)}</Badge>
                    </div>
                    <SheetDescription>{selectedArea.description}</SheetDescription>
                    <p className="text-sm text-muted-foreground">
                      Responsável: <span className="font-medium text-foreground">{selectedArea.responsibleName || "Não definido"}</span>
                    </p>
                  </div>
                </div>
              </SheetHeader>

              <div className="grid gap-3 sm:grid-cols-3">
                <MiniStatCard title="Processos" value={formatCount(selectedArea.processCount)} />
                <MiniStatCard title="Audiências" value={formatCount(selectedArea.hearingCount)} />
                <MiniStatCard title="Prazos" value={formatCount(selectedArea.deadlineCount)} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => startEdit(selectedArea)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar área
                </Button>
                <Button variant="outline" onClick={() => toggleStatusMutation.mutate(selectedArea)}>
                  {selectedArea.isActive ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                  {selectedArea.isActive ? "Desativar" : "Reativar"}
                </Button>
                <Button onClick={() => navigate("/app/processos")}>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Ir para processos
                </Button>
              </div>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Leitura estratégica da área</CardTitle>
                  <CardDescription>Volume atual, crescimento recente e concentração de eventos jurídicos.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Crescimento</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{metricDelta(selectedArea.currentWindowCount, selectedArea.previousWindowCount)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedArea.currentWindowCount} processos nos últimos {DAYS_WINDOW} dias frente a {selectedArea.previousWindowCount} no período anterior.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Carga operacional</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{formatCount(selectedArea.hearingCount + selectedArea.deadlineCount)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Entre audiências e prazos vinculados aos processos dessa especialidade.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Processos vinculados</CardTitle>
                  <CardDescription>Carteira classificada nesta área para consulta rápida.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedArea.linkedProcesses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                      Nenhum processo vinculado ainda. Ao classificar processos com esta área, eles passam a aparecer aqui automaticamente.
                    </div>
                  ) : (
                    selectedArea.linkedProcesses.slice(0, 6).map((process) => (
                      <button
                        key={process.id}
                        type="button"
                        onClick={() => navigate(`/app/processos/${process.id}`)}
                        className="flex w-full items-center justify-between rounded-2xl border border-border/70 p-4 text-left transition hover:border-primary/35 hover:bg-muted/30"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{processLabel(process)}</p>
                          <p className="text-sm text-muted-foreground">
                            {[process.class_name, process.court_division, process.court].filter(Boolean).join(" • ") || "Sem tribunal e classe detalhados"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cliente: {process.client_name || process.cliente_nome || "Não informado"}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Últimos eventos da área</CardTitle>
                  <CardDescription>Audiências e prazos recentes para contextualizar a operação dessa especialidade.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedArea.recentEvents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                      Ainda não há audiências ou prazos ligados a esta área.
                    </div>
                  ) : (
                    selectedArea.recentEvents.map((event) => (
                      <div key={event.id} className="rounded-2xl border border-border/70 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={event.kind === "hearing" ? "default" : "secondary"}>{event.kind === "hearing" ? "Audiência" : "Prazo"}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(event.date)}</span>
                          <span className="text-xs text-muted-foreground">{event.status.replaceAll("_", " ")}</span>
                        </div>
                        <p className="mt-3 font-medium text-foreground">{event.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{event.processLabel}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!areaPendingDelete} onOpenChange={(open) => (!open ? setAreaPendingDelete(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir área de atuação?</AlertDialogTitle>
            <AlertDialogDescription>
              {areaPendingDelete
                ? `A área "${areaPendingDelete.label}" será removida do cadastro. Os processos existentes continuam com o código salvo no backend, mas a configuração visual e os filtros dessa área deixam de existir.`
                : "Confirme a exclusão da área."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => areaPendingDelete && deleteMutation.mutate(areaPendingDelete)}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir área"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="overflow-hidden border-border/60 shadow-card">
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
          <p className="text-xs leading-5 text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AreaCard({
  area,
  onOpen,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewProcesses,
  isBusy,
}: {
  area: AreaInsight;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onViewProcesses: () => void;
  isBusy?: boolean;
}) {
  const Icon = getPracticeAreaIcon(area.icon);
  const nextEvent = area.recentEvents[0] || null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group text-left"
    >
      <Card className="h-full overflow-hidden border-border/60 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg" style={practiceAreaAccentStyle(area.color)}>
        <CardContent className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm" style={practiceAreaSolidStyle(area.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-foreground">{area.label}</span>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold" style={practiceAreaPillStyle(area.color)}>
                    {area.code}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{area.description}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={(event) => event.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onOpen}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onViewProcesses}>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Ver processos vinculados
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onToggleStatus}>
                  {area.isActive ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                  {area.isActive ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={area.isActive ? "default" : "secondary"}>{statusLabel(area.isActive)}</Badge>
            <span className="text-sm text-muted-foreground">
              Responsável: <span className="font-medium text-foreground">{area.responsibleName || "Não definido"}</span>
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatChip icon={FolderKanban} label="Processos" value={area.processCount} />
            <StatChip icon={CalendarClock} label="Audiências" value={area.hearingCount} />
            <StatChip icon={Clock3} label="Prazos" value={area.deadlineCount} />
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Leitura rápida</p>
            {nextEvent ? (
              <div className="mt-3 space-y-2">
                <p className="font-medium text-foreground">{nextEvent.title}</p>
                <p className="text-sm text-muted-foreground">{nextEvent.processLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(nextEvent.date)} · {nextEvent.kind === "hearing" ? "Audiência" : "Prazo"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Sem eventos recentes. Use esta área para classificar processos e destravar a análise por especialidade.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Crescimento recente: <span className="font-medium text-foreground">{metricDelta(area.currentWindowCount, area.previousWindowCount)}</span>
            </span>
            <span className={cn("inline-flex items-center gap-1 font-medium text-primary", isBusy && "opacity-60")}>
              Abrir detalhes
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AreaRow({
  area,
  onOpen,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewProcesses,
}: {
  area: AreaInsight;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onViewProcesses: () => void;
}) {
  const Icon = getPracticeAreaIcon(area.icon);

  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={practiceAreaSolidStyle(area.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{area.label}</span>
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={practiceAreaPillStyle(area.color)}>
                {area.code}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{area.description}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={area.isActive ? "default" : "secondary"}>{statusLabel(area.isActive)}</Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {area.responsibleName || <span className="text-muted-foreground/50 italic">Não definido</span>}
      </TableCell>
      <TableCell className="text-center font-semibold">{area.processCount}</TableCell>
      <TableCell className="text-center font-semibold">{area.hearingCount}</TableCell>
      <TableCell className="text-center font-semibold">{area.deadlineCount}</TableCell>
      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpen}>
              <Eye className="mr-2 h-4 w-4" />Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onViewProcesses}>
              <FolderKanban className="mr-2 h-4 w-4" />Ver processos
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleStatus}>
              {area.isActive ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
              {area.isActive ? "Desativar" : "Ativar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-[0.16em]">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground">{formatCount(value)}</p>
    </div>
  );
}

function RowMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{formatCount(value)}</p>
    </div>
  );
}
