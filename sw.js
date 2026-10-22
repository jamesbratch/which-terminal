const CACHE_NAME = 'whichterminal-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/connection-calculator.js',
  '/manifest.json',
  
  // Hub Data Files
  '/hubs/mnl.json',
  '/hubs/sin.json',
  '/hubs/bkk.json',
  // Add any additional hub JSON or script files here (e.g. '/scripts/audit-db.js')

  // Logo & Image Assets
  '/assets/logo.png', // Replace with your exact logo filename from /assets/
  '/assets/favicon.ico'
];

// Install Event: Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
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
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});