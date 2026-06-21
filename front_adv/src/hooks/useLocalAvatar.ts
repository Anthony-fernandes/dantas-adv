import { useAuth } from '@/contexts/AuthContext';

export function useLocalAvatar(): string {
  const { user, profile } = useAuth();
  const key = `avatar_${user?.id ?? 'me'}`;
  try {
    return localStorage.getItem(key) || (profile as any)?.avatar_url || '';
  } catch {
    return (profile as any)?.avatar_url || '';
  }
}
