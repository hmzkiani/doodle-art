const CACHE_PREFIX = 'doodle-land-';
const CACHE_NAME = `${CACHE_PREFIX}v8`;

function localUrl(path) {
  return new URL(path, self.registration.scope).href;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const home = await fetch(localUrl('./'), { cache: 'reload' });
    if (!home.ok) throw new Error(`Unable to cache the app shell (${home.status})`);
    const html = await home.clone().text();
    const shellPath = localUrl('./');
    await cache.put(shellPath, home);

    // Vite emits hashed JavaScript and CSS references in index.html. Cache all
    // of them before activating this worker so an update cannot replace a
    // working offline version with a partial one.
    const appFiles = [...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css)(?:\?[^\"]*)?)"/g)]
      .map((match) => localUrl(match[1]));
    if (!appFiles.some((path) => path.endsWith('.js')) || !appFiles.some((path) => path.endsWith('.css'))) {
      throw new Error('The production app shell is missing its JavaScript or CSS bundle.');
    }
    await Promise.all([...new Set(appFiles)].map(async (path) => {
      const response = await fetch(path, { cache: 'reload' });
      if (!response.ok) throw new Error(`Unable to cache app asset ${path} (${response.status})`);
      await cache.put(path, response);
    }));

    // These same-origin assets are local files; their failure should not block
    // the app shell, while successful responses are available offline too.
    await Promise.allSettled(['manifest.webmanifest', 'doodle-land-logo.svg', 'favicon.svg'].map(async (path) => {
      const url = localUrl(path);
      const response = await fetch(url, { cache: 'reload' });
      if (response.ok) await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Only retire caches owned by this app. IndexedDB artwork is never
    // touched by the service worker or its cache-version updates.
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    if (event.request.mode === 'navigate') {
      // Refresh the document while connected so users receive new hashed
      // bundles promptly. If the origin is unreachable, use the last complete
      // app shell cached during installation.
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(localUrl('./'), copy)).catch(() => undefined);
        }
        return response;
      } catch {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const shell = await caches.match(localUrl('./'));
        if (shell) return shell;
        throw new Error('Doodle Land is offline and its app shell is not cached yet.');
      }
    }

    const cached = await caches.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok && response.type !== 'opaque') {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
      }
      return response;
    } catch (error) {
      throw error;
    }
  })());
});
