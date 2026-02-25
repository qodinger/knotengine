self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (e) => {
  // Pass through all requests so we don't return ERR_FAILED
  e.respondWith(
    fetch(e.request).catch(
      () => new Response("Network error", { status: 502 }),
    ),
  );
});
