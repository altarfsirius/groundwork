/* Polaris One service worker (PWA).
   - App shell is cached so the app opens offline.
   - Only same-origin GET requests are handled. Supabase, Notion proxy, fonts and any other
     cross-origin call go straight to the network and are NEVER cached (no personal data in the cache).
   - Change VERSION on every delivery so users get the new app. */
const VERSION = 'po-28-pwa1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('po-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(r);
        if (res && res.ok) { const c = await caches.open(VERSION); c.put('./index.html', res.clone()); return res; }
        const alt = (await caches.match('./index.html')) || (await caches.match('./'));
        return alt || res;
      } catch (_) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(r);
    const net = fetch(r).then(async res => { if (res && res.ok) (await caches.open(VERSION)).put(r, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || new Response('', { status: 504 });
  })());
});
