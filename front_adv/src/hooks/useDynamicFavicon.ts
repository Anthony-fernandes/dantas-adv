import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leadService } from '@/services/api';
import { useTenant } from '@/contexts/TenantContext';

export function useDynamicFavicon() {
  const { activeTenant } = useTenant();
  const { data } = useQuery({
    queryKey: ['favicon-brand'],
    queryFn: () => leadService.getPublicSite(),
    staleTime: 10 * 60 * 1000,
  });

  const logoUrl = (data as any)?.company?.logo_url as string | undefined;
  const companyName =
    String(activeTenant?.name || '').trim() ||
    String((data as any)?.company?.name || '').trim() ||
    'Escritório';

  useEffect(() => {
    document.title = companyName;
  }, [companyName]);

  useEffect(() => {
    if (!logoUrl) return;

    const link =
      (document.querySelector("link[rel~='icon']") as HTMLLinkElement) ||
      document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = logoUrl;
    document.head.appendChild(link);
  }, [logoUrl]);
}
