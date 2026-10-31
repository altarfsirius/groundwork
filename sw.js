/* Altair Project Management - service worker.
   Scope: the folder this file is served from. Caches the app shell only.
   NEVER caches or touches: *.supabase.co (database, auth, storage, edge functions), non-GET requests, or authenticated calls. */
'use strict';
var VERSION = 'apm-2026-10-31-r45';
var SHELL = VERSION + '-shell';
var RUNTIME = VERSION + '-runtime';
var SHELL_FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
/* cross-origin hosts whose static assets may be cached (library and fonts only) */
var STATIC_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    /* one failing file must not block the install of the others */
    return Promise.all(SHELL_FILES.map(function (f) { return c.add(new Request(f, { cache: 'reload' })).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== SHELL && k !== RUNTIME; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function isApi(u) { return /(^|\.)supabase\.(co|in)$/i.test(u.hostname) || u.pathname.indexOf('/functions/v1/') >= 0 || u.pathname.indexOf('/rest/v1/') >= 0 || u.pathname.indexOf('/auth/v1/') >= 0 || u.pathname.indexOf('/storage/v1/') >= 0; }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                                   /* writes always go to the network */
  var u; try { u = new URL(req.url); } catch (x) { return; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
  if (isApi(u)) return;                                               /* data, auth and functions are never intercepted */
  if (req.headers.has('authorization')) return;

  /* page navigations: network first, so a new version is picked up on the next open; offline falls back to the cached app */
  if (req.mode === 'navigate' && u.origin === self.location.origin) {
    e.respondWith(fetch(req).then(function (r) {
      if (r && r.ok) { var cp = r.clone(); caches.open(SHELL).then(function (c) { c.put('index.html', cp); }); }
      return r;
    }).catch(function () {
      return caches.match('index.html').then(function (r) { return r || caches.match('./'); }).then(function (r) { return r || new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } }); });
    }));
    return;
  }

  var same = u.origin === self.location.origin;
  if (!same && STATIC_HOSTS.indexOf(u.hostname) < 0) return;          /* any other host: untouched */

  /* static files: serve from cache at once and refresh in the background */
  e.respondWith(caches.open(same ? SHELL : RUNTIME).then(function (c) {
    return c.match(req).then(function (hit) {
      var net = fetch(req).then(function (r) { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
