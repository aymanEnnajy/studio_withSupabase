const CACHE_NAME = 'photostudio-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/tailwind.css',
    '/css/fontawesome.css',
    '/js/main.js',
    '/images/pwa-icon-192.png',
    '/images/pwa-icon-512.png',
    '/offline.html'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching static assets');
            return cache.addAll(ASSETS_TO_CACHE).catch(err => {
                console.warn('Failed to cache some assets during install:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    // Navigation requests (HTML pages) - Network first, then cache (offline fallback)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request)
                        .then((response) => {
                            if (response) return response;
                            // If offline and page not cached, show generic offline page or home
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // API requests - Network first
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Static assets (CSS, JS, Images, Fonts) - Cache first, then network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((networkResponse) => {
                // Optional: dynamically cache new assets
                // return caches.open(CACHE_NAME).then((cache) => {
                //   cache.put(event.request, networkResponse.clone());
                //   return networkResponse;
                // });
                return networkResponse;
            });
        })
    );
});
