import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the manual home in Spanish", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /lang="es"/);
  assert.match(html, /Guía de reconstrucción psicológica de una catástrofe/);
  assert.match(html, /Volver a respirar/);
  assert.match(html, /Buscar en la guía/);
  assert.match(html, /Ayuda práctica y verificada/);
  assert.match(html, /venezuela\.servicesadvisor\.net/);
  assert.match(html, /linkedin\.com\/in\/indira-parra/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  assert.doesNotMatch(html, />Referencias</i);
});

test("ships the complete manual and offline shell", async () => {
  const [manualData, manifest, serviceWorker] = await Promise.all([
    readFile(new URL("../app/manual-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
  ]);
  assert.match(manualData, /"title": "Guía 7"/);
  assert.match(manualData, /"title": "Sobre los autores"/);
  assert.doesNotMatch(manualData, /"title": "Referencias"/);
  assert.equal((manualData.match(/notes-page/g) ?? []).length, 8);
  assert.match(manualData, /worksheet/);
  assert.ok(manualData.length > 150_000);
  assert.equal(JSON.parse(manifest).lang, "es-VE");
  assert.match(serviceWorker, /CACHE_NAME/);
});
