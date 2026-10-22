const CACHE_NAME = 'whichterminal-v13';

// All core shell assets + hub directory pages & database scripts
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/connection-calculator.js',
  '/manifest.json',

  // Hub Pages
  '/hubs/mnl/mnl.html',
  '/hubs/bkk/bkk.html',
  '/hubs/dmk/dmk.html',

  // Hub Databases
  '/hubs/mnl/mnl-database.js',
  '/hubs/bkk/bkk-database.js',
  '/hubs/dmk/dmk-database.js',

  // Assets
  '/assets/logo.png',
  '/assets/favicon.png'
];

// Safe Install Event: Caches all hub assets individually on initial install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Skipped caching asset:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Event: Clear old cache versions
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

// Fetch Handler: Cache-First for instant offline availability, falling back to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
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
          // Fallback for root navigation requests
          if (event.request.mode === 'navigate') {
            return (await caches.match('/index.html')) || (await caches.match('/'));
          }
        });
    })
  );
});