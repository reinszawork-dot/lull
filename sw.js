/* Lull service worker: offline app shell. */
const VERSION = 'lull-v8';
const SHELL = ['./', 'index.html', 'styles.css', 'hush.css', 'icons.js', 'hush.js', 'tap.js', 'content.js', 'pro-content.js', 'scenes.js','sound.js', 'app.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      c.put(req, res.clone());
      return res;
    }).catch(() => new Response('', { status: 504 })));
    return;
  }
  if (url.origin !== location.origin) return;
  // Network-first so updates show immediately; cache for offline.
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    try {
      const res = await fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache' });
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch {
      return (await c.match(req, { ignoreSearch: true }))
        || (req.mode === 'navigate' ? c.match('index.html') : undefined)
        || new Response('Offline', { status: 503 });
    }
  })());
});
