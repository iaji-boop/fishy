import Aquarium from "./aquarium.js";

const aquarium = new Aquarium({
  canvas: document.getElementById("aquarium"),
  tooltipEl: document.getElementById("tooltip"),
  settingsHost: document.getElementById("settings-host"),
  settingsPanelEl: document.getElementById("settings-panel"),
  toastEl: document.getElementById("toast-stack"),
  controls: {
    gearButton: document.getElementById("gear-button")
  },
  electronAPI: window.electronAPI
});

aquarium.start();
