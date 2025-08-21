// Minimal PWA shell service worker
const CACHE_NAME = 'sr-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/assets/styles.css',
  '/assets/app.js',
  '/manifest.webmanifest',
  '/offline.html'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL_ASSETS)));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
});

self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  // Only handle same-origin requests; let cross-origin (slowroads.io) go to network
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(res=>res || fetch(e.request).catch(()=>caches.match('/offline.html')))
    );
  }
});


