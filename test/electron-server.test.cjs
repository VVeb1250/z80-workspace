const assert = require("node:assert/strict");
const { mkdtemp, mkdir, rm, writeFile } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { startStaticServer } = require("../electron/static-server.cjs");

async function withStaticServer(run) {
  const workspace = await mkdtemp(path.join(os.tmpdir(), "z80-electron-test-"));
  const root = path.join(workspace, "dist");
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, "index.html"), "<main>Z80 Workspace</main>");
  await writeFile(path.join(root, "assets", "app.js"), "globalThis.loaded = true;");
  await writeFile(path.join(workspace, "secret.txt"), "not public");

  const server = await startStaticServer(root);
  try {
    await run(server.origin);
  } finally {
    await server.close();
    await rm(workspace, { force: true, recursive: true });
  }
}

test("serves the packaged app and assets from loopback", async () => {
  await withStaticServer(async (origin) => {
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /^text\/html/);
    assert.equal(await page.text(), "<main>Z80 Workspace</main>");

    const script = await fetch(`${origin}/assets/app.js`);
    assert.equal(script.status, 200);
    assert.match(script.headers.get("content-type"), /^text\/javascript/);
  });
});

test("falls back to the SPA entry but returns 404 for missing assets", async () => {
  await withStaticServer(async (origin) => {
    const route = await fetch(`${origin}/editor/project`);
    assert.equal(route.status, 200);
    assert.equal(await route.text(), "<main>Z80 Workspace</main>");

    const asset = await fetch(`${origin}/assets/missing.js`);
    assert.equal(asset.status, 404);
  });
});

test("never serves files outside the packaged dist directory", async () => {
  await withStaticServer(async (origin) => {
    const response = await fetch(`${origin}/%2e%2e/secret.txt`);
    assert.equal(response.status, 404);
    assert.notEqual(await response.text(), "not public");
  });
});
