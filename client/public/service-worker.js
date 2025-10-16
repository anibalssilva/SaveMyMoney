const CACHE_NAME = 'savemymoney-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error('Failed to cache:', error);
      });
    })
  );

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('Service Worker: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests (we want fresh data)
  if (url.pathname.startsWith('/api')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Service Worker: Serving from cache:', request.url);
        return cachedResponse;
      }

      // Clone the request
      const fetchRequest = request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          // Check if response is valid
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          console.error('Service Worker: Fetch failed:', error);

          // Return offline page if available
          return caches.match('/offline.html');
        });
    })
  );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Syncing...');

  if (event.tag === 'sync-transactions') {
    event.waitUntil(
      // Sync offline transactions when connection is restored
      syncTransactions()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'SaveMyMoney';
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

// Helper function to sync transactions
async function syncTransactions() {
  try {
    // Get offline transactions from IndexedDB
    // Send them to the server
    // This would need to be implemented based on your app's needs
    console.log('Syncing offline transactions...');
  } catch (error) {
    console.error('Failed to sync transactions:', error);
  }
}
