// Cache-first static shell + runtime cache-first-with-network-fallback for
// anything missed. Bump CACHE_NAME on release to invalidate old caches.
// Note: registration is skipped entirely under file:// (see js/main.js) --
// service workers require a secure/localhost context, so opening
// index.html directly still plays fine, just without offline caching
// until the app is served over http(s).
const CACHE_NAME = "mathrush-cache-v3";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/data/themes.js",
  "./js/data/i18n.js",
  "./js/data/text-rtl.js",
  "./js/data/battlepass.js",
  "./js/data/defaults.js",
  "./js/storage/save-store.js",
  "./js/audio/particle.js",
  "./js/audio/sound-manager.js",
  "./js/core/canvas-scale.js",
  "./js/core/input.js",
  "./js/core/loop.js",
  "./js/ui/draw-utils.js",
  "./js/ui/button.js",
  "./js/ui/setting-carousel.js",
  "./js/ui/setting-input.js",
  "./js/ui/ops-selector.js",
  "./js/ui/numpad.js",
  "./js/ui/virtual-keyboard.js",
  "./js/game/visual-counters.js",
  "./js/game/vertical-math.js",
  "./js/game/player-state.js",
  "./js/screens/intro.js",
  "./js/screens/profiles.js",
  "./js/screens/confirm-delete.js",
  "./js/screens/text-input.js",
  "./js/screens/menu.js",
  "./js/screens/settings.js",
  "./js/screens/vs-setup.js",
  "./js/screens/countdown.js",
  "./js/screens/gameplay.js",
  "./js/screens/over.js",
  "./js/screens/stats.js",
  "./js/screens/battlepass.js",
  "./js/app/rotate-overlay.js",
  "./js/app/game-app.js",
  "./js/app/pwa-install.js",
  "./js/main.js",
  "./sounds/correct.mp3",
  "./sounds/wrong.mp3",
  "./sounds/click.mp3",
  "./sounds/countdown.mp3",
  "./sounds/type.mp3",
  "./sounds/level.mp3",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon-180.png",
  "./icons/favicon-32.png",
  "./icons/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
