/* sw.js — HADOLIN CRM (offline cache)
   Aynı klasöre koy: hadolin-crm.html ile birlikte.
   Not: start_url "./" kullandığın için, mümkünse dosyayı bir klasörde barındır (GitHub Pages gibi).
*/

const CACHE_NAME = "hadolin-crm-cache-v1";

// İstersen burada ana HTML dosyanın adını net yaz:
// Örn: "/hadolin-crm.html" veya "./hadolin-crm.html"
const CORE_ASSETS = [
  "./",
  "./hadolin-crm.html",
  "./sw.js"
];

// Install: core dosyaları cache'le
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: eski cache'leri temizle
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Navigation (HTML sayfa): network-first (online ise güncel, offline ise cache)
// - Diğerleri: cache-first (hızlı)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Sadece GET isteklerini yakala
  if (req.method !== "GET") return;

  const isNavigation = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("./hadolin-crm.html"))
        )
    );
    return;
  }

  // Static: cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
    })
  );
});
