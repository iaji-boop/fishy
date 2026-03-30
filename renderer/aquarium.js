import { BASE_HEIGHT, BASE_WIDTH, createDefaultSettings } from "../shared/species.js";
import Background from "./background.js";
import { createCreatureRenderer } from "./creatures/index.js";
import ChatOverlay from "./multiplayer/chat.js";
import CursorSyncRenderer from "./multiplayer/cursor-sync.js";
import AquariumMultiplayerClient from "./multiplayer/client.js";
import ParticleSystem from "./particles.js";
import SettingsPanel from "./settings.js";
import { clamp, createCanvas, randInt } from "./utils.js";

export default class Aquarium {
  constructor({ canvas, tooltipEl, settingsHost, settingsPanelEl, toastEl, controls, electronAPI }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.offscreen = createCanvas(BASE_WIDTH, BASE_HEIGHT);
    this.offscreenCtx = this.offscreen.getContext("2d");
    this.tooltipEl = tooltipEl;
    this.settingsHost = settingsHost;
    this.electronAPI = electronAPI;
    this.background = new Background(BASE_WIDTH, BASE_HEIGHT);
    this.particles = new ParticleSystem(BASE_WIDTH, BASE_HEIGHT);
    this.cursorSync = new CursorSyncRenderer();
    this.chatOverlay = new ChatOverlay(toastEl);
    this.creatureRenderers = new Map();
    this.snapshot = null;
    this.connectionState = {
      users: [],
      selfId: "local-player",
      connected: true,
      mode: "local",
      isHost: true
    };
    this.currentSettings = createDefaultSettings();
    this.hoveredCreature = null;
    this.lastTap = { time: 0, x: 0, y: 0 };
    this.time = 0;
    this.frameDelta = 1 / 60;
    this.lastFrameTime = 0;
    this.viewport = {
      x: 0,
      y: 0,
      width: BASE_WIDTH,
      height: BASE_HEIGHT,
      cssX: 0,
      cssY: 0,
      cssWidth: BASE_WIDTH,
      cssHeight: BASE_HEIGHT
    };

    this.settingsPanel = new SettingsPanel({
      root: settingsPanelEl,
      onSettingsChange: (settings) => this.applySettings(settings),
      onHost: ({ profile, settings }) => this.hostAquarium(profile, settings),
      onJoin: ({ target, roomCode, profile }) => this.joinAquarium(target, roomCode, profile),
      onDisconnect: () => this.disconnectAquarium(),
      onChat: (text) => this.client.sendChat(text)
    });

    this.client = new AquariumMultiplayerClient({
      electronAPI,
      onSnapshot: (snapshot) => this.handleSnapshot(snapshot),
      onStateChange: (state) => this.handleConnectionState(state),
      onToast: (message) => this.chatOverlay.pushToast(message)
    });

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);

    document.body.dataset.platform = this.electronAPI?.hostAquarium ? "desktop" : "web";
    controls.gearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.settingsHost.classList.toggle("open");
    });
    document.addEventListener("pointerdown", (event) => {
      if (!this.settingsHost.contains(event.target)) {
        this.settingsHost.classList.remove("open");
      }
    });
  }

  start() {
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerleave", this.handlePointerLeave);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);

    const profile = this.settingsPanel.profile();
    this.client.startLocal(this.currentSettings, profile);
    requestAnimationFrame(this.loop);
  }

  applySettings(settings) {
    this.currentSettings = settings;
    this.background.setTheme(settings.theme);
    this.client.updateSettings(settings);
    this.electronAPI?.setAlwaysOnTop?.(settings.alwaysOnTop);
  }

  async hostAquarium(profile, settings) {
    await this.client.hostElectron(settings, profile);
  }

  async joinAquarium(target, roomCode, profile) {
    if (!target) {
      this.chatOverlay.pushToast("Enter an IP:port or ws:// URL to join.");
      return;
    }
    await this.client.joinRemote(target, roomCode, profile);
  }

  disconnectAquarium() {
    this.client.disconnect();
    this.client.startLocal(this.currentSettings, this.settingsPanel.profile());
  }

  handleConnectionState(state) {
    this.connectionState = {
      ...this.connectionState,
      ...state
    };

    if (state.syncedSettings) {
      this.currentSettings = state.syncedSettings;
      this.settingsPanel.setSettings(state.syncedSettings, { silent: true });
    }

    this.settingsPanel.updateConnection(this.connectionState);
    this.electronAPI?.setDockBadge?.(String(state.users?.length || 0));
  }

  handleSnapshot(snapshot) {
    this.snapshot = snapshot;
    this.currentSettings = snapshot.settings;
    this.background.setTheme(snapshot.settings.theme);
    this.syncRenderers(snapshot.entities);
    this.connectionState.users = snapshot.players;
    this.settingsPanel.updateConnection(this.connectionState);
  }

  syncRenderers(entities) {
    const active = new Set(entities.map((entity) => entity.id));
    for (const entity of entities) {
      if (!this.creatureRenderers.has(entity.id)) {
        this.creatureRenderers.set(entity.id, createCreatureRenderer(entity));
      }
      this.creatureRenderers.get(entity.id).sync(entity);
    }

    for (const [id] of this.creatureRenderers) {
      if (!active.has(id)) {
        this.creatureRenderers.delete(id);
      }
    }
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.imageSmoothingEnabled = false;

    const rawScale = Math.min(this.canvas.width / BASE_WIDTH, this.canvas.height / BASE_HEIGHT);
    const scale = rawScale >= 1 ? Math.floor(rawScale) : rawScale;
    const width = BASE_WIDTH * scale;
    const height = BASE_HEIGHT * scale;
    const x = Math.floor((this.canvas.width - width) * 0.5);
    const y = Math.floor((this.canvas.height - height) * 0.5);

    this.viewport = {
      x,
      y,
      width,
      height,
      cssX: x / dpr,
      cssY: y / dpr,
      cssWidth: width / dpr,
      cssHeight: height / dpr
    };
  }

  toWorldCoordinates(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const localX = clientX - rect.left - this.viewport.cssX;
    const localY = clientY - rect.top - this.viewport.cssY;
    const inside = localX >= 0 && localY >= 0 && localX <= this.viewport.cssWidth && localY <= this.viewport.cssHeight;

    return {
      x: clamp(localX / this.viewport.cssWidth, 0, 1) * BASE_WIDTH,
      y: clamp(localY / this.viewport.cssHeight, 0, 1) * BASE_HEIGHT,
      inside
    };
  }

  handlePointerMove(event) {
    const world = this.toWorldCoordinates(event.clientX, event.clientY);
    this.client.updateCursor({
      x: world.x,
      y: world.y,
      inside: world.inside
    });
    this.hoveredCreature = world.inside ? this.findHoveredCreature(world.x, world.y) : null;
    this.updateTooltip();
  }

  handlePointerLeave() {
    this.client.updateCursor({
      x: BASE_WIDTH * 0.5,
      y: BASE_HEIGHT * 0.5,
      inside: false
    });
    this.hoveredCreature = null;
    this.tooltipEl.classList.remove("visible");
  }

  handlePointerUp(event) {
    const world = this.toWorldCoordinates(event.clientX, event.clientY);
    if (!world.inside) {
      return;
    }

    this.client.tap(world.x, world.y);

    const now = performance.now();
    const isDoubleTap = now - this.lastTap.time < 320 && Math.hypot(world.x - this.lastTap.x, world.y - this.lastTap.y) < 18;
    if (isDoubleTap) {
      this.client.feed(world.x, world.y);
      this.lastTap.time = 0;
      return;
    }

    this.lastTap = {
      time: now,
      x: world.x,
      y: world.y
    };
  }

  findHoveredCreature(x, y) {
    if (!this.snapshot?.entities?.length) {
      return null;
    }

    return this.snapshot.entities.find((entity) => {
      const radius = 6 * (entity.scale || 1);
      return Math.hypot(entity.x - x, entity.y - y) < radius;
    }) || null;
  }

  updateTooltip() {
    if (!this.hoveredCreature) {
      this.tooltipEl.classList.remove("visible");
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.tooltipEl.textContent = this.hoveredCreature.name;
    this.tooltipEl.style.left = `${rect.left + this.viewport.cssX + (this.hoveredCreature.x / BASE_WIDTH) * this.viewport.cssWidth}px`;
    this.tooltipEl.style.top = `${rect.top + this.viewport.cssY + ((this.hoveredCreature.y - 10) / BASE_HEIGHT) * this.viewport.cssHeight}px`;
    this.tooltipEl.classList.add("visible");
  }

  loop(timestamp) {
    const timeSeconds = timestamp / 1000;
    let deltaTime = this.lastFrameTime ? timeSeconds - this.lastFrameTime : 1 / 60;
    this.lastFrameTime = timeSeconds;
    deltaTime = clamp(deltaTime, 1 / 120, 1 / 24);
    this.frameDelta = deltaTime;
    this.time += deltaTime;

    const cycle = this.snapshot?.cycle ?? this.background.cycle;
    const cycleSpeed = this.snapshot?.settings?.cycleSpeed ?? this.currentSettings.cycleSpeed;
    this.background.update(deltaTime, cycleSpeed, cycle);
    this.particles.setBubbleDensity(this.currentSettings.bubbleDensity);
    this.particles.update(deltaTime, BASE_HEIGHT - 24);
    this.render();

    requestAnimationFrame(this.loop);
  }

  renderSharedEffects(ctx) {
    if (!this.snapshot) {
      return;
    }

    for (const food of this.snapshot.food) {
      ctx.fillStyle = "#e9d07f";
      ctx.fillRect(food.x, food.y, 2, 2);
      ctx.fillStyle = "#956626";
      ctx.fillRect(food.x, food.y + 2, 2, 1);
    }

    for (const effect of this.snapshot.effects) {
      if (effect.type === "ripple" || effect.type === "zap") {
        ctx.save();
        ctx.globalAlpha = effect.type === "zap" ? 0.7 : 0.6;
        ctx.strokeStyle = effect.color || "#bcefff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (effect.type === "ink") {
        ctx.fillStyle = "rgba(14, 16, 28, 0.55)";
        ctx.fillRect(effect.x - effect.radius, effect.y - effect.radius * 0.6, effect.radius * 2, effect.radius * 1.3);
      }
    }
  }

  render() {
    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.imageSmoothingEnabled = false;

    let shakeX = 0;
    let shakeY = 0;
    if (this.snapshot?.effects?.some((effect) => effect.type === "shake" && effect.ttl > 0)) {
      shakeX = randInt(-2, 2);
      shakeY = randInt(-1, 1);
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);
    this.background.render(ctx);
    this.particles.renderAmbient(ctx);
    this.renderSharedEffects(ctx);

    for (const entity of this.snapshot?.entities || []) {
      this.creatureRenderers.get(entity.id)?.render(ctx, this.time, {
        deltaTime: this.frameDelta,
        hovered: this.hoveredCreature?.id === entity.id
      });
    }

    this.cursorSync.render(ctx, this.snapshot?.players || [], this.connectionState.selfId);
    this.chatOverlay.renderBubbles(ctx, this.snapshot?.players || [], this.connectionState.selfId, this.snapshot?.time || 0);
    ctx.restore();

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.offscreen, this.viewport.x, this.viewport.y, this.viewport.width, this.viewport.height);
  }
}
