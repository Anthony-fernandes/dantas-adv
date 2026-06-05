import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, BriefcaseBusiness, UserCog, UserSquare2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type OfficeAdminSection = "company" | "users" | "positions" | "employees";

type Metric = {
  label: string;
  value: string;
  helper: string;
  icon: any;
};

const SECTION_META: Record<OfficeAdminSection, { label: string; path: string; icon: any }> = {
  company: { label: "Empresa", path: "/app/empresas", icon: Building2 },
  users: { label: "Usuários", path: "/app/usuarios", icon: UserCog },
  positions: { label: "Cargos", path: "/app/cargos", icon: BriefcaseBusiness },
  employees: { label: "Funcionários", path: "/app/funcionarios", icon: UserSquare2 },
};

export function OfficeAdminShell({
  section,
  title,
  description,
  action,
  metrics,
  headerAside,
  children,
}: {
  section: OfficeAdminSection;
  title: string;
  description: string;
  action?: { label: string; icon?: any; onClick: () => void };
  metrics?: Metric[];
  headerAside?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <div className="page-container space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              Configurações e gestão do escritório
            </div>
            <div>
              <h1 className="page-title">{title}</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[320px]">
            {headerAside}
            {action ? (
              <Button className="gap-2" onClick={action.onClick}>
                {action.icon ? <action.icon className="h-4 w-4" /> : null}
                {action.label}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(SECTION_META) as OfficeAdminSection[]).map((item) => {
            const meta = SECTION_META[item];
            const isActive = item === section;
            return (
              <Button
                key={item}
                type="button"
                variant={isActive ? "default" : "outline"}
                className="gap-2"
                onClick={() => navigate(meta.path)}
              >
                <meta.icon className="h-4 w-4" />
                {meta.label}
              </Button>
            );
          })}
        </div>

        {metrics?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label} className="border-border/70 shadow-sm">
                <CardContent className="flex items-start justify-between gap-4 p-5">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.helper}</p>
                  </div>
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                    <metric.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      {children}
    </div>
  );
}
