import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Settings, Palette, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  done: boolean;
};

type OnboardingChecklistProps = {
  hasSettings: boolean;
  hasBrand: boolean;
  hasPortal: boolean;
  onDismiss: () => void;
};

export function OnboardingChecklist({
  hasSettings,
  hasBrand,
  hasPortal,
  onDismiss,
}: OnboardingChecklistProps) {
  const navigate = useNavigate();

  const steps: Step[] = [
    {
      id: 'settings',
      label: 'Configure o escritório',
      description: 'Adicione logo, endereço e dados de contato.',
      icon: Settings,
      path: '/app/configuracoes',
      done: hasSettings,
    },
    {
      id: 'brand',
      label: 'Personalize a identidade visual',
      description: 'Defina as cores e nome exibidos no sistema.',
      icon: Palette,
      path: '/app/configuracoes',
      done: hasBrand,
    },
    {
      id: 'portal',
      label: 'Ative o portal do cliente',
      description: 'Permita que clientes acompanhem processos online.',
      icon: Globe,
      path: '/app/configuracoes',
      done: hasPortal,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  if (allDone) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div className="min-w-0">
          <p className="eyebrow">Primeiros passos</p>
          <h2 className="mt-0.5 text-base font-semibold text-foreground">
            Configure seu escritório
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {doneCount} de {steps.length} etapas concluídas
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Dispensar
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-right text-[10px] font-medium text-muted-foreground">{pct}%</p>
      </div>

      {/* Steps */}
      <div className="divide-y divide-border px-2 pb-2">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => navigate(step.path)}
            disabled={step.done}
            className={cn(
              'group flex w-full items-center gap-4 rounded-lg px-4 py-3.5 text-left transition-colors',
              step.done
                ? 'opacity-50 cursor-default'
                : 'hover:bg-muted/50',
            )}
          >
            {step.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', step.done ? 'line-through text-muted-foreground' : 'text-foreground')}>
                {step.label}
              </p>
              {!step.done && (
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
            {!step.done && (
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
