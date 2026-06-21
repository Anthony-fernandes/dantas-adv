import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Gavel,
  Scale,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Plus,
  CheckSquare,
  Clock,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { cn } from "@/lib/utils";
import { resolvePracticeAreaByCode, type PracticeAreaUiMeta } from "@/lib/practice-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type DashboardDeadlineRecord,
  type DashboardProcessRecord,
  getStrategicDashboardData,
} from "@/services/dashboard";
import { loadWorkspaceStateMap } from "@/services/workspaceState";

type PeriodPreset = "today" | "7d" | "30d" | "month" | "custom";
type Tone = "default" | "success" | "warning" | "danger" | "info";
type ComparisonTone = "positive" | "negative" | "neutral";

type DateRange = {
  start: Date;
  end: Date;
  label: string;
  days: number;
};

type ProcessInsight = DashboardProcessRecord & {
  clientName: string;
  responsibleName: string;
  responsibleKey: string;
  areaCode: string;
  areaLabel: string;
  areaColor: string;
  lastTouchAt: string | null;
};

type AlertItem = {
  id: string;
  title: string;
  description: string;
  tone: Tone;
  actionLabel: string;
  onClick: () => void;
};

type ActivityItem = {
  id: string;
  type: "process" | "movement" | "hearing" | "document" | "payment";
  title: string;
  description: string;
  date: string | null;
  onClick: () => void;
};

type KpiComparison = {
  label: string;
  tone: ComparisonTone;
};

const DAY_MS = 86400000;
const PIE_COLORS = ["#111827", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db"];

const PERIOD_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "month", label: "Mês atual" },
  { value: "custom", label: "Personalizado" },
];

function normalizeText(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function toDate(value?: string | null) {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function parseDateInput(value: string, fallback: Date) {
  const parsed = toDate(value);
  return parsed ? startOfDay(parsed) : startOfDay(fallback);
}

function resolveRange(period: PeriodPreset, customFrom: string, customTo: string): DateRange {
  const now = new Date();
  const today = startOfDay(now);

  if (period === "today") {
    return { start: today, end: endOfDay(today), label: "Hoje", days: 1 };
  }

  if (period === "7d") {
    const end = endOfDay(addDays(today, 6));
    return { start: today, end, label: "Próximos 7 dias", days: 7 };
  }

  if (period === "30d") {
    const end = endOfDay(addDays(today, 29));
    return { start: today, end, label: "Próximos 30 dias", days: 30 };
  }

  if (period === "month") {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return {
      start,
      end,
      label: "Mês atual",
      days: Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1),
    };
  }

  const start = parseDateInput(customFrom, today);
  const end = endOfDay(parseDateInput(customTo, addDays(today, 6)));
  const normalizedEnd = end >= start ? end : endOfDay(start);
  return {
    start,
    end: normalizedEnd,
    label: "Período personalizado",
    days: Math.max(1, Math.round((normalizedEnd.getTime() - start.getTime()) / DAY_MS) + 1),
  };
}

function previousRange(range: DateRange): DateRange {
  const end = endOfDay(addDays(range.start, -1));
  const start = startOfDay(addDays(end, -(range.days - 1)));
  return { start, end, label: "Período anterior", days: range.days };
}

function formatDate(value?: string | Date | null) {
  const parsed = value instanceof Date ? value : toDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value?: string | Date | null) {
  const parsed = value instanceof Date ? value : toDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(value?: string | number | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(amount) ? amount : 0);
}

function formatCompactCurrency(value?: string | number | null) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(Number.isFinite(amount) ? amount : 0);
}

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function humanizeValue(value?: string | null) {
  const text = String(value || "").trim();
  if (!text) return "-";
  return text.replace(/_/g, " ").split(" ").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
}

function monthKey(value?: string | null) {
  const parsed = toDate(value);
  if (!parsed) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  const parsed = new Date(Number(year), Number(month) - 1, 1);
  return parsed.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function inRange(value: string | null | undefined, range: DateRange) {
  const parsed = toDate(value);
  if (!parsed) return false;
  return parsed >= range.start && parsed <= range.end;
}

function daysUntil(value: string | null | undefined) {
  const parsed = toDate(value);
  if (!parsed) return null;
  const target = startOfDay(parsed).getTime();
  const today = startOfDay(new Date()).getTime();
  return Math.round((target - today) / DAY_MS);
}

function isClosedProcess(status?: string | null) {
  const normalized = normalizeText(status);
  return ["encerrado", "arquivado", "finalizado"].includes(normalized);
}

function isCompletedDeadline(status?: string | null) {
  return ["concluido", "cumprido", "realizado"].includes(normalizeText(status));
}

function isOverdueDeadline(deadline: DashboardDeadlineRecord) {
  const diff = daysUntil(deadline.due_date);
  return diff !== null && diff < 0 && !isCompletedDeadline(deadline.status);
}

function receivableIsOverdue(status?: string | null) {
  return ["vencida", "vencido", "atrasado"].includes(normalizeText(status));
}

function resolveProcessId(item: { process?: string | null; process_id?: string | null }) {
  return String(item.process || item.process_id || "").trim();
}

function buildComparison(current: number, previous: number, direction: "up" | "down" = "up", formatter: (value: number) => string = formatCount): KpiComparison {
  const diff = current - previous;
  if (diff === 0) return { label: "Sem variação vs. período anterior", tone: "neutral" };
  const positive = diff > 0;
  const tone: ComparisonTone = direction === "up" ? (positive ? "positive" : "negative") : (positive ? "negative" : "positive");
  return { label: `${positive ? "+" : ""}${formatter(diff)} vs. período anterior`, tone };
}

function sumAmount<T extends { amount?: string | number | null }>(items: T[]) {
  return items.reduce((acc, item) => acc + Number(item.amount || 0), 0);
}

function buildMonthSeries(months: number, mapper: (key: string) => Record<string, string | number>) {
  const now = new Date();
  return Array.from({ length: months }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - index - 1), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { month: monthLabel(key), ...mapper(key) };
  });
}

function comparisonClassName(tone: ComparisonTone) {
  if (tone === "positive") return "text-success";
  if (tone === "negative") return "text-destructive";
  return "text-muted-foreground";
}

function toneBadgeVariant(tone: Tone) {
  if (tone === "success") return "success" as const;
  if (tone === "warning") return "warning" as const;
  if (tone === "danger") return "destructive" as const;
  if (tone === "info") return "info" as const;
  return "muted" as const;
}

function toneCardClassName(tone: Tone) {
  if (tone === "success") return "border-success/25 bg-success/5";
  if (tone === "warning") return "border-warning/25 bg-warning/5";
  if (tone === "danger") return "border-destructive/25 bg-destructive/5";
  if (tone === "info") return "border-info/25 bg-info/5";
  return "border-border bg-card";
}

function toneAccentClassName(tone: Tone) {
  if (tone === "success") return "bg-success/70";
  if (tone === "warning") return "bg-warning/70";
  if (tone === "danger") return "bg-destructive/80";
  if (tone === "info") return "bg-info/70";
  return "bg-gold/70";
}

function toneIconClassName(tone: Tone) {
  if (tone === "success") return "border-success/20 bg-success/10 text-success";
  if (tone === "warning") return "border-warning/20 bg-warning/10 text-warning";
  if (tone === "danger") return "border-destructive/20 bg-destructive/10 text-destructive";
  if (tone === "info") return "border-info/20 bg-info/10 text-info";
  return "border-border bg-accent/55 text-foreground";
}

function activityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "process":
      return BriefcaseBusiness;
    case "movement":
      return Activity;
    case "hearing":
      return Gavel;
    case "document":
      return FileText;
    case "payment":
      return DollarSign;
    default:
      return Activity;
  }
}

function DashboardKpiCard(props: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  tone?: Tone;
  tooltip: string;
  comparison?: KpiComparison;
  onClick?: () => void;
}) {
  const { title, value, description, icon: Icon, tone = "default", tooltip, comparison, onClick } = props;
  const clickable = typeof onClick === "function";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "stat-card p-5 text-left transition-all",
            clickable ? "hover:-translate-y-0.5 hover:shadow-elevated" : "cursor-default",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="kpi-label">{title}</p>
              <p className="text-[2.2rem] font-bold leading-none tracking-tight text-foreground">
                {typeof value === "number" ? formatCount(value) : value}
              </p>
            </div>
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-md border", toneIconClassName(tone))}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            {comparison ? <p className={cn("text-xs font-medium", comparisonClassName(comparison.tone))}>{comparison.label}</p> : <span />}
            {clickable ? <span className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Abrir</span> : null}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function SectionHeader(props: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  const { title, description, actionLabel, onAction } = props;
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[1.4rem] font-bold tracking-[-0.02em] text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button variant="outline" size="sm" className="rounded-md" onClick={onAction}>
          {actionLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { roles, isSuperuser } = useAuth();
  const { activeTenantId } = useTenant();

  const [period, setPeriod] = useState<PeriodPreset>("7d");
  const [search, setSearch] = useState("");
  const [customFrom, setCustomFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(() => addDays(new Date(), 6).toISOString().slice(0, 10));
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const canSeeFinance = roles?.some((role) => ["OWNER", "ADMIN", "FINANCE"].includes(role)) ?? false;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "strategic", activeTenantId, canSeeFinance],
    enabled: isSuperuser || !!activeTenantId,
    queryFn: () => getStrategicDashboardData({ includeFinance: canSeeFinance }),
  });

  const areaUiQuery = useQuery({
    queryKey: ["workspace-state", "practice_area_ui", activeTenantId],
    enabled: !!activeTenantId,
    queryFn: () => loadWorkspaceStateMap<PracticeAreaUiMeta>("practice_area_ui"),
  });

  const data = dashboardQuery.data;
  const range = useMemo(() => resolveRange(period, customFrom, customTo), [customFrom, customTo, period]);
  const prevRange = useMemo(() => previousRange(range), [range]);

  const areaUiMap = areaUiQuery.data ?? {};

  const clientsById = useMemo(
    () =>
      new Map(
        (data?.clients ?? []).map((client) => [
          client.id,
          String(client.name || client.full_name || client.razao_social || "Cliente").trim(),
        ]),
      ),
    [data?.clients],
  );

  const processes = useMemo<ProcessInsight[]>(() => {
    return (data?.processes ?? []).map((process) => {
      const areaMeta = resolvePracticeAreaByCode(process.area, data?.areas, areaUiMap);
      const responsibles = Array.isArray(process.responsaveis)
        ? process.responsaveis.map((item) => String(item?.name || item?.full_name || item?.email || "").trim()).filter(Boolean)
        : [];
      const responsibleId = Array.isArray(process.responsaveis) && process.responsaveis[0]?.id ? String(process.responsaveis[0].id) : "";
      const responsibleName = responsibles.join(", ") || "Não definido";
      const responsibleKey = responsibleId || (responsibleName !== "Não definido" ? `name:${normalizeText(responsibleName)}` : "");

      return {
        ...process,
        clientName:
          process.client_name
          || process.cliente_nome
          || clientsById.get(String(process.client || process.client_id || ""))
          || "Sem cliente",
        responsibleName,
        responsibleKey,
        areaCode: areaMeta.code,
        areaLabel: areaMeta.label,
        areaColor: areaMeta.color,
        lastTouchAt: process.updated_at || process.created_at || null,
      };
    });
  }, [areaUiMap, clientsById, data?.areas, data?.processes]);

  const processMap = useMemo(() => new Map(processes.map((process) => [process.id, process])), [processes]);

  const responsibleOptions = useMemo(() => {
    const map = new Map<string, string>();
    (data?.employees ?? []).forEach((employee) => {
      if (employee.is_active === false) return;
      const label = String(employee.full_name || employee.email || "").trim();
      if (label) map.set(employee.id, label);
    });
    processes.forEach((process) => {
      if (process.responsibleKey && process.responsibleName !== "Não definido") {
        map.set(process.responsibleKey, process.responsibleName);
      }
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label })).sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
  }, [data?.employees, processes]);

  const areaOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    (data?.areas ?? []).forEach((area) => {
      const meta = resolvePracticeAreaByCode(area.area, data?.areas, areaUiMap);
      map.set(meta.code, { value: meta.code, label: meta.label });
    });
    processes.forEach((process) => {
      if (process.areaCode) map.set(process.areaCode, { value: process.areaCode, label: process.areaLabel });
    });
    return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
  }, [areaUiMap, data?.areas, processes]);

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set(processes.map((process) => normalizeText(process.status)).filter(Boolean)));
    return values.map((value) => ({ value, label: humanizeValue(value) })).sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
  }, [processes]);

  const filteredProcesses = useMemo(() => {
    const query = normalizeText(search);
    return processes.filter((process) => {
      if (responsibleFilter !== "all" && process.responsibleKey !== responsibleFilter) return false;
      if (areaFilter !== "all" && process.areaCode !== areaFilter) return false;
      if (statusFilter !== "all" && normalizeText(process.status) !== statusFilter) return false;
      if (!query) return true;
      return [process.cnj, process.clientName, process.defendant, process.plaintiff, process.responsibleName, process.areaLabel, process.court, process.court_division, process.class_name]
        .some((value) => normalizeText(String(value || "")).includes(query));
    });
  }, [areaFilter, processes, responsibleFilter, search, statusFilter]);

  const processFiltersActive = search || responsibleFilter !== "all" || areaFilter !== "all" || statusFilter !== "all";
  const visibleProcessIds = useMemo(() => new Set(filteredProcesses.map((process) => process.id)), [filteredProcesses]);

  const filteredDeadlines = useMemo(() => {
    return (data?.deadlines ?? []).filter((deadline) => {
      const processId = resolveProcessId(deadline);
      if (!processFiltersActive) return true;
      return !!processId && visibleProcessIds.has(processId);
    });
  }, [data?.deadlines, processFiltersActive, visibleProcessIds]);

  const filteredHearings = useMemo(() => {
    return (data?.hearings ?? []).filter((hearing) => {
      const processId = resolveProcessId(hearing);
      if (!processFiltersActive) return true;
      return !!processId && visibleProcessIds.has(processId);
    });
  }, [data?.hearings, processFiltersActive, visibleProcessIds]);

  const filteredDocuments = useMemo(() => {
    return (data?.documents ?? []).filter((document) => {
      if (!processFiltersActive) return true;
      return !!document.process && visibleProcessIds.has(String(document.process));
    });
  }, [data?.documents, processFiltersActive, visibleProcessIds]);

  const filteredMovements = useMemo(() => {
    return (data?.movements ?? []).filter((movement) => {
      const processId = resolveProcessId(movement);
      if (!processFiltersActive) return true;
      return !!processId && visibleProcessIds.has(processId);
    });
  }, [data?.movements, processFiltersActive, visibleProcessIds]);

  const filteredReceivables = useMemo(() => {
    return (data?.receivables ?? []).filter((item) => {
      if (!processFiltersActive) return true;
      return !!item.process && visibleProcessIds.has(String(item.process));
    });
  }, [data?.receivables, processFiltersActive, visibleProcessIds]);

  const filteredPayables = useMemo(() => {
    return (data?.payables ?? []).filter((item) => {
      if (!processFiltersActive) return true;
      return !!item.process && visibleProcessIds.has(String(item.process));
    });
  }, [data?.payables, processFiltersActive, visibleProcessIds]);

  const filteredPayments = useMemo(() => {
    return (data?.payments ?? []).filter((item) => {
      if (!processFiltersActive) return true;
      return !!item.process && visibleProcessIds.has(String(item.process));
    });
  }, [data?.payments, processFiltersActive, visibleProcessIds]);

  const visibleClientIds = useMemo(
    () => new Set(filteredProcesses.map((process) => String(process.client || process.client_id || "")).filter(Boolean)),
    [filteredProcesses],
  );

  const filteredClients = useMemo(() => {
    if (!processFiltersActive) return data?.clients ?? [];
    return (data?.clients ?? []).filter((client) => visibleClientIds.has(client.id));
  }, [data?.clients, processFiltersActive, visibleClientIds]);

  const processCounts = useMemo(() => {
    const active = filteredProcesses.filter((process) => !isClosedProcess(process.status)).length;
    const closed = filteredProcesses.filter((process) => isClosedProcess(process.status)).length;
    const previousActive = filteredProcesses.filter((process) => {
      const createdAt = toDate(process.created_at || process.updated_at || null);
      return !!createdAt && createdAt <= prevRange.end && !isClosedProcess(process.status);
    }).length;
    const previousClosed = filteredProcesses.filter((process) => {
      const createdAt = toDate(process.created_at || process.updated_at || null);
      return !!createdAt && createdAt <= prevRange.end && isClosedProcess(process.status);
    }).length;
    return { active, closed, previousActive, previousClosed };
  }, [filteredProcesses, prevRange.end]);

  const deadlinesInRange = useMemo(
    () => filteredDeadlines.filter((deadline) => inRange(deadline.due_date, range) && !isCompletedDeadline(deadline.status)),
    [filteredDeadlines, range],
  );

  const previousDeadlinesInRange = useMemo(
    () => filteredDeadlines.filter((deadline) => inRange(deadline.due_date, prevRange) && !isCompletedDeadline(deadline.status)),
    [filteredDeadlines, prevRange],
  );

  const overdueDeadlines = useMemo(() => filteredDeadlines.filter((deadline) => isOverdueDeadline(deadline)), [filteredDeadlines]);

  const previousOverdueDeadlines = useMemo(
    () => filteredDeadlines.filter((deadline) => {
      const due = toDate(deadline.due_date);
      return !!due && due < prevRange.end && !isCompletedDeadline(deadline.status);
    }),
    [filteredDeadlines, prevRange.end],
  );

  const hearingsInRange = useMemo(() => filteredHearings.filter((hearing) => inRange(hearing.hearing_date, range)), [filteredHearings, range]);
  const previousHearingsInRange = useMemo(() => filteredHearings.filter((hearing) => inRange(hearing.hearing_date, prevRange)), [filteredHearings, prevRange]);
  const hearingsToday = useMemo(() => filteredHearings.filter((hearing) => daysUntil(hearing.hearing_date) === 0), [filteredHearings]);

  const hearingsSameDayLastWeek = useMemo(
    () => filteredHearings.filter((hearing) => {
      const parsed = toDate(hearing.hearing_date);
      if (!parsed) return false;
      const target = startOfDay(addDays(new Date(), -7));
      return startOfDay(parsed).getTime() === target.getTime();
    }),
    [filteredHearings],
  );

  const currentMonth = useMemo(() => monthKey(new Date().toISOString()), []);
  const previousMonthDate = useMemo(() => addDays(startOfMonth(new Date()), -1), []);
  const previousMonthKey = useMemo(() => monthKey(previousMonthDate.toISOString()), [previousMonthDate]);

  const faturamentoMes = useMemo(() => sumAmount(filteredReceivables.filter((item) => monthKey(item.due_date) === currentMonth)), [currentMonth, filteredReceivables]);
  const faturamentoMesAnterior = useMemo(() => sumAmount(filteredReceivables.filter((item) => monthKey(item.due_date) === previousMonthKey)), [filteredReceivables, previousMonthKey]);
  const recebimentosMes = useMemo(() => sumAmount(filteredPayments.filter((item) => monthKey(item.payment_date || item.created_at) === currentMonth)), [currentMonth, filteredPayments]);
  const recebimentosMesAnterior = useMemo(() => sumAmount(filteredPayments.filter((item) => monthKey(item.payment_date || item.created_at) === previousMonthKey)), [filteredPayments, previousMonthKey]);
  const despesasMes = useMemo(() => sumAmount(filteredPayables.filter((item) => monthKey(item.due_date) === currentMonth)), [currentMonth, filteredPayables]);
  const despesasMesAnterior = useMemo(() => sumAmount(filteredPayables.filter((item) => monthKey(item.due_date) === previousMonthKey)), [filteredPayables, previousMonthKey]);
  const inadimplencia = useMemo(() => sumAmount(filteredReceivables.filter((item) => receivableIsOverdue(item.status))), [filteredReceivables]);
  const inadimplenciaAnterior = useMemo(
    () => sumAmount(filteredReceivables.filter((item) => {
      const due = toDate(item.due_date);
      return !!due && due <= previousMonthDate && receivableIsOverdue(item.status);
    })),
    [filteredReceivables, previousMonthDate],
  );

  const processesByStatus = useMemo(() => {
    const counts = new Map<string, number>();
    filteredProcesses.forEach((process) => {
      const label = humanizeValue(process.status);
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([status, total]) => ({ status, total })).sort((left, right) => right.total - left.total);
  }, [filteredProcesses]);

  const processesByArea = useMemo(() => {
    const counts = new Map<string, { total: number; color: string }>();
    filteredProcesses.forEach((process) => {
      const current = counts.get(process.areaLabel) || { total: 0, color: process.areaColor };
      counts.set(process.areaLabel, { total: current.total + 1, color: process.areaColor });
    });
    return Array.from(counts.entries()).map(([area, payload]) => ({ area, total: payload.total, color: payload.color })).sort((left, right) => right.total - left.total).slice(0, 8);
  }, [filteredProcesses]);

  const agendaSeries = useMemo(() => {
    const totalDays = Math.min(range.days, 31);
    return Array.from({ length: totalDays }).map((_, index) => {
      const bucketDate = addDays(range.start, index);
      const key = startOfDay(bucketDate).getTime();
      const prazos = filteredDeadlines.filter((deadline) => {
        const due = toDate(deadline.due_date);
        return !!due && startOfDay(due).getTime() === key;
      }).length;
      const audiencias = filteredHearings.filter((hearing) => {
        const hearingDate = toDate(hearing.hearing_date);
        return !!hearingDate && startOfDay(hearingDate).getTime() === key;
      }).length;
      return { label: bucketDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), prazos, audiencias };
    });
  }, [filteredDeadlines, filteredHearings, range]);

  const faturamentoSeries = useMemo(
    () => buildMonthSeries(6, (key) => ({
      faturamento: sumAmount(filteredReceivables.filter((item) => monthKey(item.due_date) === key)),
      inadimplencia: sumAmount(filteredReceivables.filter((item) => monthKey(item.due_date) === key && receivableIsOverdue(item.status))),
    })),
    [filteredReceivables],
  );

  const fluxoCaixaSeries = useMemo(
    () => buildMonthSeries(6, (key) => ({
      entradas: sumAmount(filteredPayments.filter((item) => monthKey(item.payment_date || item.created_at) === key)),
      saidas: sumAmount(filteredPayables.filter((item) => monthKey(item.due_date) === key)),
    })),
    [filteredPayables, filteredPayments],
  );

  const clientesPorTipo = useMemo(() => {
    const counts = new Map<string, number>();
    filteredClients.forEach((client) => {
      const label = normalizeText(client.type) === "pj" ? "PJ" : "PF";
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredClients]);

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];

    overdueDeadlines.slice().sort((left, right) => (toDate(left.due_date)?.getTime() || 0) - (toDate(right.due_date)?.getTime() || 0)).slice(0, 3).forEach((deadline) => {
      const processId = resolveProcessId(deadline);
      const process = processMap.get(processId);
      items.push({
        id: `deadline-overdue-${deadline.id}`,
        title: "Prazo vencido",
        description: `${deadline.description || "Prazo sem descrição"}  -  ${process?.cnj || process?.clientName || "Processo vinculado"}`,
        tone: "danger",
        actionLabel: "Abrir prazo",
        onClick: () => navigate(processId ? `/app/processos/${processId}?tab=deadlines` : "/app/agenda"),
      });
    });

    filteredDeadlines.filter((deadline) => daysUntil(deadline.due_date) === 0 && !isCompletedDeadline(deadline.status)).slice(0, 2).forEach((deadline) => {
      const processId = resolveProcessId(deadline);
      const process = processMap.get(processId);
      items.push({
        id: `deadline-today-${deadline.id}`,
        title: "Prazo vence hoje",
        description: `${deadline.description || "Prazo do dia"}  -  ${process?.clientName || process?.cnj || "Processo vinculado"}`,
        tone: "warning",
        actionLabel: "Ver processo",
        onClick: () => navigate(processId ? `/app/processos/${processId}?tab=deadlines` : "/app/agenda"),
      });
    });

    filteredHearings.filter((hearing) => daysUntil(hearing.hearing_date) === 0).slice(0, 2).forEach((hearing) => {
      const processId = resolveProcessId(hearing);
      const process = processMap.get(processId);
      items.push({
        id: `hearing-today-${hearing.id}`,
        title: "Audiência hoje",
        description: `${humanizeValue(hearing.type)}  -  ${process?.cnj || process?.clientName || "Processo vinculado"}`,
        tone: "info",
        actionLabel: "Abrir audiência",
        onClick: () => navigate(processId ? `/app/processos/${processId}?tab=hearings` : "/app/audiencias"),
      });
    });

    filteredHearings.filter((hearing) => daysUntil(hearing.hearing_date) === 1).slice(0, 2).forEach((hearing) => {
      const processId = resolveProcessId(hearing);
      const process = processMap.get(processId);
      items.push({
        id: `hearing-tomorrow-${hearing.id}`,
        title: "Audiência amanhã",
        description: `${humanizeValue(hearing.type)}  -  ${process?.clientName || process?.cnj || "Processo vinculado"}`,
        tone: "warning",
        actionLabel: "Planejar pauta",
        onClick: () => navigate(processId ? `/app/processos/${processId}?tab=hearings` : "/app/audiencias"),
      });
    });

    if (canSeeFinance) {
      filteredReceivables.filter((item) => receivableIsOverdue(item.status)).slice(0, 2).forEach((item) => {
        items.push({
          id: `receivable-${item.id}`,
          title: "Cliente inadimplente",
          description: `${item.description || "Cobrança vencida"}  -  ${formatCurrency(item.amount)}`,
          tone: "danger",
          actionLabel: "Ir ao financeiro",
          onClick: () => navigate("/app/financeiro"),
        });
      });
    }

    filteredProcesses.filter((process) => {
      const touch = toDate(process.lastTouchAt);
      if (!touch) return false;
      const diff = Math.round((startOfDay(new Date()).getTime() - startOfDay(touch).getTime()) / DAY_MS);
      return diff >= 30;
    }).slice(0, 2).forEach((process) => {
      const touch = toDate(process.lastTouchAt);
      const diff = touch ? Math.round((startOfDay(new Date()).getTime() - startOfDay(touch).getTime()) / DAY_MS) : 0;
      items.push({
        id: `stale-${process.id}`,
        title: "Processo sem atualização recente",
        description: `${process.cnj || process.clientName}  -  ${diff} dias sem movimentação relevante`,
        tone: "warning",
        actionLabel: "Abrir processo",
        onClick: () => navigate(`/app/processos/${process.id}`),
      });
    });

    return items.slice(0, 8);
  }, [canSeeFinance, filteredDeadlines, filteredHearings, filteredProcesses, filteredReceivables, navigate, overdueDeadlines, processMap]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    filteredProcesses.forEach((process) => {
      items.push({
        id: `process-${process.id}`,
        type: "process",
        title: process.cnj || process.clientName || "Processo atualizado",
        description: `Status ${humanizeValue(process.status)}  -  ${process.areaLabel}`,
        date: process.updated_at || process.created_at || null,
        onClick: () => navigate(`/app/processos/${process.id}`),
      });
    });
    filteredMovements.forEach((movement) => {
      const processId = resolveProcessId(movement);
      const process = processMap.get(processId);
      items.push({
        id: `movement-${movement.id}`,
        type: "movement",
        title: humanizeValue(movement.type),
        description: `${movement.description || "Andamento registrado"}  -  ${process?.cnj || process?.clientName || "Processo vinculado"}`,
        date: movement.date || movement.created_at || null,
        onClick: () => navigate(processId ? `/app/processos/${processId}?tab=movements` : "/app/processos"),
      });
    });
    filteredHearings.forEach((hearing) => {
      const processId = resolveProcessId(hearing);
      const process = processMap.get(processId);
      items.push({
        id: `hearing-${hearing.id}`,
        type: "hearing",
        title: `Audiência ${humanizeValue(hearing.type)}`,
        description: `${process?.clientName || process?.cnj || "Processo vinculado"}  -  ${humanizeValue(hearing.status)}`,
        date: hearing.created_at || hearing.hearing_date || null,
        onClick: () => navigate(processId ? `/app/processos/${processId}?tab=hearings` : "/app/audiencias"),
      });
    });
    filteredDocuments.forEach((document) => {
      const processId = String(document.process || "").trim();
      const process = processMap.get(processId);
      items.push({
        id: `document-${document.id}`,
        type: "document",
        title: document.title || document.filename || "Documento enviado",
        description: `${humanizeValue(document.category)}  -  ${process?.cnj || process?.clientName || "Central documental"}`,
        date: document.created_at || null,
        onClick: () => navigate(processId ? `/app/processos/${processId}?tab=documents` : "/app/documentos"),
      });
    });
    filteredPayments.forEach((payment) => {
      items.push({
        id: `payment-${payment.id}`,
        type: "payment",
        title: "Recebimento registrado",
        description: `${formatCurrency(payment.amount)}  -  ${humanizeValue(payment.method)}`,
        date: payment.payment_date || payment.created_at || null,
        onClick: () => navigate("/app/financeiro"),
      });
    });
    return items.slice().sort((left, right) => (toDate(right.date)?.getTime() || 0) - (toDate(left.date)?.getTime() || 0)).slice(0, 10);
  }, [filteredDocuments, filteredHearings, filteredMovements, filteredPayments, filteredProcesses, navigate, processMap]);

  const activeFilterCount = [
    Boolean(search.trim()),
    responsibleFilter !== "all",
    areaFilter !== "all",
    statusFilter !== "all",
    period === "custom",
  ].filter(Boolean).length;

  const overviewStats = [
    { label: "Processos visiveis", value: formatCount(filteredProcesses.length) },
    { label: "Clientes no recorte", value: formatCount(filteredClients.length) },
    { label: "Documentos recentes", value: formatCount(filteredDocuments.length) },
    { label: "Movimentacoes", value: formatCount(filteredMovements.length) },
  ];

  const legalKpis = [
    {
      title: "Processos ativos",
      value: processCounts.active,
      description: "Carteira em andamento dentro do recorte atual.",
      icon: Scale,
      tone: "info" as const,
      tooltip: "Quantidade de processos em andamento dentro dos filtros aplicados.",
      comparison: buildComparison(processCounts.active, processCounts.previousActive, "up"),
      onClick: () => navigate("/app/processos"),
    },
    {
      title: "Processos encerrados",
      value: processCounts.closed,
      description: "Casos finalizados ou arquivados para consulta.",
      icon: CheckCircle2,
      tone: "success" as const,
      tooltip: "Mostra o estoque de processos fechados dentro do filtro corrente.",
      comparison: buildComparison(processCounts.closed, processCounts.previousClosed, "up"),
      onClick: () => navigate("/app/processos"),
    },
    {
      title: "Prazos no periodo",
      value: deadlinesInRange.length,
      description: `Pendencias previstas entre ${formatDate(range.start)} e ${formatDate(range.end)}.`,
      icon: Clock3,
      tone: "warning" as const,
      tooltip: "Conta os prazos ainda nao concluidos dentro da janela escolhida.",
      comparison: buildComparison(deadlinesInRange.length, previousDeadlinesInRange.length, "down"),
      onClick: () => navigate("/app/agenda"),
    },
    {
      title: "Prazos criticos",
      value: overdueDeadlines.length,
      description: "Backlog vencido que exige acao prioritaria.",
      icon: AlertTriangle,
      tone: "danger" as const,
      tooltip: "Prazos cuja data limite ja passou e ainda nao foram concluidos.",
      comparison: buildComparison(overdueDeadlines.length, previousOverdueDeadlines.length, "down"),
      onClick: () => navigate("/app/processos"),
    },
    {
      title: "Audiencias no periodo",
      value: hearingsInRange.length,
      description: "Compromissos previstos na janela monitorada.",
      icon: CalendarClock,
      tone: "info" as const,
      tooltip: "Total de audiencias agendadas no periodo selecionado.",
      comparison: buildComparison(hearingsInRange.length, previousHearingsInRange.length, "down"),
      onClick: () => navigate("/app/audiencias"),
    },
    {
      title: "Audiencias hoje",
      value: hearingsToday.length,
      description: "Agenda imediata do dia para a equipe juridica.",
      icon: Gavel,
      tone: "warning" as const,
      tooltip: "Total de audiencias marcadas para hoje.",
      comparison: buildComparison(hearingsToday.length, hearingsSameDayLastWeek.length, "down"),
      onClick: () => navigate("/app/audiencias"),
    },
  ];

  const financeKpis = canSeeFinance
    ? [
        {
          title: "Inadimplencia",
          value: formatCompactCurrency(inadimplencia),
          description: "Valores vencidos que pressionam o caixa.",
          icon: ShieldAlert,
          tone: "danger" as const,
          tooltip: "Soma das cobrancas vencidas e ainda nao liquidadas.",
          comparison: buildComparison(inadimplencia, inadimplenciaAnterior, "down", formatCompactCurrency),
          onClick: () => navigate("/app/financeiro"),
        },
        {
          title: "Faturamento do mes",
          value: formatCompactCurrency(faturamentoMes),
          description: "Volume gerado em contas a receber no mes corrente.",
          icon: TrendingUp,
          tone: "success" as const,
          tooltip: "Soma das cobrancas emitidas para o mes atual.",
          comparison: buildComparison(faturamentoMes, faturamentoMesAnterior, "up", formatCompactCurrency),
          onClick: () => navigate("/app/financeiro"),
        },
        {
          title: "Recebimentos do mes",
          value: formatCompactCurrency(recebimentosMes),
          description: "Entradas efetivamente registradas no caixa.",
          icon: Wallet,
          tone: "info" as const,
          tooltip: "Total de pagamentos recebidos no mes atual.",
          comparison: buildComparison(recebimentosMes, recebimentosMesAnterior, "up", formatCompactCurrency),
          onClick: () => navigate("/app/financeiro"),
        },
        {
          title: "Despesas do mes",
          value: formatCompactCurrency(despesasMes),
          description: "Saidas previstas no fluxo financeiro mensal.",
          icon: TrendingDown,
          tone: "warning" as const,
          tooltip: "Soma das contas a pagar previstas para o mes atual.",
          comparison: buildComparison(despesasMes, despesasMesAnterior, "down", formatCompactCurrency),
          onClick: () => navigate("/app/financeiro"),
        },
      ]
    : [];

  if (dashboardQuery.isLoading) {
    return (
      <div className="page-container space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-56 rounded-full" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-3xl" />)}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-52 rounded-full" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-40 rounded-3xl" />)}
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-96 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="page-container space-y-8 animate-fade-in">

        {/* Quick actions */}
        <section>
          <p className="eyebrow mb-3">Ações rápidas</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Novo processo', icon: Gavel, path: '/app/processos', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900' },
              { label: 'Novo cliente', icon: Users, path: '/app/clientes', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 border-teal-100 dark:bg-teal-950/30 dark:border-teal-900' },
              { label: 'Criar tarefa', icon: CheckSquare, path: '/app/tarefas', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900' },
              { label: 'Lançar horas', icon: Clock, path: '/app/horas', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900' },
            ].map((action) => (
              <button
                key={action.path}
                type="button"
                onClick={() => navigate(action.path)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-card ${action.bg}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/70 dark:bg-black/20 ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-foreground">{action.label}</span>
                <Plus className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-[1.4rem] font-bold tracking-[-0.02em] text-foreground">Resumo juridico</h2>
              <p className="mt-1 text-sm text-muted-foreground">Indicadores centrais da operacao juridica organizados por prioridade.</p>
            </div>

            <div className="w-full lg:w-[220px]">
              <label className="eyebrow mb-2 block">Periodo</label>
              <Select value={period === "custom" ? "7d" : period} onValueChange={(value) => setPeriod(value as PeriodPreset)}>
                <SelectTrigger className="bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.filter((option) => option.value !== "custom").map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {legalKpis.map((item) => (
              <DashboardKpiCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        {canSeeFinance ? (
          <section className="space-y-4">
            <SectionHeader title="Resumo financeiro" description="Leitura objetiva do caixa, cobrancas e movimentacao do periodo." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {financeKpis.map((item) => (
                <DashboardKpiCard key={item.title} {...item} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <Card className="border-border bg-card shadow-card">
            <CardContent className="p-6">
              <SectionHeader title="Agenda visual dos proximos dias" description="Leitura consolidada de prazos e audiencias dentro da janela selecionada." actionLabel="Abrir agenda" onAction={() => navigate("/app/agenda")} />
              <div className="mt-6 h-[320px]">
                {agendaSeries.some((item) => item.prazos > 0 || item.audiencias > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={agendaSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="prazos" name="Prazos" stroke="#374151" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="audiencias" name="Audiencias" stroke="#9ca3af" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={CalendarClock} title="Sem agenda critica no periodo" description="A janela filtrada nao encontrou prazos ou audiencias para exibir em linha do tempo." />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardContent className="p-6">
              <SectionHeader title="Alertas e prioridades" description="Tudo o que exige acao imediata da equipe." actionLabel="Ver processos" onAction={() => navigate("/app/processos")} />
              <div className="mt-6 space-y-3">
                {alerts.length > 0 ? alerts.map((alert) => (
                  <button key={alert.id} type="button" onClick={alert.onClick} className={cn("w-full rounded-lg border p-4 text-left transition-all hover:shadow-card", toneCardClassName(alert.tone))}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{alert.title}</p>
                          <StatusBadge variant={toneBadgeVariant(alert.tone)} className="capitalize">{alert.actionLabel}</StatusBadge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{alert.description}</p>
                      </div>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  </button>
                )) : <EmptyState icon={CheckCircle2} title="Operacao sem alertas criticos" description="Nenhum prazo vencido, audiencia imediata ou cobranca critica apareceu com os filtros atuais." />}
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <SectionHeader title="Analises da carteira" description="Distribuicao da operacao por status, area e perfil de cliente." />
          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="border-border bg-card shadow-card">
              <CardContent className="p-6">
                <SectionHeader title="Processos por status" description="Distribuicao atual da carteira juridica." actionLabel="Abrir processos" onAction={() => navigate("/app/processos")} />
                <div className="mt-6 h-[280px]">
                  {processesByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processesByStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <RechartsTooltip />
                        <Bar dataKey="total" fill="#334155" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon={Scale} title="Sem processos para este recorte" description="Ajuste os filtros para visualizar a distribuicao por status." />}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-card">
              <CardContent className="p-6">
                <SectionHeader title="Processos por area" description="Especialidades com maior densidade operacional." actionLabel="Ver areas" onAction={() => navigate("/app/areas")} />
                <div className="mt-6 h-[280px]">
                  {processesByArea.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processesByArea} layout="vertical" margin={{ left: 18 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="area" width={110} tick={{ fontSize: 12 }} />
                        <RechartsTooltip />
                        <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                          {processesByArea.map((entry, index) => <Cell key={entry.area} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon={BriefcaseBusiness} title="Sem densidade por area" description="Nao ha processos suficientes para distribuir por especialidade com os filtros atuais." />}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-card">
              <CardContent className="p-6">
                <SectionHeader title="Clientes por tipo" description="Carteira PF e PJ para leitura comercial rapida." actionLabel="Abrir clientes" onAction={() => navigate("/app/clientes")} />
                <div className="mt-6 h-[280px]">
                  {clientesPorTipo.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={clientesPorTipo} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={4}>
                          {clientesPorTipo.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatCount(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon={Users} title="Sem clientes neste recorte" description="A carteira filtrada ainda nao gera distribuicao entre PF e PJ." />}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {canSeeFinance ? (
          <section className="space-y-4">
            <SectionHeader title="Analises financeiras" description="Evolucao dos indicadores mensais de cobranca e fluxo de caixa." />
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-border bg-card shadow-card">
                <CardContent className="p-6">
                  <SectionHeader title="Faturamento x inadimplencia" description="Evolucao mensal das cobrancas geradas e do volume vencido." actionLabel="Ir ao financeiro" onAction={() => navigate("/app/financeiro")} />
                  <div className="mt-6 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={faturamentoSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <RechartsTooltip formatter={(value: number) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar dataKey="faturamento" name="Faturamento" fill="#374151" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="inadimplencia" name="Inadimplencia" fill="#9ca3af" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card shadow-card">
                <CardContent className="p-6">
                  <SectionHeader title="Entradas e saidas financeiras" description="Comparativo mensal entre recebimentos e compromissos financeiros." actionLabel="Abrir financeiro" onAction={() => navigate("/app/financeiro")} />
                  <div className="mt-6 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fluxoCaixaSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <RechartsTooltip formatter={(value: number) => formatCurrency(Number(value))} />
                        <Legend />
                        <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#374151" strokeWidth={3} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="saidas" name="Saidas" stroke="#9ca3af" strokeWidth={3} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        ) : null}

        <Card className="border-border bg-card shadow-card">
          <CardContent className="p-6">
            <SectionHeader title="Painel de atividade recente" description="Ultimos processos, andamentos, documentos, audiencias e recebimentos do escritorio." actionLabel="Abrir modulo" onAction={() => navigate("/app/processos")} />
            <div className="mt-6 space-y-3">
              {recentActivity.length > 0 ? recentActivity.map((item) => {
                const Icon = activityIcon(item.type);
                return (
                  <button key={item.id} type="button" onClick={item.onClick} className="flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-4 text-left transition-all hover:bg-muted/18 hover:shadow-card md:flex-row md:items-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-accent/45">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <StatusBadge variant="muted">{humanizeValue(item.type)}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="shrink-0 font-mono-ui text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{formatDateTime(item.date)}</div>
                  </button>
                );
              }) : <EmptyState icon={Activity} title="Sem atividade recente" description="Ainda nao houve registros suficientes para montar uma trilha operacional do escritorio." />}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

