import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  type?: string;
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="flex flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-primary border-2 border-primary-foreground shadow-sm mt-1.5" />
            {index < items.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
          </div>
          <div className="pb-6 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {new Date(item.date).toLocaleDateString('pt-BR')}
              </span>
              {item.type && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
                  {item.type}
                </span>
              )}
            </div>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
