import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FiltersBarProps {
  filters: FilterOption[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

export function FiltersBar({ filters, values, onChange, onClear }: FiltersBarProps) {
  const hasActiveFilters = Object.values(values).some(v => v && v !== 'all');

  return (
    <div className="filter-bar">
      {filters.map(filter => (
        <div key={filter.key} className="flex-shrink-0">
          {filter.type === 'text' ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={filter.placeholder || `Buscar...`}
                value={values[filter.key] || ''}
                onChange={e => onChange(filter.key, e.target.value)}
                className="pl-9 h-9 w-[200px] bg-card"
              />
            </div>
          ) : (
            <Select value={values[filter.key] || 'all'} onValueChange={v => onChange(filter.key, v)}>
              <SelectTrigger className="h-9 w-[160px] bg-card">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filter.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="h-9 text-muted-foreground">
          <X className="h-4 w-4 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
