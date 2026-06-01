// CFQ Buddy - Service Worker v1.0
const CACHE_NAME = 'cfq-buddy-v1';
const STATIC_CACHE = 'cfq-static-v1';
const DATA_CACHE = 'cfq-data-v1';

// App shell - core files needed for the app to work
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/exam.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon.ico'
];

// Exam data files to cache
const EXAM_DATA = [
  '/data/exam1.json',
  '/data/exam2.json',
  '/data/exam3.json'
];

// Install event - cache app shell and exam data
self.addEventListener('install', (event) => {
  console.log('[SW] Installing CFQ Buddy service worker...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      }),
      caches.open(DATA_CACHE).then((cache) => {
        console.log('[SW] Caching exam data');
        return cache.addAll(EXAM_DATA);
      })
    ]).then(() => {
      console.log('[SW] All resources cached');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating CFQ Buddy service worker...');
  const currentCaches = [STATIC_CACHE, DATA_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // For exam data files - cache first, then network update
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Network failed, cached response or nothing
            return cachedResponse;
          });

          // Return cached version immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // For app shell / static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        // Cache new static resources dynamically
        if (networkResponse.ok && request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If both cache and network fail, return offline fallback for HTML
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
