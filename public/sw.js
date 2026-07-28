const SHELL_CACHE = "deeds-shell-v2";
const RUNTIME_CACHE = "deeds-runtime-v2";
const SHELL = ["/", "/manifest.webmanifest", "/deeds-icon.svg", "/favicon.svg"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => Promise.allSettled(SHELL.map(path => cache.add(path))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => ![SHELL_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(SHELL_CACHE).then(cache => cache.put("/", copy));
          }
          return response;
        })
        .catch(async () => {
          const exact = await caches.match(request);
          return exact || await caches.match("/") || new Response(
            "<!doctype html><title>D.E.E.D.S.</title><meta name='viewport' content='width=device-width'><style>body{font:16px system-ui;background:#102820;color:#f5f1e8;display:grid;min-height:100vh;place-items:center;margin:0}main{max-width:32rem;padding:2rem}h1{font-family:Georgia,serif}p{line-height:1.6;color:#c7d7cf}</style><main><h1>D.E.E.D.S. is offline.</h1><p>Open the app once while connected to finish preparing offline access. Anything already entered remains safe on this device.</p></main>",
            { headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        })
    );
    return;
  }

  if (["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(cached => {
        const fresh = fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || fresh;
      })
    );
  }
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const extra = event.notification.data || {};
  const target = new URL("/", self.location.origin);
  if (extra.view) target.searchParams.set("view", extra.view);
  if (extra.period) target.searchParams.set("period", extra.period);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async clients => {
      const open = clients.find(client => "focus" in client);
      if (open) {
        if ("navigate" in open) await open.navigate(target.toString());
        return open.focus();
      }
      return self.clients.openWindow(target.toString());
    })
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});
