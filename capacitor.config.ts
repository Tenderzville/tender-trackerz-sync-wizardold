import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6b0dfe135e2f4146b22f22d3a7ae6e2a',
  appName: 'tender-trackerz-sync-wizard',
  webDir: 'dist',
  server: {
    url: 'https://6b0dfe13-5e2f-4146-b22f-22d3a7ae6e2a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;