import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

createRoot(document.getElementById("root")!).render(<App />);

// PWA: register service worker and prompt when an update is available
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');

    const notifyUpdate = () => {
      toast({
        title: 'Update available',
        description: 'A newer version of TenderAlert is ready. Refresh to update.',
        action: (
          <ToastAction altText="Refresh" onClick={() => window.location.reload()}>
            Refresh
          </ToastAction>
        ),
      });
    };

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        // Installed + existing controller => update is ready
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          notifyUpdate();
        }
      });
    });
  } catch {
    // SW registration failures shouldn't break the app
  }
}

// Run after initial paint
registerServiceWorker();
