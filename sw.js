// Bump this when you change any app file so phones pick up the new version.
const CACHE = "petal-v4";
const ICON_CACHE = "petal-icons-v1";
const ICON_HOSTS = ["www.google.com", "icons.duckduckgo.com"];
const ASSETS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "games.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon.png",
  "fonts/newsreader-latin-opsz-normal.woff2",
  "fonts/newsreader-latin-opsz-italic.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2",
  "fonts/ibm-plex-mono-latin-500-normal.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== ICON_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first (so updates show up), falling back to the cache when offline.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Game icons: cache first, so they show offline and load instantly.
  if (ICON_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(ICON_CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") c.put(req, res.clone());
        return res;
      })))
    );
    return;
  }
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
