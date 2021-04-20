const FILES_TO_CACHE = [
  "/",
  "./index.html",
  "./js/index.js",
  "./css/styles.css",
  "./manifest.webmanifest",
  // "icons/icon-72x72.png",
  // "icons/icon-96x96.png",
  // "icons/icon-128x128.png",
  // "icons/icon-144x144.png",
  // "icons/icon-152x152.png",
  "icons/icon-192x192.png",
  "icons/icon-256x256.png",
  "icons/icon-384x384.png",
  "icons/icon-512x512.png",
  "/js/db.js"
];

const STATIC_CACHE = "static-cache-v1";
const DATA_CACHE = "data-cache-v1";

// install
self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log("Pre-cache successful!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

// activate
self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== STATIC_CACHE && key !== DATA_CACHE) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener("fetch", (evt) => {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
    );

    return;
  }

   // if the request is not for the API, serve static assets using "offline-first" approach.
  // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
  evt.respondWith(
    fetch(evt.request).catch(() => {
      return caches.match(evt.request).then((response) => {
        if (response) {
          return response;
        } else if (evt.request.headers.get("accept").includes("text/html")) {
          // return the cached home page for all requests for html pages
          return caches.match("/");
        }
      });
    })
  );
});
