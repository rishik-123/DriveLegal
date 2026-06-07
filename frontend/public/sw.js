const CACHE_NAME = "driveverse-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/terms"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event Interceptor
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Bypass service worker caching for development-specific endpoints and non-http protocols
  if (
    !url.protocol.startsWith("http") ||
    url.pathname.includes("/_next/webpack-hmr") ||
    url.pathname.includes("/__nextjs_original-stack-frame") ||
    url.pathname.includes("hot-update")
  ) {
    return;
  }

  // Handle Laws and Fines API calls: Network-first, cache fallback
  if (url.pathname.includes("/api/laws")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          console.log("[Service Worker] Offline: Loading laws API from cache");
          return caches.match(event.request);
        })
    );
    return;
  }

  // Do NOT cache other API calls (such as auth/me, vehicles list, etc.) to prevent stale dynamic states
  if (url.pathname.includes("/api/")) {
    return;
  }

  // For documents (HTML) and scripts: Network-first, fallback to cache
  const isDocumentOrScript = 
    event.request.mode === "navigate" || 
    url.pathname.endsWith(".js") || 
    url.pathname.includes("/_next/static/");

  if (isDocumentOrScript) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clonedNetwork = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedNetwork);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other static assets (images, CSS, fonts, icons): Cache-first, fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clonedNetwork = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedNetwork);
          });
        }
        return networkResponse;
      });
    })
  );
});
