import { useCallback, useEffect, useState } from 'react';
import { api } from '@/integrations/api/client';

type PushState = 'unsupported' | 'denied' | 'granted' | 'default';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const VAPID_PUBLIC_KEY = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY ?? '';

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported');
      return;
    }
    setState(Notification.permission as PushState);
  }, []);

  const subscribe = useCallback(async () => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn('[Push] VITE_VAPID_PUBLIC_KEY not set — push notifications disabled');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setState('granted');

      // Send subscription to backend
      await api.post('/push-subscriptions/', {
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
        },
      });
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setState('denied');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setState(perm as PushState);
    if (perm === 'granted') {
      await subscribe();
    }
  }, [subscribe]);

  return { state, loading, requestPermission };
}
