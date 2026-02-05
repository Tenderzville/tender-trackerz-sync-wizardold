const CACHE_NAME = 'tenderalert-v2';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate new SW immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate - claim clients immediately for seamless updates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Take control of all pages immediately
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
        );
      })
    ])
  );
});

// Fetch event
// - Navigation requests: network-first so users get updates quickly
// - Other requests: cache-first fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigation = event.request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// Push event for notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New tender notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'tender-notification',
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('TenderAlert Pro', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Sync cached data when back online
  return fetch('/api/sync')
    .then(response => response.json())
    .then(data => {
      // Handle sync response
      console.log('Background sync completed:', data);
    })
    .catch(error => {
      console.error('Background sync failed:', error);
    });
}
