const CACHE_NAME = 'whichterminal-v16';

const ASSETS_TO_CACHE = [
  '/',
  '/home',
  '/index.html',
  '/style.css',
  '/connection-calculator.js',
  '/manifest.json',
  'scripts/pwa-status.js',

  // Clean Hub & Static Routes
  '/mnl',
  '/bkk',
  '/dmk',
  '/about',
  '/privacy',
  '/contact',

  // Hub Pages
  '/hubs/mnl/mnl.html',
  '/hubs/bkk/bkk.html',
  '/hubs/dmk/dmk.html',
  '/about.html',
  '/privacy.html',
  '/contact.html',

  // Hub Databases
  '/hubs/mnl/mnl-database.js',
  '/hubs/bkk/bkk-database.js',
  '/hubs/dmk/dmk-database.js',

  // Assets
  '/assets/logo.png',
  '/assets/favicon.png'
];

// Helper to safely clone and clean responses
async function cleanResponse(response) {
  if (!response || !response.ok) return response;
  if (!response.redirected) {
    return response.clone();
  }
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

// Resilient Install Handler
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS_TO_CACHE) {
        try {
          const response = await fetch(url, { redirect: 'follow' });
          if (response.ok) {
            const cleaned = await cleanResponse(response);
            if (cleaned) {
              await cache.put(url, cleaned);
              console.log(`[SW] Successfully cached: ${url}`);
            }
          }
        } catch (err) {
          console.warn(`[SW] Skipped ${url}:`, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Handler: Clear old caches
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

// Fetch Handler: Cache-First with graceful network fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Ignore extraneous browser requests like site.webmanifest extensions
  if (event.request.url.includes('site.webmanifest')) return;

  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request, { redirect: 'follow' });
        if (networkResponse && networkResponse.status === 200) {
          const cleaned = await cleanResponse(networkResponse);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, cleaned);
        }
        return networkResponse;
      } catch (err) {
        if (event.request.mode === 'navigate') {
          return (await caches.match('/index.html')) || (await caches.match('/'));
        }
      }
    })
  );
});

