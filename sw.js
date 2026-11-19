<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Salin sw.js Rev 72</title>
<style>body{margin:0;padding:16px;font:16px/1.5 system-ui,sans-serif;background:#fff;color:#1a1d1c;max-width:720px;margin-inline:auto}
h1{font-size:20px;margin:4px 0}p{color:#5c6b66;margin:6px 0}
.bar{position:sticky;top:0;background:#fff;padding:10px 0;display:flex;gap:8px;z-index:2}
button{flex:1;min-height:52px;font:700 17px system-ui;border:0;border-radius:10px;background:#0e6b5c;color:#fff}
button.b2{background:#fff;color:#0e6b5c;border:2px solid #0e6b5c}
#msg{min-height:24px;font-weight:600;color:#1f7a45}
textarea{width:100%;height:50vh;font:11px ui-monospace,monospace;box-sizing:border-box;border:1px solid #bbb;border-radius:8px;padding:8px}</style></head><body>
<h1>Salin sw.js (Rev 72)</h1>
<p>1) Ketuk <b>Pilih semua</b>, 2) ketuk <b>Salin</b>, 3) tempel di editor hosting (ganti seluruh isi lama). Bila Salin tidak jalan: setelah Pilih semua, tekan tahan di teks lalu pilih Salin.</p>
<div class="bar"><button type="button" onclick="var t=document.getElementById('c');t.focus();t.select();t.setSelectionRange(0,t.value.length);document.getElementById('msg').textContent='Terpilih semua ('+t.value.length+' karakter)'">Pilih semua</button>
<button type="button" class="b2" onclick="var t=document.getElementById('c'),m=document.getElementById('msg');t.focus();t.select();t.setSelectionRange(0,t.value.length);var ok=false;try{ok=document.execCommand('copy')}catch(e){}if(ok){m.textContent='Tersalin ('+t.value.length+' karakter). Tempel di editor.'}else if(navigator.clipboard){navigator.clipboard.writeText(t.value).then(function(){m.textContent='Tersalin ('+t.value.length+' karakter). Tempel di editor.'},function(){m.textContent='Gagal otomatis: tekan tahan di teks, pilih Salin.'})}else{m.textContent='Gagal otomatis: tekan tahan di teks, pilih Salin.'}">Salin</button></div>
<div id="msg" role="status"></div>
<textarea id="c" readonly spellcheck="false">/* Altair Project Management - service worker.
   Scope: the folder this file is served from. Caches the app shell only.
   NEVER caches or touches: *.supabase.co (database, auth, storage, edge functions), non-GET requests, or authenticated calls. */
'use strict';
var VERSION = 'apm-2026-11-19-r72';
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
    return Promise.all(ks.filter(function (k) { return k !== SHELL &amp;&amp; k !== RUNTIME; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function isApi(u) { return /(^|\.)supabase\.(co|in)$/i.test(u.hostname) || u.pathname.indexOf('/functions/v1/') &gt;= 0 || u.pathname.indexOf('/rest/v1/') &gt;= 0 || u.pathname.indexOf('/auth/v1/') &gt;= 0 || u.pathname.indexOf('/storage/v1/') &gt;= 0; }

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                                   /* writes always go to the network */
  var u; try { u = new URL(req.url); } catch (x) { return; }
  if (u.protocol !== 'https:' &amp;&amp; u.protocol !== 'http:') return;
  if (isApi(u)) return;                                               /* data, auth and functions are never intercepted */
  if (req.headers.has('authorization')) return;

  /* page navigations: network first, so a new version is picked up on the next open; offline falls back to the cached app */
  if (req.mode === 'navigate' &amp;&amp; u.origin === self.location.origin) {
    e.respondWith(fetch(req).then(function (r) {
      if (r &amp;&amp; r.ok) { var cp = r.clone(); caches.open(SHELL).then(function (c) { c.put('index.html', cp); }); }
      return r;
    }).catch(function () {
      return caches.match('index.html').then(function (r) { return r || caches.match('./'); }).then(function (r) { return r || new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } }); });
    }));
    return;
  }

  var same = u.origin === self.location.origin;
  if (!same &amp;&amp; STATIC_HOSTS.indexOf(u.hostname) &lt; 0) return;          /* any other host: untouched */

  /* static files: serve from cache at once and refresh in the background */
  e.respondWith(caches.open(same ? SHELL : RUNTIME).then(function (c) {
    return c.match(req).then(function (hit) {
      var net = fetch(req).then(function (r) { if (r &amp;&amp; (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
</textarea>
</body></html>
