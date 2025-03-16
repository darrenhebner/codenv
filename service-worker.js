/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * Service Worker Module
 * Directly imports the defaults module
 */
import { DEFAULTS } from "./defaults.js";

/**@type {ServiceWorkerGlobalScope} */
const sw = self;

// Log successful installation
sw.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate the worker immediately
sw.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

sw.addEventListener("fetch", (event) => {
  if (event.request.url.endsWith("/preview")) {
    event.respondWith(
      (async function handler() {
        const cache = await caches.open("asset-cache");

        // Process POST request - save to cache if it's a form submission
        if (event.request.method === "POST") {
          try {
            const formData = await event.request.formData();
            const { html, css, javascript } = Object.fromEntries(formData);

            // Store the components in the cache
            await Promise.all([
              cache.put(
                "/preview/styles.css",
                new Response(css, {
                  headers: { "Content-Type": "text/css" },
                })
              ),
              cache.put(
                "/preview/markup.html",
                new Response(html, {
                  headers: { "Content-Type": "text/html" },
                })
              ),
              cache.put(
                "/preview/script.js",
                new Response(javascript, {
                  headers: { "Content-Type": "application/javascript" },
                })
              ),
            ]);
          } catch (error) {
            console.error("Error processing form data:", error);
          }
        }

        const markup = await cache.match("/preview/markup.html");

        if (markup) {
          return markup;
        } else {
          // Create a simple fallback page if nothing is cached
          const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <link rel="stylesheet" href="/preview/styles.css">
  <script src="/preview/script.js" defer></script>
</head>
<body>
  ${DEFAULTS.previewHTML}
</body>
</html>`;

          return new Response(html, {
            headers: { "Content-Type": "text/html" },
          });
        }
      })()
    );
  }

  // Handle request for the CSS file
  if (event.request.url.endsWith("/preview/styles.css")) {
    event.respondWith(
      (async function handler() {
        const cache = await caches.open("asset-cache");
        const cssResponse = await cache.match("/preview/styles.css");

        if (cssResponse) {
          return cssResponse;
        } else {
          // Return default CSS if not found
          return new Response(DEFAULTS.css, {
            headers: { "Content-Type": "text/css" },
          });
        }
      })()
    );
  }

  // Handle request for the JavaScript file
  if (event.request.url.endsWith("/preview/script.js")) {
    event.respondWith(
      (async function handler() {
        const cache = await caches.open("asset-cache");
        const jsResponse = await cache.match("/preview/script.js");

        if (jsResponse) {
          return jsResponse;
        } else {
          // Return default JS if not found
          return new Response(DEFAULTS.javascript, {
            headers: { "Content-Type": "application/javascript" },
          });
        }
      })()
    );
  }

  // No need to handle defaults.js requests any more, as we're importing it directly
});
