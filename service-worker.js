self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 通常のリクエストをそのまま通す
  event.respondWith(fetch(event.request).catch(() => {
    return caches.match(event.request);
  }));
});
