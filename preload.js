const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getWindowState: () => ipcRenderer.invoke("get-window-state"),
  setAlwaysOnTop: (value) => ipcRenderer.invoke("set-always-on-top", value),
  onShowSettings: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("show-settings", listener);
    return () => ipcRenderer.removeListener("show-settings", listener);
  },
  onAlwaysOnTopUpdated: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("always-on-top-updated", listener);
    return () => ipcRenderer.removeListener("always-on-top-updated", listener);
  }
});
