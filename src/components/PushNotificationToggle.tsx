import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function PushNotificationToggle() {
  const { supported, configured, permission, subscribed, busy, enable, disable } = usePushNotifications();

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BellOff className="w-5 h-5" /> Push notifications</CardTitle>
          <CardDescription>Your browser does not support push notifications.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" /> Push notifications
        </CardTitle>
        <CardDescription>
          Get Facebook / Instagram-style alerts on your phone or desktop the moment a matching tender drops —
          even when TenderAlert isn't open.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!configured && (
          <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Admin: add <code>VITE_VAPID_PUBLIC_KEY</code> to env and <code>VAPID_PUBLIC_KEY</code> / <code>VAPID_PRIVATE_KEY</code> secrets to enable.</span>
          </div>
        )}
        {permission === 'denied' && (
          <p className="text-sm text-destructive">Notifications are blocked in your browser settings. Re-enable site permissions to continue.</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium text-foreground">{subscribed ? 'Enabled' : 'Disabled'}</span>
          </p>
          {subscribed
            ? <Button variant="outline" disabled={busy} onClick={disable}>Turn off</Button>
            : <Button disabled={busy || !configured || permission === 'denied'} onClick={enable}>
                {busy ? 'Working…' : 'Enable notifications'}
              </Button>}
        </div>
      </CardContent>
    </Card>
  );
}
