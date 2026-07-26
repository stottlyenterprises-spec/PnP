const CACHE = "pnp-shell-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const open = clients.find(client => "focus" in client);
      return open ? open.focus() : self.clients.openWindow("/");
    })
  );
});
