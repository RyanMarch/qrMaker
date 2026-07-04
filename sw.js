const CACHE_NAME = 'qrmaker-v1.0.5';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/qrcode-lib.js',
    '/js/ui-state.js',
    '/js/qr-core.js',
    '/js/export-share.js',
    '/js/pwa-helpers.js',
    '/js/header.js',
    '/js/script.js',
    '/assets/favicon/favicon-96x96.png',
    '/assets/favicon/favicon.svg',
    '/assets/favicon/favicon.ico',
    '/assets/favicon/apple-touch-icon.png',
    '/assets/favicon/site.webmanifest',
    '/assets/favicon/web-app-manifest-192x192.png',
    '/assets/favicon/web-app-manifest-512x512.png'
];

// Install Event - cache core shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event - clear old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - network-first with cache fallback
self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('img.emojiall.com')) {
        return; // Let the browser handle the request normally, bypassing your service worker
    }
    // Only cache GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);
    // Skip external APIs or routes that shouldn't be cached in the shell
    if (url.pathname.includes('/s/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached asset but fetch update in background (stale-while-revalidate)
                fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                        }
                    })
                    .catch(() => {/* Ignore network failures in background fetch */ });
                return cachedResponse;
            }

            // Fallback to network
            return fetch(event.request).then((networkResponse) => {
                // Cache dynamic fonts or library assets
                if (
                    networkResponse.status === 200 &&
                    (url.hostname.includes('fonts.googleapis.com') ||
                        url.hostname.includes('fonts.gstatic.com') ||
                        url.hostname.includes('unpkg.com'))
                ) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                // If offline and requesting the page, return index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('/');
                }
            });
        })
    );
});
