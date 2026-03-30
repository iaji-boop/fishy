import Background from "./background.js";
import Fish from "./fish.js";
import ParticleSystem from "./particles.js";
import { clamp, createCanvas, formatMultiplier, randInt, randRange } from "./utils.js";

const BASE_WIDTH = 320;
const BASE_HEIGHT = 180;

export default class Aquarium {
  constructor({ canvas, tooltipEl, settingsHost, controls, electronAPI }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.offscreen = createCanvas(BASE_WIDTH, BASE_HEIGHT);
    this.offscreenCtx = this.offscreen.getContext("2d");
    this.tooltipEl = tooltipEl;
    this.settingsHost = settingsHost;
    this.controls = controls;
    this.electronAPI = electronAPI;

    this.background = new Background(BASE_WIDTH, BASE_HEIGHT);
    this.particles = new ParticleSystem(BASE_WIDTH, BASE_HEIGHT);
    this.fish = [];
    this.hoveredFish = null;

    this.time = 0;
    this.lastFrameTime = 0;
    this.animationFrame = 0;
    this.socialCooldown = 5;
    this.frameDelta = 1 / 60;

    this.mouse = {
      x: BASE_WIDTH * 0.5,
      y: BASE_HEIGHT * 0.5,
      inside: false,
      vx: 0,
      vy: 0,
      speed: 0
    };

    this.settings = {
      fishCount: 10,
      bubbleDensity: 1,
      cycleSpeed: 1,
      theme: "ocean",
      alwaysOnTop: false
    };
    this.isDesktopHost = Boolean(this.electronAPI?.getWindowState);
    this.lastTap = {
      time: 0,
      x: 0,
      y: 0
    };

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.loop = this.loop.bind(this);

    document.body.dataset.platform = this.isDesktopHost ? "desktop" : "web";
    this.bindControls();
    this.seedFish(this.settings.fishCount);
  }

  async initElectronState() {
    if (!this.isDesktopHost) {
      return;
    }

    try {
      const state = await this.electronAPI.getWindowState();
      this.settings.alwaysOnTop = Boolean(state?.alwaysOnTop);
      this.controls.alwaysOnTop.checked = this.settings.alwaysOnTop;
    } catch {
      // Ignore renderer boot failures from Electron IPC.
    }

    this.electronAPI.onShowSettings?.(() => {
      this.settingsHost.classList.add("open");
    });

    this.electronAPI.onAlwaysOnTopUpdated?.((value) => {
      this.settings.alwaysOnTop = Boolean(value);
      this.controls.alwaysOnTop.checked = this.settings.alwaysOnTop;
    });
  }

  bindControls() {
    this.controls.gearButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.settingsHost.classList.toggle("open");
    });

    document.addEventListener("pointerdown", (event) => {
      if (!this.settingsHost.contains(event.target)) {
        this.settingsHost.classList.remove("open");
      }
    });

    this.controls.fishCount.addEventListener("input", () => {
      this.settings.fishCount = Number(this.controls.fishCount.value);
      this.controls.fishCountValue.textContent = String(this.settings.fishCount);
      this.syncFishCount();
    });

    this.controls.bubbleDensity.addEventListener("input", () => {
      const density = Number(this.controls.bubbleDensity.value) / 100;
      this.settings.bubbleDensity = density;
      this.controls.bubbleDensityValue.textContent = formatMultiplier(this.settings.bubbleDensity);
      this.particles.setBubbleDensity(this.settings.bubbleDensity);
    });

    this.controls.cycleSpeed.addEventListener("input", () => {
      this.settings.cycleSpeed = Number(this.controls.cycleSpeed.value) / 100;
      this.controls.cycleSpeedValue.textContent = formatMultiplier(this.settings.cycleSpeed);
    });

    this.controls.theme.addEventListener("change", () => {
      this.settings.theme = this.controls.theme.value;
      this.background.setTheme(this.settings.theme);
    });

    this.controls.alwaysOnTop.addEventListener("change", async () => {
      this.settings.alwaysOnTop = this.controls.alwaysOnTop.checked;
      await this.electronAPI?.setAlwaysOnTop?.(this.settings.alwaysOnTop);
    });

    this.controls.fishCountValue.textContent = String(this.settings.fishCount);
    this.controls.bubbleDensityValue.textContent = formatMultiplier(this.settings.bubbleDensity);
    this.controls.cycleSpeedValue.textContent = formatMultiplier(this.settings.cycleSpeed);
    this.controls.theme.value = this.settings.theme;
  }

  start() {
    this.handleResize();
    this.initElectronState();

    window.addEventListener("resize", this.handleResize);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerleave", this.handlePointerLeave);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);

    this.animationFrame = requestAnimationFrame(this.loop);
  }

  stop() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener("resize", this.handleResize);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerleave", this.handlePointerLeave);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
  }

  seedFish(count) {
    this.fish = Array.from({ length: count }, (_, index) => {
      const x = randRange(36, BASE_WIDTH - 36);
      const y = randRange(36, BASE_HEIGHT - 46);
      return new Fish(index + 1, x, y);
    });
  }

  syncFishCount() {
    while (this.fish.length < this.settings.fishCount) {
      const fish = new Fish(
        this.fish.length + 1,
        randRange(36, BASE_WIDTH - 36),
        randRange(36, BASE_HEIGHT - 40)
      );
      this.fish.push(fish);
    }

    if (this.fish.length > this.settings.fishCount) {
      this.fish.length = this.settings.fishCount;
    }
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.imageSmoothingEnabled = false;
  }

  toWorldCoordinates(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * BASE_WIDTH,
      y: ((clientY - rect.top) / rect.height) * BASE_HEIGHT
    };
  }

  handlePointerMove(event) {
    const world = this.toWorldCoordinates(event.clientX, event.clientY);
    const dt = Math.max(0.016, this.frameDelta);

    this.mouse.vx = (world.x - this.mouse.x) / dt;
    this.mouse.vy = (world.y - this.mouse.y) / dt;
    this.mouse.speed = Math.hypot(this.mouse.vx, this.mouse.vy);
    this.mouse.x = world.x;
    this.mouse.y = world.y;
    this.mouse.inside = true;

    if (this.mouse.speed > 150) {
      this.triggerFlee(world, 54, 1.2);
    }
  }

  handlePointerLeave() {
    this.mouse.inside = false;
    this.hoveredFish = null;
    this.tooltipEl.classList.remove("visible");
  }

  handlePointerUp(event) {
    const world = this.toWorldCoordinates(event.clientX, event.clientY);
    this.particles.spawnRipple(world.x, world.y);
    this.triggerFlee(world, 64, 1.6);

    const now = performance.now();
    const isDoubleTap =
      now - this.lastTap.time < 320 &&
      Math.hypot(world.x - this.lastTap.x, world.y - this.lastTap.y) < 18;

    if (isDoubleTap) {
      this.particles.spawnFood(world.x, world.y, randInt(3, 5));
      this.lastTap.time = 0;
      return;
    }

    this.lastTap = {
      time: now,
      x: world.x,
      y: world.y
    };
  }

  triggerFlee(point, radius, duration) {
    for (const fish of this.fish) {
      const dx = fish.position.x - point.x;
      const dy = fish.position.y - point.y;
      if (Math.hypot(dx, dy) <= radius) {
        fish.triggerFlee(point, duration);
      }
    }
  }

  maybeStartSocialInteraction(deltaTime) {
    this.socialCooldown -= deltaTime;
    if (this.socialCooldown > 0 || this.fish.length < 2) {
      return;
    }

    const idleFish = this.fish.filter((fish) => fish.state === "idle" && !fish.socialMode);
    if (idleFish.length < 2) {
      return;
    }

    for (let i = 0; i < idleFish.length; i += 1) {
      const first = idleFish[i];
      for (let j = i + 1; j < idleFish.length; j += 1) {
        const second = idleFish[j];
        const dx = first.position.x - second.position.x;
        const dy = first.position.y - second.position.y;
        const d = Math.hypot(dx, dy);

        if (d > 56) {
          continue;
        }

        if (Math.random() < 0.5) {
          first.setSocial("kiss", second, 1.4);
          second.setSocial("kiss", first, 1.4);
        } else {
          first.setSocial("chase-lead", second, 2);
          second.setSocial("chase-follow", first, 2);
        }

        this.socialCooldown = randRange(7, 13);
        return;
      }
    }

    this.socialCooldown = randRange(4, 7);
  }

  updateTooltip() {
    if (!this.mouse.inside) {
      this.hoveredFish = null;
      this.tooltipEl.classList.remove("visible");
      return;
    }

    this.hoveredFish = this.fish.find((fish) => fish.containsPoint(this.mouse.x, this.mouse.y, this.time)) || null;
    if (!this.hoveredFish) {
      this.tooltipEl.classList.remove("visible");
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.tooltipEl.textContent = this.hoveredFish.name;
    this.tooltipEl.style.left = `${rect.left + (this.hoveredFish.position.x / BASE_WIDTH) * rect.width}px`;
    this.tooltipEl.style.top = `${rect.top + ((this.hoveredFish.position.y - 10) / BASE_HEIGHT) * rect.height}px`;
    this.tooltipEl.classList.add("visible");
  }

  loop(timestamp) {
    const timeSeconds = timestamp / 1000;
    let deltaTime = this.lastFrameTime ? timeSeconds - this.lastFrameTime : 1 / 60;
    this.lastFrameTime = timeSeconds;
    deltaTime = clamp(deltaTime, 1 / 120, 1 / 24);
    this.frameDelta = deltaTime;
    this.time += deltaTime;

    const chestBurst = this.background.update(deltaTime, this.settings.cycleSpeed);
    if (chestBurst) {
      this.particles.spawnBubbleBurst(chestBurst.x, chestBurst.y, chestBurst.count);
    }

    this.particles.update(deltaTime, BASE_HEIGHT - 24);
    this.maybeStartSocialInteraction(deltaTime);

    for (const fish of this.fish) {
      fish.update(deltaTime, this.fish, {
        bounds: { width: BASE_WIDTH, height: BASE_HEIGHT },
        food: this.particles.food,
        consumeFood: (foodParticle) => {
          this.particles.consumeFood(foodParticle);
          this.particles.spawnBubbleBurst(foodParticle.x, foodParticle.y, 3);
        },
        isNight: this.background.isNight(),
        mouse: this.mouse,
        time: this.time
      });
    }

    this.updateTooltip();
    this.render();
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  render() {
    const ctx = this.offscreenCtx;
    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.imageSmoothingEnabled = false;

    this.background.render(ctx);
    this.particles.renderAmbient(ctx);

    for (const fish of this.fish) {
      fish.render(ctx, this.time, fish === this.hoveredFish);
    }

    this.particles.renderRipples(ctx);

    if (this.background.isNight()) {
      ctx.fillStyle = "rgba(9, 11, 28, 0.22)";
      ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    }

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.offscreen, 0, 0, this.canvas.width, this.canvas.height);
  }
}
