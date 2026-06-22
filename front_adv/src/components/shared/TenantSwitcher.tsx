import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

function getTenantMonogram(name?: string | null) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return 'ES';
  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

export function TenantSwitcher() {
  const { tenants, activeTenantId, setActiveTenant } = useTenant();
  const active = tenants.find((tenant) => tenant.id === activeTenantId);

  if (!tenants?.length) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 min-w-[180px] max-w-[240px] justify-between gap-2 rounded-md border-border/50 bg-transparent px-2.5 text-left shadow-none hover:bg-muted/50"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
              {getTenantMonogram(active?.name)}
            </span>
            <span className="block min-w-0 truncate text-[13px] font-semibold text-foreground">
              {active?.name ?? 'Selecionar escritório'}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[320px] border-border p-0 shadow-elevated" align="start">
        <Command className="rounded-md">
          <CommandInput placeholder="Buscar escritório..." />
          <CommandList>
            <CommandEmpty>Nenhum escritório encontrado.</CommandEmpty>
            <CommandGroup heading="Escritorios">
              {tenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  value={tenant.name}
                  onSelect={() => setActiveTenant(tenant.id)}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 data-[selected=true]:bg-muted/55 data-[selected=true]:text-foreground"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border bg-muted/40 font-display text-xs font-semibold italic text-foreground">
                      {getTenantMonogram(tenant.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{tenant.name}</span>
                      <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {tenant.id === activeTenantId ? 'Ativo' : 'Alternar contexto'}
                      </span>
                    </span>
                  </span>
                  <Check className={cn('h-4 w-4', tenant.id === activeTenantId ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
