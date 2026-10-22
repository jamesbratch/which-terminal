const CACHE_NAME = 'whichterminal-v9';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/connection-calculator.js',
  '/manifest.json',
  '/hubs/mnl/mnl.html',
  '/hubs/bkk/bkk.html',
  '/hubs/dmk/dmk.html',
  '/hubs/mnl/mnl-database.js',
  '/hubs/bkk/bkk-database.js',
  '/hubs/dmk/dmk-database.js',
  '/assets/logo.png',
  '/assets/favicon.png'
];

// Safe Install Event: Caches files individually so one missing file won't break the whole app
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Skipping failed asset cache:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean Old Caches
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

// Fetch Event: Serve from Cache First, Fallback to Network
self.addEventListener('fetch', (event) => {
  let request = event.request;
  
  if (request.url.endsWith('/')) {
    request = new Request(new URL('./index.html', request.url));
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});