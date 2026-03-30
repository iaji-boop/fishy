import { clamp, hsl, lerp, randRange, smoothstep } from "./utils.js";

export const THEMES = {
  ocean: {
    id: "ocean",
    label: "Ocean Blue",
    topHue: 200,
    topSat: 82,
    topLight: 61,
    bottomHue: 220,
    bottomSat: 72,
    bottomLight: 14,
    sandHue: 40,
    sandSat: 42,
    sandLight: 62,
    plantHue: 156,
    coralHue: 18
  },
  reef: {
    id: "reef",
    label: "Coral Reef",
    topHue: 191,
    topSat: 82,
    topLight: 66,
    bottomHue: 211,
    bottomSat: 60,
    bottomLight: 18,
    sandHue: 30,
    sandSat: 60,
    sandLight: 67,
    plantHue: 146,
    coralHue: 348
  },
  abyss: {
    id: "abyss",
    label: "Deep Abyss",
    topHue: 212,
    topSat: 58,
    topLight: 25,
    bottomHue: 232,
    bottomSat: 48,
    bottomLight: 8,
    sandHue: 221,
    sandSat: 20,
    sandLight: 30,
    plantHue: 170,
    coralHue: 275
  }
};

export default class Background {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.cycle = 0.08;
    this.daylight = 1;
    this.nightAmount = 0;
    this.theme = THEMES.ocean;
    this.chestTimer = 0;
    this.chestPulse = 0;

    this.seaweed = Array.from({ length: 13 }, (_, index) => ({
      x: 18 + index * 23 + randRange(-6, 6),
      height: randRange(18, 42),
      phase: randRange(0, Math.PI * 2)
    }));

    this.corals = Array.from({ length: 10 }, (_, index) => ({
      x: 22 + index * 30 + randRange(-5, 5),
      base: randRange(118, 148),
      width: randRange(12, 24),
      height: randRange(8, 16),
      hueShift: randRange(-12, 18)
    }));

    this.rocks = Array.from({ length: 9 }, (_, index) => ({
      x: 12 + index * 34 + randRange(-7, 7),
      y: 148 + randRange(-2, 4),
      width: randRange(10, 18),
      height: randRange(5, 10)
    }));

    this.shells = Array.from({ length: 14 }, () => ({
      x: randRange(10, width - 12),
      y: randRange(154, 171),
      size: randRange(2, 5),
      hueShift: randRange(-8, 10)
    }));

    this.pebbles = Array.from({ length: 26 }, () => ({
      x: randRange(0, width),
      y: randRange(154, 177),
      size: randRange(1, 3)
    }));
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  setTheme(themeId) {
    this.theme = THEMES[themeId] || THEMES.ocean;
  }

  update(deltaTime, cycleSpeed) {
    this.time += deltaTime;
    this.cycle = (this.cycle + (deltaTime * cycleSpeed) / 300) % 1;

    const daylightWave = (Math.sin(this.cycle * Math.PI * 2 - Math.PI / 2) + 1) * 0.5;
    this.daylight = clamp(daylightWave, 0, 1);
    this.nightAmount = smoothstep(0.55, 0.02, this.daylight);

    this.chestTimer += deltaTime;
    this.chestPulse = Math.max(0, this.chestPulse - deltaTime * 0.55);

    if (this.chestTimer >= 14) {
      this.chestTimer = 0;
      this.chestPulse = 1;
      return {
        x: this.width * 0.76,
        y: this.height - 24,
        count: 9 + Math.round(Math.random() * 4)
      };
    }

    return null;
  }

  isNight() {
    return this.daylight < 0.28;
  }

  render(ctx) {
    this.renderWater(ctx);
    this.renderLightRays(ctx);
    this.renderBackdropLife(ctx);
    this.renderSeafloor(ctx);
  }

  renderWater(ctx) {
    const theme = this.theme;
    const topLight = lerp(theme.topLight - 14, theme.topLight, this.daylight);
    const bottomLight = lerp(theme.bottomLight - 3, theme.bottomLight, this.daylight);

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, hsl(theme.topHue, theme.topSat, topLight));
    gradient.addColorStop(0.5, hsl(theme.topHue + 9, theme.topSat - 12, lerp(topLight - 8, topLight + 4, this.daylight)));
    gradient.addColorStop(1, hsl(theme.bottomHue, theme.bottomSat, bottomLight));

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalAlpha = 0.08 + this.daylight * 0.04;
    ctx.fillStyle = hsl(190, 85, 95, 0.15);
    for (let i = 0; i < 6; i += 1) {
      const y = 20 + i * 18 + Math.sin(this.time * 0.35 + i) * 1.8;
      ctx.fillRect(0, y, this.width, 1);
    }
    ctx.restore();
  }

  renderLightRays(ctx) {
    ctx.save();
    ctx.globalAlpha = lerp(0.05, 0.16, this.daylight);
    ctx.fillStyle = hsl(195, 90, 98, 0.22);

    for (let i = -1; i < 5; i += 1) {
      const x = 28 + i * 68 + Math.sin(this.time * 0.1 + i * 1.3) * 6;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 24, 0);
      ctx.lineTo(x - 12, this.height);
      ctx.lineTo(x - 36, this.height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  renderBackdropLife(ctx) {
    const swayTime = this.time * 1.2;
    const theme = this.theme;

    for (const coral of this.corals) {
      const hue = theme.coralHue + coral.hueShift;
      const coralLight = lerp(24, 54, this.daylight);
      ctx.fillStyle = hsl(hue, 56, coralLight, 0.65);

      const wobble = Math.sin(swayTime * 0.6 + coral.x * 0.09) * 2;
      ctx.fillRect(coral.x + wobble, coral.base, coral.width, coral.height);
      ctx.fillRect(coral.x + wobble + 3, coral.base - 4, coral.width - 8, 4);
      ctx.fillRect(coral.x + wobble + coral.width / 2 - 1, coral.base - 8, 3, 6);
    }

    ctx.fillStyle = hsl(theme.bottomHue + 8, 18, lerp(20, 28, this.daylight), 0.65);
    for (const rock of this.rocks) {
      ctx.fillRect(rock.x, rock.y, rock.width, rock.height);
      ctx.fillRect(rock.x + 2, rock.y - 2, rock.width - 4, 2);
    }

    for (const stalk of this.seaweed) {
      this.renderSeaweed(ctx, stalk, theme.plantHue);
    }
  }

  renderSeaweed(ctx, stalk, hue) {
    const rootY = this.height - 28;
    ctx.fillStyle = hsl(hue, 45, lerp(16, 38, this.daylight), 0.8);

    for (let segment = 0; segment < stalk.height; segment += 2) {
      const wave = Math.sin(this.time * 1.1 + stalk.phase + segment * 0.18) * (segment / stalk.height) * 4;
      const x = stalk.x + wave;
      const y = rootY - segment;
      ctx.fillRect(x, y, 2, 2);
      if (segment > 8 && segment % 6 === 0) {
        ctx.fillRect(x + 2, y - 1, 2, 1);
      }
    }
  }

  renderSeafloor(ctx) {
    const theme = this.theme;
    const floorY = this.height - 24;

    ctx.fillStyle = hsl(theme.sandHue, theme.sandSat, lerp(theme.sandLight - 10, theme.sandLight, this.daylight));
    ctx.fillRect(0, floorY, this.width, this.height - floorY);

    ctx.fillStyle = hsl(theme.sandHue - 4, theme.sandSat - 8, lerp(theme.sandLight - 18, theme.sandLight - 6, this.daylight));
    for (let x = 0; x < this.width; x += 4) {
      const bump = Math.sin(x * 0.14 + this.time * 0.15) > 0.3 ? 1 : 0;
      ctx.fillRect(x, floorY - bump, 4, 1 + bump);
    }

    ctx.fillStyle = hsl(theme.sandHue - 6, theme.sandSat - 12, lerp(theme.sandLight - 22, theme.sandLight - 8, this.daylight));
    for (const pebble of this.pebbles) {
      ctx.fillRect(pebble.x, pebble.y, pebble.size, pebble.size);
    }

    for (const shell of this.shells) {
      ctx.fillStyle = hsl(theme.sandHue + shell.hueShift, 40, lerp(70, 84, this.daylight));
      ctx.fillRect(shell.x, shell.y, shell.size, shell.size - 1);
      ctx.fillStyle = hsl(theme.sandHue - 8, 28, lerp(44, 56, this.daylight));
      ctx.fillRect(shell.x + 1, shell.y + shell.size - 1, Math.max(1, shell.size - 1), 1);
    }

    this.renderChest(ctx, floorY);
  }

  renderChest(ctx, floorY) {
    const x = this.width * 0.76;
    const y = floorY - 11;
    const lidLift = Math.round(Math.sin(this.chestPulse * Math.PI) * 4);

    ctx.fillStyle = hsl(24, 58, 26);
    ctx.fillRect(x, y + 4, 13, 8);
    ctx.fillStyle = hsl(31, 72, 42);
    ctx.fillRect(x, y + 3, 13, 3);
    ctx.fillStyle = hsl(26, 76, 46);
    ctx.fillRect(x, y - lidLift, 13, 4);
    ctx.fillStyle = hsl(40, 86, 70);
    ctx.fillRect(x + 5, y + 3, 2, 9);
  }
}
