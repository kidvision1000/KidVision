const CACHE_NAME = "kidvision-observations-cache-v1.1";
self.addEventListener('install', (e)=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(['./','./index.html','./app.jsx','./manifest.json']))); });
self.addEventListener('fetch', (e)=>{ e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request))); });
