const CACHE_NAME = 'whichterminal-v11';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/connection-calculator.js',
  '/manifest.json',
  './hubs/mnl/mnl.html',
  './hubs/bkk/bkk.html',
  './hubs/dmk/dmk.html',
  './hubs/mnl/mnl-database.js',
  './hubs/bkk/bkk-database.js',
  './hubs/dmk/dmk-database.js',
  '/assets/logo.png',
  '/assets/favicon.png'
];

// Safe Install with detailed error logging
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
          console.log('Successfully cached:', asset);
        } catch (err) {
          console.error('FAILED to cache:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: Delete old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Robust Fetch Handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        if (event.request.mode === 'navigate') {
          return (await caches.match('/index.html')) || (await caches.match('/'));
        }
      })
  );
});