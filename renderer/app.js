import Aquarium from "./aquarium.js";

const aquarium = new Aquarium({
  canvas: document.getElementById("aquarium"),
  tooltipEl: document.getElementById("tooltip"),
  settingsHost: document.getElementById("settings-host"),
  controls: {
    gearButton: document.getElementById("gear-button"),
    fishCount: document.getElementById("fish-count"),
    fishCountValue: document.getElementById("fish-count-value"),
    bubbleDensity: document.getElementById("bubble-density"),
    bubbleDensityValue: document.getElementById("bubble-density-value"),
    cycleSpeed: document.getElementById("cycle-speed"),
    cycleSpeedValue: document.getElementById("cycle-speed-value"),
    alwaysOnTop: document.getElementById("always-on-top"),
    theme: document.getElementById("theme"),
    scoreValue: document.getElementById("score-value"),
    comboValue: document.getElementById("combo-value"),
    comboCard: document.getElementById("combo-card"),
    comboDetail: document.getElementById("combo-detail")
  },
  electronAPI: window.electronAPI
});

aquarium.start();
