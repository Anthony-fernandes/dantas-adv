import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DetailHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
  className?: string;
};

/** Cabeçalho de tela de detalhe: voltar, título do registro, badges e ações. */
export function DetailHeader({ title, subtitle, badges, actions, backTo, className }: DetailHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className={cn('mb-5', className)}>
      {backTo && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 h-7 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(backTo)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Button>
      )}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[19px] font-semibold tracking-tight text-foreground">{title}</h1>
            {badges}
          </div>
          {subtitle && <div className="mt-1 text-[13px] text-muted-foreground">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
