const CACHE_NAME = 'whichterminal-v14';

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

// Resilient Install: Fetches each resource safely and caches all valid 200 OK responses
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS_TO_CACHE) {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok) {
            await cache.put(url, response);
            console.log(`[SW] Successfully cached: ${url}`);
          } else {
            console.warn(`[SW] Could not cache ${url} (Status: ${response.status})`);
          }
        } catch (err) {
          console.warn(`[SW] Failed to fetch ${url}:`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate: Purge older cache versions
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

// Fetch Handler: Cache-First, fallback to network
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
          if (event.request.mode === 'navigate') {
            return (await caches.match('/index.html')) || (await caches.match('/'));
          }
        });
    })
  );
});