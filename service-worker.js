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
  console.log('Service Worker installed');
  event.waitUntil(self.skipWaiting());
});

// Activate the worker immediately
sw.addEventListener("activate", (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Map of asset paths to content types and default content
const ASSET_CONFIG = {
  "/preview/styles.css": {
    contentType: "text/css",
    defaultContent: DEFAULTS.css
  },
  "/preview/script.js": {
    contentType: "application/javascript",
    defaultContent: DEFAULTS.javascript
  }
};

sw.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const path = url.pathname;
  
  // Handle the /preview endpoint (both GET and POST)
  if (path === "/preview") {
    event.respondWith(
      (async function handlePreview() {
        const cache = await caches.open("asset-cache");

        // Handle POST requests for form submissions
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

            // Return the HTML content directly
            return new Response(html, {
              headers: { "Content-Type": "text/html" },
            });
          } catch (error) {
            console.error("Error processing form data:", error);
            return new Response("Error processing form", { status: 500 });
          }
        }

        // Handle GET requests for preview
        const markup = await cache.match("/preview/markup.html");
        if (markup) {
          return markup;
        } else {
          // If markup.html isn't cached, use default HTML
          return new Response(DEFAULTS.html, {
            headers: { "Content-Type": "text/html" },
          });
        }
      })()
    );
    return;
  }

  // Generic asset handler for CSS and JS assets
  if (ASSET_CONFIG[path]) {
    event.respondWith(
      (async function handleAsset() {
        const cache = await caches.open("asset-cache");
        
        // Check the cache first
        const cachedResponse = await cache.match(path);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, use the default
        const config = ASSET_CONFIG[path];
        return new Response(config.defaultContent, {
          headers: { "Content-Type": config.contentType },
        });
      })()
    );
  }
});
