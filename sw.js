// Service Worker para Bumor Café PWA
const CACHE_NAME = 'bumor-cafe-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('⚠️ Error al cachear archivos:', err);
      })
  );
  // Activar inmediatamente
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activado');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // No cachear requests a Google Apps Script (siempre ir al servidor)
  if (event.request.url.includes('script.google.com')) {
    return event.respondWith(fetch(event.request));
  }

  // Estrategia: Network First, fallback a Cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, guardar en cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('📦 Sirviendo desde cache:', event.request.url);
              return cachedResponse;
            }
            // Si tampoco está en cache, mostrar página offline básica
            if (event.request.destination === 'document') {
              return new Response(
                '<h1>Sin conexión</h1><p>Verifica tu conexión a internet.</p>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            }
          });
      })
  );
});
