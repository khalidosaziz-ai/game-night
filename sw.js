/* ملك الألعاب — عامل الخدمة
   الشبكة أولًا للصفحة نفسها (حتى يصل أي تحديث فورًا للاعبين)،
   والذاكرة المؤقتة أولًا للأيقونات والملفات الثابتة، مع عمل كامل بلا إنترنت. */
const CACHE_NAME = "malik-alalaab-v1.8.2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(ASSETS); })
      .catch(function () {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("message", function (event) {
  if (event.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;

  var isPage = req.mode === "navigate" || req.destination === "document";

  if (isPage) {
    /* الشبكة أولًا: أي نسخة جديدة نرفعها تصل مباشرة */
    event.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put("./index.html", copy); }).catch(function () {});
        return resp;
      }).catch(function () {
        return caches.match("./index.html").then(function (m) { return m || caches.match("./"); });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      return cached || fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); }).catch(function () {});
        return resp;
      }).catch(function () { return cached; });
    })
  );
});
