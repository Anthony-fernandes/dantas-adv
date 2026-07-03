import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { api } from "@/integrations/api/client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { MasterLayout } from "@/components/layout/MasterLayout";

import AppLogin from "@/pages/app/AppLogin";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalApiErrorListener } from "@/components/GlobalApiErrorListener";
import Forbidden from "@/pages/errors/Forbidden";
import ServerError from "@/pages/errors/ServerError";
import SessionExpired from "@/pages/errors/SessionExpired";
import TenantRequired from "@/pages/errors/TenantRequired";
import NotFound from "@/pages/NotFound";
import { RequireRole } from "@/components/auth/RequireRole";
import { RoleGroups } from "@/lib/rbac";

// Public / landing (chunk separado — visitantes não baixam o app)
const Landing = lazy(() => import("@/pages/Landing"));
const BlogArticle = lazy(() => import("@/pages/BlogArticle"));
const AcceptInvite = lazy(() => import("@/pages/AcceptInvite"));

// App jurídico (um chunk por módulo)
const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const ProcessesWorkspace = lazy(() => import("@/pages/app/processes/ProcessesWorkspace"));
const ProcessDetail = lazy(() => import("@/pages/app/ProcessDetail"));
const PracticeAreas = lazy(() => import("@/pages/app/PracticeAreas"));
const ClientsWorkspace = lazy(() => import("@/pages/app/clients/ClientsWorkspace"));
const ClientDetailWorkspace = lazy(() => import("@/pages/app/clients/ClientDetailWorkspace"));
const DocumentsModule = lazy(() => import("@/pages/app/DocumentsModule"));
const HearingsPage = lazy(() => import("@/pages/app/HearingsPage"));
const AgendaPage = lazy(() => import("@/pages/app/AgendaPage"));
const FinancialWorkspace = lazy(() => import("@/pages/app/financial/FinancialWorkspace"));
const Employees = lazy(() => import("@/pages/app/Employees"));
const Positions = lazy(() => import("@/pages/app/Positions"));
const AdminUsers = lazy(() => import("@/pages/app/AdminUsers"));
const Companies = lazy(() => import("@/pages/app/Companies"));
const LandingCms = lazy(() => import("@/pages/app/LandingCms"));
const LandingBlog = lazy(() => import("@/pages/app/LandingBlog"));
const Reports = lazy(() => import("@/pages/app/Reports"));
const DeadlinesPage = lazy(() => import("@/pages/app/DeadlinesPage"));
const HonorariosPage = lazy(() => import("@/pages/app/HonorariosPage"));
const TasksPage = lazy(() => import("@/pages/app/TasksPage"));
const TimesheetPage = lazy(() => import("@/pages/app/TimesheetPage"));
const ChatPage = lazy(() => import("@/pages/app/ChatPage"));
const AuditLogPage = lazy(() => import("@/pages/app/AuditLogPage"));
const TemplatesPage = lazy(() => import("@/pages/app/TemplatesPage"));
const ProfilePage = lazy(() => import("@/pages/app/ProfilePage"));
const SettingsPage = lazy(() => import("@/pages/app/SettingsPage"));
const ContractsPage = lazy(() => import("@/pages/app/ContractsPage"));
const ContabilidadePage = lazy(() => import("@/pages/app/ContabilidadePage"));
const NFSeWorkspace = lazy(() => import("@/pages/app/financial/NFSeWorkspace"));
const LGPD = lazy(() => import("@/pages/app/LGPD"));
const SetupTenant = lazy(() => import("@/pages/app/SetupTenant"));
const SelectTenant = lazy(() => import("@/pages/app/SelectTenant"));

// Portal do cliente
const PortalLogin = lazy(() => import("@/pages/portal/PortalLogin"));
const PortalHome = lazy(() => import("@/pages/portal/PortalHome"));
const PortalProcesses = lazy(() => import("@/pages/portal/PortalProcesses"));
const PortalMessages = lazy(() => import("@/pages/portal/PortalMessages"));
const PortalProcessDetail = lazy(() => import("@/pages/portal/PortalProcessDetail"));
const PortalDocuments = lazy(() => import("@/pages/portal/PortalDocuments"));
const PortalFinancial = lazy(() => import("@/pages/portal/PortalFinancial"));

// Master (SaaS admin)
const MasterLogin = lazy(() => import("@/pages/master/MasterLogin"));
const CompaniesAdmin = lazy(() => import("@/pages/master/CompaniesAdmin"));

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        const status = error?.status;
        if (!status) return failureCount < 2;
        if (status >= 500) return failureCount < 2;
        return false;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

function LandingOrRedirect() {
  const { data, isLoading } = useQuery({
    queryKey: ["landing-bootstrap-check"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/landing/");
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30_000,
  });

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </div>
  );

  const hasCompany = !!(data?.company?.name || data?.settings?.brand_name);
  if (!hasCompany) return <Navigate to="/master/login" replace />;
  return <Landing />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!isAuthenticated) return <Navigate to="/app/login" replace />;
  return <>{children}</>;
}

function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!isAuthenticated) return <Navigate to="/portal/login" replace />;
  return <>{children}</>;
}

function AppIndexRedirect() {
  const { isSuperuser } = useAuth();
  const { activeTenantId, tenants, isLoadingTenants } = useTenant();
  const [companyCount, setCompanyCount] = useState<number | null>(null);
  const [checkingCompanies, setCheckingCompanies] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isSuperuser) {
        if (active) {
          setCompanyCount(null);
          setCheckingCompanies(false);
        }
        return;
      }
      setCheckingCompanies(true);
      try {
        const payload: any = await api.get("/admin/companies/");
        const parsed =
          typeof payload?.count === "number"
            ? payload.count
            : Array.isArray(payload?.companies)
              ? payload.companies.length
              : Array.isArray(payload?.results)
                ? payload.results.length
                : Array.isArray(payload)
                  ? payload.length
                  : 0;
        if (active) setCompanyCount(parsed);
      } catch {
        if (active) setCompanyCount(0);
      } finally {
        if (active) setCheckingCompanies(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isSuperuser]);

  if (isSuperuser) {
    if (checkingCompanies || companyCount === null) {
      return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }
    return <Navigate to={companyCount > 0 ? "/app/dashboard" : "/master/companies"} replace />;
  }
  if (isLoadingTenants) return null;
  if (!activeTenantId) return <Navigate to={tenants?.length ? "/app/select-tenant" : "/app/setup"} replace />;
  return <Navigate to="/app/dashboard" replace />;
}

function MasterProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isSuperuser } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!isAuthenticated) return <Navigate to="/master/login" replace />;
  if (!isSuperuser) return <Navigate to="/error/403" replace />;
  return <>{children}</>;
}

function SuperuserBootstrapGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isSuperuser } = useAuth();
  const location = useLocation();
  const [count, setCount] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isAuthenticated || !isSuperuser) {
        if (active) {
          setCount(null);
          setChecking(false);
        }
        return;
      }
      setChecking(true);
      try {
        const payload: any = await api.get("/admin/companies/");
        const parsed =
          typeof payload?.count === "number"
            ? payload.count
            : Array.isArray(payload?.companies)
              ? payload.companies.length
            : Array.isArray(payload?.results)
              ? payload.results.length
              : Array.isArray(payload)
                ? payload.length
                : 0;
        if (active) setCount(parsed);
      } catch {
        if (active) setCount(null);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated, isSuperuser]);

  if (isLoading || checking) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const needsBootstrap = isAuthenticated && isSuperuser && count === 0;
  if (needsBootstrap && location.pathname !== "/master/companies") {
    return <Navigate to="/master/companies" replace />;
  }

  return <>{children}</>;
}

function AuthenticatedShell() {
  return (
    <AuthProvider>
      <TenantProvider>
        <GlobalApiErrorListener />
        <Outlet />
      </TenantProvider>
    </AuthProvider>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingOrRedirect />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/error/403" element={<Forbidden />} />
            <Route path="/error/500" element={<ServerError />} />
            <Route path="/session-expired" element={<SessionExpired />} />
            <Route path="/tenant-required" element={<TenantRequired />} />

            <Route element={<AuthenticatedShell />}>
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/app/lgpd" element={<ProtectedRoute><LGPD /></ProtectedRoute>} />
              <Route path="/app/login" element={<AppLogin />} />
              <Route path="/master/login" element={<MasterLogin />} />
              <Route path="/app/setup" element={<ProtectedRoute><SetupTenant /></ProtectedRoute>} />
              <Route path="/app/select-tenant" element={<ProtectedRoute><SelectTenant /></ProtectedRoute>} />
              <Route path="/app" element={<SuperuserBootstrapGuard><ProtectedRoute><AppLayout /></ProtectedRoute></SuperuserBootstrapGuard>}>
                <Route index element={<AppIndexRedirect />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="processos" element={<RequireRole roles={RoleGroups.LEGAL}><ProcessesWorkspace /></RequireRole>} />
                <Route path="processos/:id" element={<RequireRole roles={RoleGroups.LEGAL}><ProcessDetail /></RequireRole>} />
                <Route path="areas" element={<RequireRole roles={RoleGroups.LEGAL}><PracticeAreas /></RequireRole>} />
                <Route path="causas" element={<Navigate to="/app/areas" replace />} />
                <Route path="clientes" element={<RequireRole roles={RoleGroups.LEGAL}><ClientsWorkspace /></RequireRole>} />
                <Route path="clientes/:id" element={<RequireRole roles={RoleGroups.LEGAL}><ClientDetailWorkspace /></RequireRole>} />
                <Route path="financeiro" element={<RequireRole roles={RoleGroups.FINANCE}><FinancialWorkspace /></RequireRole>} />
                <Route path="honorarios" element={<RequireRole roles={RoleGroups.FINANCE}><HonorariosPage /></RequireRole>} />
                <Route path="documentos" element={<RequireRole roles={RoleGroups.LEGAL}><DocumentsModule /></RequireRole>} />
                <Route path="audiencias" element={<RequireRole roles={RoleGroups.LEGAL}><HearingsPage /></RequireRole>} />
                <Route path="prazos" element={<RequireRole roles={RoleGroups.LEGAL}><DeadlinesPage /></RequireRole>} />
                <Route path="tarefas" element={<RequireRole roles={RoleGroups.LEGAL}><TasksPage /></RequireRole>} />
                <Route path="horas" element={<RequireRole roles={RoleGroups.LEGAL}><TimesheetPage /></RequireRole>} />
                <Route path="chat" element={<RequireRole roles={RoleGroups.LEGAL}><ChatPage /></RequireRole>} />
                <Route path="agenda" element={<RequireRole roles={RoleGroups.LEGAL}><AgendaPage /></RequireRole>} />
                <Route path="financeiro/*" element={<RequireRole roles={RoleGroups.FINANCE}><FinancialWorkspace /></RequireRole>} />
                <Route path="funcionarios" element={<RequireRole roles={RoleGroups.ADMIN}><Employees /></RequireRole>} />
                <Route path="cargos" element={<RequireRole roles={RoleGroups.ADMIN}><Positions /></RequireRole>} />
                <Route path="usuarios" element={<RequireRole roles={RoleGroups.ADMIN}><AdminUsers /></RequireRole>} />
                <Route path="empresas" element={<RequireRole roles={RoleGroups.ADMIN}><Companies /></RequireRole>} />
                <Route path="relatorios" element={<RequireRole roles={RoleGroups.FINANCE}><Reports /></RequireRole>} />
                <Route path="landing" element={<RequireRole roles={RoleGroups.ADMIN}><LandingCms /></RequireRole>} />
                <Route path="blog" element={<RequireRole roles={RoleGroups.ADMIN}><LandingBlog /></RequireRole>} />
                <Route path="auditoria" element={<RequireRole roles={RoleGroups.ADMIN}><AuditLogPage /></RequireRole>} />
                <Route path="contratos" element={<RequireRole roles={RoleGroups.LEGAL}><ContractsPage /></RequireRole>} />
                <Route path="modelos" element={<RequireRole roles={RoleGroups.LEGAL}><TemplatesPage /></RequireRole>} />
                <Route path="perfil" element={<ProfilePage />} />
                <Route path="configuracoes" element={<RequireRole roles={RoleGroups.ADMIN}><SettingsPage /></RequireRole>} />
                <Route path="contabilidade" element={<RequireRole roles={RoleGroups.FINANCE}><ContabilidadePage /></RequireRole>} />
                <Route path="nfse" element={<RequireRole roles={RoleGroups.FINANCE}><div className="page-container max-w-5xl"><NFSeWorkspace /></div></RequireRole>} />
                <Route path="admin" element={<RequireRole roles={RoleGroups.ADMIN}><AdminUsers /></RequireRole>} />
                <Route path="admin/*" element={<RequireRole roles={RoleGroups.ADMIN}><AdminUsers /></RequireRole>} />
              </Route>
              <Route path="/portal/login" element={<PortalLogin />} />
              <Route path="/portal" element={<PortalProtectedRoute><PortalLayout /></PortalProtectedRoute>}>
                <Route index element={<PortalHome />} />
                <Route path="processos" element={<PortalProcesses />} />
                <Route path="processos/:id" element={<PortalProcessDetail />} />
                <Route path="documentos" element={<PortalDocuments />} />
                <Route path="financeiro" element={<PortalFinancial />} />
                <Route path="mensagens" element={<PortalMessages />} />
              </Route>
              <Route path="/master" element={<SuperuserBootstrapGuard><MasterProtectedRoute><MasterLayout /></MasterProtectedRoute></SuperuserBootstrapGuard>}>
                <Route index element={<Navigate to="/master/companies" replace />} />
                <Route path="companies" element={<CompaniesAdmin />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
