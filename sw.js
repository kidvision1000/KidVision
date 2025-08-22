const CACHE_NAME = "kidvision-observations-cache-v1.3";
const ASSETS = ['./','./index.html','./app.jsx?v=1.3','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', (e)=>{ e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))); });
self.addEventListener('fetch', (e)=>{ e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request))); });
