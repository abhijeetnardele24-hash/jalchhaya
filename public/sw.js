// JalChhaya Service Worker for Offline Read Experience
const CACHE_NAME = "jalchhaya-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Local origin assets & navigation
  if (url.origin === location.origin) {
    event.respondWith(
      (async () => {
        // 1. Try cache first (exact match or ignore query params like ?t=...)
        const cached =
          (await caches.match(event.request)) ||
          (await caches.match(event.request, { ignoreSearch: true }));

        if (cached) {
          // In background, refresh cache when online
          fetch(event.request)
            .then(async (networkResponse) => {
              if (networkResponse && (networkResponse.ok || networkResponse.status === 0)) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, networkResponse.clone());
              }
            })
            .catch(() => {});
          return cached;
        }

        // 2. Fetch from network
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && (networkResponse.ok || networkResponse.status === 0)) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          // 3. Fallback when offline
          const fallback = await caches.match(event.request, { ignoreSearch: true });
          if (fallback) return fallback;

          // For SPA navigation requests, fall back to cached index.html
          if (event.request.mode === "navigate") {
            const indexHtml = await caches.match("./index.html");
            if (indexHtml) return indexHtml;
            const root = await caches.match("./");
            if (root) return root;
          }

          return new Response("Offline resource unavailable", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          });
        }
      })()
    );
  }
});
