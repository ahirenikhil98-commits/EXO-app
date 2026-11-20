const CACHE_NAME = 'exo-tracker-v10';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install new service worker immediately and cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Delete ALL older caches so stale index.html files are never served
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((oldKey) => caches.delete(oldKey))
      )
    ).then(() => self.clients.claim())
  );
});

// Network-First bypassing GitHub Pages' 10-min HTTP cache; works offline in the gym
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isSameOrigin = new URL(event.request.url).origin === self.location.origin;
  const networkReq = isSameOrigin
    ? new Request(event.request, { cache: 'no-cache' })
    : event.request;

  event.respondWith(
    fetch(networkReq)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});