import { PRESETS, SPECIES, SPECIES_ORDER, applyPresetToSettings, cloneSettings, createDefaultSettings, normalizeSettings } from "../shared/species.js";
import { formatMultiplier } from "./utils.js";

const STORAGE_KEY = "pixel-aquarium.custom-presets";

export default class SettingsPanel {
  constructor({ root, onSettingsChange, onHost, onJoin, onDisconnect, onChat }) {
    this.root = root;
    this.onSettingsChange = onSettingsChange;
    this.onHost = onHost;
    this.onJoin = onJoin;
    this.onDisconnect = onDisconnect;
    this.onChat = onChat;
    this.settings = createDefaultSettings();
    this.speciesControls = new Map();
    this.cachedPresets = this.readCustomPresets();

    this.bindDom();
    this.renderSpeciesRoster();
    this.renderPresetOptions();
    this.setSettings(this.settings, { silent: true });
  }

  bindDom() {
    this.generalControls = {
      theme: this.root.querySelector("#theme"),
      bubbleDensity: this.root.querySelector("#bubble-density"),
      bubbleDensityValue: this.root.querySelector("#bubble-density-value"),
      cycleSpeed: this.root.querySelector("#cycle-speed"),
      cycleSpeedValue: this.root.querySelector("#cycle-speed-value"),
      alwaysOnTop: this.root.querySelector("#always-on-top"),
      totalCap: this.root.querySelector("#total-cap"),
      totalCapValue: this.root.querySelector("#total-cap-value"),
      balancedAuto: this.root.querySelector("#balanced-auto"),
      preset: this.root.querySelector("#preset-select"),
      presetName: this.root.querySelector("#preset-name"),
      presetSave: this.root.querySelector("#preset-save"),
      presetLoad: this.root.querySelector("#preset-load"),
      presetLoadSelect: this.root.querySelector("#preset-load-select")
    };

    this.connectionControls = {
      username: this.root.querySelector("#player-name"),
      hostButton: this.root.querySelector("#host-aquarium"),
      joinTarget: this.root.querySelector("#join-target"),
      roomCode: this.root.querySelector("#room-code"),
      joinButton: this.root.querySelector("#join-aquarium"),
      disconnectButton: this.root.querySelector("#disconnect-aquarium"),
      roomInfo: this.root.querySelector("#room-info"),
      usersList: this.root.querySelector("#users-list"),
      chatInput: this.root.querySelector("#chat-input"),
      chatButton: this.root.querySelector("#chat-send")
    };

    this.generalControls.bubbleDensity.addEventListener("input", () => {
      this.settings.bubbleDensity = Number(this.generalControls.bubbleDensity.value) / 100;
      this.emitSettings();
    });

    this.generalControls.cycleSpeed.addEventListener("input", () => {
      this.settings.cycleSpeed = Number(this.generalControls.cycleSpeed.value) / 100;
      this.emitSettings();
    });

    this.generalControls.totalCap.addEventListener("input", () => {
      this.settings.totalCap = Number(this.generalControls.totalCap.value);
      this.emitSettings();
    });

    this.generalControls.theme.addEventListener("change", () => {
      this.settings.theme = this.generalControls.theme.value;
      this.emitSettings();
    });

    this.generalControls.alwaysOnTop.addEventListener("change", () => {
      this.settings.alwaysOnTop = this.generalControls.alwaysOnTop.checked;
      this.emitSettings();
    });

    this.generalControls.balancedAuto.addEventListener("change", () => {
      this.settings.balancedAuto = this.generalControls.balancedAuto.checked;
      if (this.settings.balancedAuto) {
        this.settings = applyPresetToSettings(this.settings.preset, this.settings);
      }
      this.emitSettings();
      this.refreshSpeciesControls();
    });

    this.generalControls.preset.addEventListener("change", () => {
      this.settings = applyPresetToSettings(this.generalControls.preset.value, this.settings);
      this.emitSettings();
      this.refreshSpeciesControls();
    });

    this.generalControls.presetSave.addEventListener("click", () => {
      const name = this.generalControls.presetName.value.trim();
      if (!name) {
        return;
      }
      this.cachedPresets[name] = cloneSettings(this.settings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cachedPresets));
      this.renderPresetOptions();
    });

    this.generalControls.presetLoad.addEventListener("click", () => {
      const selected = this.generalControls.presetLoadSelect.value;
      if (!selected || !this.cachedPresets[selected]) {
        return;
      }
      this.setSettings(this.cachedPresets[selected]);
    });

    this.connectionControls.hostButton.addEventListener("click", () => {
      this.onHost?.({
        profile: this.profile(),
        settings: normalizeSettings(this.settings)
      });
    });

    this.connectionControls.joinButton.addEventListener("click", () => {
      this.onJoin?.({
        target: this.connectionControls.joinTarget.value.trim(),
        roomCode: this.connectionControls.roomCode.value.trim().toUpperCase(),
        profile: this.profile()
      });
    });

    this.connectionControls.disconnectButton.addEventListener("click", () => {
      this.onDisconnect?.();
    });

    this.connectionControls.chatButton.addEventListener("click", () => {
      const text = this.connectionControls.chatInput.value.trim();
      if (!text) {
        return;
      }
      this.onChat?.(text);
      this.connectionControls.chatInput.value = "";
    });
  }

  profile() {
    const name = this.connectionControls.username.value.trim() || "Guest";
    const hue = [...name].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360;
    return {
      name,
      color: `hsl(${hue} 82% 68%)`
    };
  }

  renderSpeciesRoster() {
    const roster = this.root.querySelector("#species-roster");
    roster.innerHTML = "";

    for (const speciesId of SPECIES_ORDER) {
      const meta = SPECIES[speciesId];
      const row = document.createElement("div");
      row.className = "species-row";
      row.innerHTML = `
        <label class="species-header">
          <span>${meta.label}</span>
          <input type="checkbox" />
        </label>
        <div class="species-meta">${meta.category}</div>
        <div class="species-count">
          <input type="range" min="0" max="${meta.maxCount}" value="${meta.defaultCount}" />
          <span class="species-count-value">${meta.defaultCount}</span>
        </div>
      `;

      const checkbox = row.querySelector('input[type="checkbox"]');
      const slider = row.querySelector('input[type="range"]');
      const value = row.querySelector(".species-count-value");

      checkbox.addEventListener("change", () => {
        this.settings.species[speciesId].enabled = checkbox.checked;
        this.emitSettings();
      });

      slider.addEventListener("input", () => {
        this.settings.species[speciesId].count = Number(slider.value);
        this.settings.species[speciesId].enabled = Number(slider.value) > 0;
        checkbox.checked = this.settings.species[speciesId].enabled;
        value.textContent = slider.value;
        this.emitSettings();
      });

      roster.appendChild(row);
      this.speciesControls.set(speciesId, {
        checkbox,
        slider,
        value
      });
    }
  }

  renderPresetOptions() {
    this.generalControls.preset.innerHTML = Object.values(PRESETS)
      .map((preset) => `<option value="${preset.id}">${preset.label}</option>`)
      .join("");

    this.generalControls.presetLoadSelect.innerHTML = Object.keys(this.cachedPresets)
      .map((presetName) => `<option value="${presetName}">${presetName}</option>`)
      .join("");
  }

  readCustomPresets() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  refreshSpeciesControls() {
    for (const speciesId of SPECIES_ORDER) {
      const controls = this.speciesControls.get(speciesId);
      const data = this.settings.species[speciesId];
      controls.checkbox.checked = data.enabled;
      controls.slider.value = String(data.count);
      controls.value.textContent = String(data.count);
      controls.slider.disabled = this.settings.balancedAuto && !data.enabled;
    }
  }

  emitSettings() {
    this.settings = normalizeSettings(this.settings);
    this.generalControls.bubbleDensityValue.textContent = formatMultiplier(this.settings.bubbleDensity);
    this.generalControls.cycleSpeedValue.textContent = formatMultiplier(this.settings.cycleSpeed);
    this.generalControls.totalCapValue.textContent = String(this.settings.totalCap);
    this.refreshSpeciesControls();
    this.onSettingsChange?.(normalizeSettings(this.settings));
  }

  setSettings(settings, { silent = false } = {}) {
    this.settings = normalizeSettings(settings);
    this.generalControls.theme.value = this.settings.theme;
    this.generalControls.bubbleDensity.value = String(Math.round(this.settings.bubbleDensity * 100));
    this.generalControls.cycleSpeed.value = String(Math.round(this.settings.cycleSpeed * 100));
    this.generalControls.alwaysOnTop.checked = this.settings.alwaysOnTop;
    this.generalControls.totalCap.value = String(this.settings.totalCap);
    this.generalControls.balancedAuto.checked = this.settings.balancedAuto;
    this.generalControls.preset.value = this.settings.preset;
    this.refreshSpeciesControls();

    if (!silent) {
      this.emitSettings();
    } else {
      this.generalControls.bubbleDensityValue.textContent = formatMultiplier(this.settings.bubbleDensity);
      this.generalControls.cycleSpeedValue.textContent = formatMultiplier(this.settings.cycleSpeed);
      this.generalControls.totalCapValue.textContent = String(this.settings.totalCap);
    }
  }

  updateConnection(state) {
    this.connectionControls.roomInfo.textContent = state.connected
      ? `${state.mode.toUpperCase()} · room ${state.roomCode || "REMOTE"}${state.localAddress ? ` · ${state.localAddress}` : ""}`
      : "Disconnected";

    this.connectionControls.usersList.innerHTML = (state.users || [])
      .map((user) => `<li><span class="user-chip" style="background:${user.color}"></span>${user.name}</li>`)
      .join("");

    const locked = state.connected && !state.isHost && state.mode !== "local";
    this.root.querySelector("#host-only-note").textContent = locked
      ? "Connected as guest. Ecosystem controls are host-owned."
      : state.mode === "local"
        ? "Local simulation active."
        : "You are controlling the shared aquarium.";

    this.generalControls.preset.disabled = locked;
    this.generalControls.balancedAuto.disabled = locked;
    this.generalControls.totalCap.disabled = locked;

    for (const controls of this.speciesControls.values()) {
      controls.checkbox.disabled = locked;
      controls.slider.disabled = locked;
    }
  }
}
