const { createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
  [".webp", "image/webp"],
  [".zip", "application/zip"],
]);

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function sendFile(request, response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=31536000",
    "Content-Type": MIME_TYPES.get(extension) ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
}

function createRequestHandler(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const entry = path.join(root, "index.html");

  return async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end("Method not allowed");
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    } catch {
      response.writeHead(400);
      response.end("Bad request");
      return;
    }

    const requestedPath = path.resolve(root, `.${pathname}`);
    const insideRoot =
      requestedPath === root || requestedPath.startsWith(`${root}${path.sep}`);
    if (!insideRoot) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const filePath = requestedPath === root ? entry : requestedPath;
    if (await isFile(filePath)) {
      sendFile(request, response, filePath);
      return;
    }

    if (!path.extname(pathname) && (await isFile(entry))) {
      sendFile(request, response, entry);
      return;
    }

    response.writeHead(404);
    response.end("Not found");
  };
}

async function startStaticServer(rootDirectory) {
  const server = http.createServer(createRequestHandler(rootDirectory));
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0 }, resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not determine the desktop server address.");
  }

  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
        server.closeAllConnections();
      }),
  };
}

module.exports = { createRequestHandler, startStaticServer };
