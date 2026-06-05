import { FileQuestion, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon = FileQuestion, title, description, action }: EmptyStateProps) {
  return (
    <div className="card-flat flex flex-col items-center justify-center px-6 py-14 text-center animate-fade-in">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <p className="eyebrow mb-2">Sem resultados</p>
      <h3 className="font-display text-2xl text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? (
        <Button onClick={action.onClick} className="mt-6">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
