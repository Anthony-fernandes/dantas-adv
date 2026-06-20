import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { api } from "@/integrations/api/client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { MasterLayout } from "@/components/layout/MasterLayout";

import Landing from "@/pages/Landing";
import BlogArticle from "@/pages/BlogArticle";
import AppLogin from "@/pages/app/AppLogin";
import Dashboard from "@/pages/app/Dashboard";
import ProcessList from "@/pages/app/ProcessList";
import ProcessDetail from "@/pages/app/ProcessDetail";
import PracticeAreas from "@/pages/app/PracticeAreas";
import ClientList from "@/pages/app/ClientList";
import ClientDetail from "@/pages/app/ClientDetail";
import DocumentsModule from "@/pages/app/DocumentsModule";
import HearingsPage from "@/pages/app/HearingsPage";
import AgendaPage from "@/pages/app/AgendaPage";
import Financial from "@/pages/app/Financial";
import Employees from "@/pages/app/Employees";
import Positions from "@/pages/app/Positions";
import AdminUsers from "@/pages/app/AdminUsers";
import Companies from "@/pages/app/Companies";
import LandingCms from "@/pages/app/LandingCms";
import LandingBlog from "@/pages/app/LandingBlog";
import Reports from "@/pages/app/Reports";
import PortalLogin from "@/pages/portal/PortalLogin";
import PortalHome from "@/pages/portal/PortalHome";
import PortalProcesses from "@/pages/portal/PortalProcesses";
import PortalMessages from "@/pages/portal/PortalMessages";
import PortalProcessDetail from "@/pages/portal/PortalProcessDetail";
import PortalDocuments from "@/pages/portal/PortalDocuments";
import PortalFinancial from "@/pages/portal/PortalFinancial";
import MasterLogin from "@/pages/master/MasterLogin";
import CompaniesAdmin from "@/pages/master/CompaniesAdmin";
import NotFound from "@/pages/NotFound";
import SetupTenant from "@/pages/app/SetupTenant";
import SelectTenant from "@/pages/app/SelectTenant";
import AcceptInvite from "@/pages/AcceptInvite";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalApiErrorListener } from "@/components/GlobalApiErrorListener";
import Forbidden from "@/pages/errors/Forbidden";
import ServerError from "@/pages/errors/ServerError";
import SessionExpired from "@/pages/errors/SessionExpired";
import TenantRequired from "@/pages/errors/TenantRequired";
import { RequireRole } from "@/components/auth/RequireRole";
import { RoleGroups } from "@/lib/rbac";

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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />
            <Route path="/error/403" element={<Forbidden />} />
            <Route path="/error/500" element={<ServerError />} />
            <Route path="/session-expired" element={<SessionExpired />} />
            <Route path="/tenant-required" element={<TenantRequired />} />

            <Route element={<AuthenticatedShell />}>
              <Route path="/accept-invite" element={<AcceptInvite />} />
              <Route path="/app/login" element={<AppLogin />} />
              <Route path="/master/login" element={<MasterLogin />} />
              <Route path="/app/setup" element={<ProtectedRoute><SetupTenant /></ProtectedRoute>} />
              <Route path="/app/select-tenant" element={<ProtectedRoute><SelectTenant /></ProtectedRoute>} />
              <Route path="/app" element={<SuperuserBootstrapGuard><ProtectedRoute><AppLayout /></ProtectedRoute></SuperuserBootstrapGuard>}>
                <Route index element={<AppIndexRedirect />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="processos" element={<RequireRole roles={RoleGroups.LEGAL}><ProcessList /></RequireRole>} />
                <Route path="processos/:id" element={<RequireRole roles={RoleGroups.LEGAL}><ProcessDetail /></RequireRole>} />
                <Route path="areas" element={<RequireRole roles={RoleGroups.LEGAL}><PracticeAreas /></RequireRole>} />
                <Route path="causas" element={<Navigate to="/app/areas" replace />} />
                <Route path="clientes" element={<RequireRole roles={RoleGroups.LEGAL}><ClientList /></RequireRole>} />
                <Route path="clientes/:id" element={<RequireRole roles={RoleGroups.LEGAL}><ClientDetail /></RequireRole>} />
                <Route path="financeiro" element={<RequireRole roles={RoleGroups.FINANCE}><Financial /></RequireRole>} />
                <Route path="documentos" element={<RequireRole roles={RoleGroups.LEGAL}><DocumentsModule /></RequireRole>} />
                <Route path="audiencias" element={<RequireRole roles={RoleGroups.LEGAL}><HearingsPage /></RequireRole>} />
                <Route path="agenda" element={<RequireRole roles={RoleGroups.LEGAL}><AgendaPage /></RequireRole>} />
                <Route path="financeiro/*" element={<RequireRole roles={RoleGroups.FINANCE}><Financial /></RequireRole>} />
                <Route path="funcionarios" element={<RequireRole roles={RoleGroups.ADMIN}><Employees /></RequireRole>} />
                <Route path="cargos" element={<RequireRole roles={RoleGroups.ADMIN}><Positions /></RequireRole>} />
                <Route path="usuarios" element={<RequireRole roles={RoleGroups.ADMIN}><AdminUsers /></RequireRole>} />
                <Route path="empresas" element={<RequireRole roles={RoleGroups.ADMIN}><Companies /></RequireRole>} />
                <Route path="relatorios" element={<RequireRole roles={RoleGroups.FINANCE}><Reports /></RequireRole>} />
                <Route path="landing" element={<RequireRole roles={RoleGroups.ADMIN}><LandingCms /></RequireRole>} />
                <Route path="blog" element={<RequireRole roles={RoleGroups.ADMIN}><LandingBlog /></RequireRole>} />
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
          </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
