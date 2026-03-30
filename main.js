import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage } from "electron";
import { AquariumServerController } from "./server/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;
let isQuitting = false;
let alwaysOnTop = false;

const serverController = new AquariumServerController({
  onStatsChange: ({ playerCount }) => {
    if (process.platform === "darwin" && app.dock) {
      app.dock.setBadge(playerCount > 1 ? String(playerCount) : playerCount === 1 ? "1" : "");
    }
    mainWindow?.webContents.send("multiplayer-stats", { playerCount });
  }
});

function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="none"/>
      <path fill="#8ee8ff" d="M12 34h6l5-5h17l7 5h7l-6 6 6 6h-7l-7 5H23l-5-5h-6z"/>
      <path fill="#0e3854" d="M23 29h17v17H23z"/>
      <rect x="39" y="35" width="4" height="4" fill="#06141f"/>
      <rect x="40" y="36" width="1" height="1" fill="#f9fbff"/>
    </svg>
  `.trim();

  return nativeImage
    .createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`)
    .resize({ width: 18, height: 18 });
}

function createMenu() {
  const template = process.platform === "darwin"
    ? [
        {
          label: "Pixel Aquarium",
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" }
          ]
        },
        {
          label: "Window",
          submenu: [
            { role: "minimize" },
            { role: "zoom" },
            { role: "togglefullscreen" },
            { type: "separator" },
            { label: "Show Settings", click: () => sendShowSettings() }
          ]
        }
      ]
    : [
        {
          label: "App",
          submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }]
        },
        {
          label: "Window",
          submenu: [{ role: "minimize" }, { role: "togglefullscreen" }]
        }
      ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function showWindow() {
  if (!mainWindow) {
    return;
  }
  if (process.platform === "darwin" && app.dock) {
    app.dock.show();
  }
  mainWindow.show();
  mainWindow.focus();
}

function hideWindow() {
  if (!mainWindow) {
    return;
  }
  mainWindow.hide();
  if (process.platform === "darwin" && app.dock) {
    app.dock.hide();
  }
}

function sendShowSettings() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  showWindow();
  mainWindow.webContents.send("show-settings");
}

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show", click: () => showWindow() },
      { label: "Settings", click: () => sendShowSettings() },
      { type: "separator" },
      {
        label: "Always On Top",
        type: "checkbox",
        checked: alwaysOnTop,
        click: (menuItem) => {
          alwaysOnTop = menuItem.checked;
          mainWindow?.setAlwaysOnTop(alwaysOnTop, "floating");
          mainWindow?.webContents.send("always-on-top-updated", alwaysOnTop);
        }
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.setToolTip("Pixel Aquarium");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 760,
    minWidth: 840,
    minHeight: 520,
    show: false,
    backgroundColor: "#030816",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    fullscreenable: true,
    resizable: true,
    trafficLightPosition: process.platform === "darwin" ? { x: 14, y: 14 } : undefined,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
  mainWindow.once("ready-to-show", () => showWindow());
  mainWindow.on("close", (event) => {
    if (isQuitting) {
      return;
    }
    event.preventDefault();
    hideWindow();
  });
  mainWindow.on("show", updateTrayMenu);
  mainWindow.on("hide", updateTrayMenu);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.on("click", () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isVisible()) {
      hideWindow();
    } else {
      showWindow();
    }
  });
  updateTrayMenu();
}

ipcMain.handle("get-window-state", () => ({
  alwaysOnTop
}));

ipcMain.handle("set-always-on-top", (_event, value) => {
  alwaysOnTop = Boolean(value);
  mainWindow?.setAlwaysOnTop(alwaysOnTop, "floating");
  updateTrayMenu();
  return { alwaysOnTop };
});

ipcMain.handle("multiplayer:host", async (_event, payload) => {
  const room = await serverController.ensureRoom(payload?.settings, 3476);
  return room;
});

ipcMain.handle("dock:set-badge", (_event, value) => {
  if (process.platform === "darwin" && app.dock) {
    app.dock.setBadge(value ? String(value) : "");
  }
  return true;
});

app.whenReady().then(() => {
  createMenu();
  createWindow();
  createTray();

  app.on("activate", () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
      return;
    }
    showWindow();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  serverController.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
