/**
 * Service Worker: VKU Room Booking PWA (v18)
 * Caching Strategy: Network-First for HTML/JS/CSS to guarantee fresh updates on deploy
 * Fallback: Cache Storage for offline-first resilience
 */

const CACHE_NAME = 'vku-booking-cache-v31';
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker v27] Installing & pre-caching App Shell...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker v27] Activated! Purging all outdated caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker v27] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Bỏ qua mọi request khác domain (ntfy.sh SSE real-time, api.qrserver.com, googleapis...)
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('/verify/') ||
    event.request.url.includes('/oauth2/')
  ) {
    return;
  }

  // Network-First cho tất cả tài nguyên (HTML, JS, CSS)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Khi mất mạng (Offline), lấy từ Cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
