import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Public VAPID key is safe to ship to clients. Server uses the matching private key.
// Set via VITE_VAPID_PUBLIC_KEY in your env (or paste here once generated).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const configured = !!VAPID_PUBLIC_KEY;

  useEffect(() => {
    const ok = typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
    if (ok && user) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      }).catch(() => {});
    }
  }, [user?.id]);

  const enable = useCallback(async () => {
    if (!supported || !user) return { ok: false, reason: 'unsupported' };
    if (!configured) return { ok: false, reason: 'vapid_not_configured' };
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return { ok: false, reason: 'denied' };
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
        });
      }
      const json = sub.toJSON() as any;
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        user_agent: navigator.userAgent,
      }, { onConflict: 'endpoint' });
      setSubscribed(true);
      return { ok: true };
    } finally {
      setBusy(false);
    }
  }, [supported, user, configured]);

  const disable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [supported]);

  return { supported, configured, permission, subscribed, busy, enable, disable };
}
