// Service worker: gør appen installerbar og viser den hurtigt.
// Ændr VERSION når du har opdateret index.html/config.js, så gamle kopier ryddes.
const VERSION = 'v3';
const SHELL = ['./', './index.html', './config.js', './manifest.json', './logo.png', './icons/icon-192.png', './icons/icon-512.png', './lib/pdf.min.mjs', './lib/pdf.worker.min.mjs'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Netværk først (så nye PDF'er og ændringer altid vises), cache som reserve når man er offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
