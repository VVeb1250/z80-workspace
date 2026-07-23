const path = require("node:path");
const { app, BrowserWindow, dialog, shell } = require("electron");
const { startStaticServer } = require("./static-server.cjs");

let appServer;
let mainWindow;

async function createWindow() {
  if (!appServer) {
    appServer = await startStaticServer(path.join(__dirname, "..", "dist"));
  }

  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#18181b",
    show: false,
    title: "Z80 Workspace",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = window;

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== appServer.origin) {
      event.preventDefault();
    }
  });
  window.once("ready-to-show", () => window.show());
  window.on("closed", () => {
    if (mainWindow === window) mainWindow = undefined;
  });

  await window.loadURL(appServer.origin);
}

app.setAppUserModelId("io.github.vveb1250.z80workspace");

app.whenReady().then(async () => {
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
}).catch((error) => {
  dialog.showErrorBox("Z80 Workspace could not start", String(error));
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  void appServer?.close().catch(() => {});
  appServer = undefined;
});
