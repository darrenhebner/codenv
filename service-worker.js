/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**@type {ServiceWorkerGlobalScope} sw */
const sw = self;

sw.addEventListener("fetch", (event) => {
  if (
    event.request.url.endsWith("/update") &&
    event.request.method === "POST"
  ) {
    event.respondWith(
      (async function handler() {
        const { html, css, javascript } = Object.fromEntries(
          await event.request.formData()
        );

        const cache = await caches.open("asset-cache");
        await Promise.all([
          cache.put("/preview/styles.css", new Response(css)),
          cache.put(
            "/preview/markup.html",
            new Response(html, {
              headers: {
                "Content-Type": "text/html",
              },
            })
          ),
          cache.put("/preview/script.js", new Response(javascript)),
        ]);

        return new Response("", {
          status: 302,
          headers: {
            Location: "/preview",
          },
        });
      })()
    );
  }

  if (event.request.url.endsWith("/preview")) {
    // build html
    event.respondWith(
      (async function handler() {
        const cache = await caches.open("asset-cache");
        const markup = await cache.match("/preview/markup.html");
        const css = await (await cache.match("/preview/styles.css")).text();
        const javascript = await (
          await cache.match("/preview/script.js")
        ).text();
        const markupText = await markup.text();

        const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <style>${css}</style>
  </head>
  <body>
  ${markupText}
  <script>${javascript}</script>
  </body>
</html>
        `;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html",
          },
        });
      })()
    );
  }
});
