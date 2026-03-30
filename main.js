const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require("electron");
const path = require("path");

let mainWindow = null;
let tray = null;
let isQuitting = false;
let alwaysOnTop = false;

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

  const template = [
    {
      label: "Show",
      click: () => showWindow()
    },
    {
      label: "Settings",
      click: () => sendShowSettings()
    },
    { type: "separator" },
    {
      label: "Always On Top",
      type: "checkbox",
      checked: alwaysOnTop,
      click: (menuItem) => {
        alwaysOnTop = menuItem.checked;
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(alwaysOnTop, "floating");
          mainWindow.webContents.send("always-on-top-updated", alwaysOnTop);
        }
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
  ];

  tray.setContextMenu(Menu.buildFromTemplate(template));
  tray.setToolTip("Pixel Aquarium");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 640,
    minHeight: 360,
    frame: false,
    titleBarStyle: "hiddenInset",
    titleBarOverlay: false,
    backgroundColor: "#030816",
    resizable: true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));

  mainWindow.once("ready-to-show", () => {
    showWindow();
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    hideWindow();
  });

  mainWindow.on("minimize", (event) => {
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

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(alwaysOnTop, "floating");
    mainWindow.webContents.send("always-on-top-updated", alwaysOnTop);
  }

  updateTrayMenu();
  return { alwaysOnTop };
});

app.whenReady().then(() => {
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
});

app.on("window-all-closed", (event) => {
  if (!isQuitting) {
    event.preventDefault();
  }
});
