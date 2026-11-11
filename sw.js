/* Guarda la app en el celular para que funcione sin internet una vez instalada. */
const CACHE = 'appascii-v2';
const ARCHIVOS = ['./', './index.html', './conversor.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
    if (resp.ok && new URL(e.request.url).origin === location.origin) {
      const copia = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copia));
    }
    return resp;
  }).catch(() => caches.match('./index.html'))));
});
