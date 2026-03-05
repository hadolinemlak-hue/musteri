/* sw.js — HADOLIN CRM (offline cache)
   Aynı klasöre koy: hadolin-crm.html + sw.js
   Not: Service Worker, dosyayı bir sunucuda (GitHub Pages gibi) çalıştırınca en iyi sonuç verir.
*/

const CACHE_NAME = "hadolin-crm-cache-v2";

// HTML dosyanın adını buraya yazdım.
// Eğer farklı isim kullanırsan bu satırı da değiştir.
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
    caches.keys()
      .then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - HTML/NAV: network-first (online ise güncel, offline ise cache)
// - Diğerleri: cache-first (hızlı)
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Sadece GET isteklerini yakala
  if (req.method !== "GET") return;

  const accept = req.headers.get("accept") || "";
  const isNav = req.mode === "navigate" || accept.includes("text/html");

  if (isNav) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || caches.match("./hadolin-crm.html") || new Response("Offline", { status: 200 });
        })
    );
    return;
  }

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
