/**
 * MoreStars Service Worker
 * Handles offline caching and background sync
 */

const CACHE_NAME = 'morestars-v2';
const STATIC_ASSETS = [
  '/css/homepage.css',
  '/js/homepage.js',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/offline.html'
];

// Paths that should NEVER be cached (dynamic content)
const NO_CACHE_PATHS = [
  '/dashboard',
  '/admin',
  '/api/',
  '/webhooks',
  '/review/',
  '/qr/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external resources
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip caching for dynamic paths - always fetch from network
  const shouldNotCache = NO_CACHE_PATHS.some(path => url.pathname.startsWith(path));
  if (shouldNotCache) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response to cache it
        const responseToCache = response.clone();

        // Only cache successful responses for static assets
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If it's a navigation request, show offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
