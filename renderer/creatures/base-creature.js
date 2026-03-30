import { clamp, lerp, seeded } from "../../shared/math.js";
import { SPECIES } from "../../shared/species.js";
import { hsl } from "../utils.js";

export function withDirection(ctx, direction, draw) {
  ctx.save();
  ctx.scale(direction >= 0 ? 1 : -1, 1);
  draw();
  ctx.restore();
}

export default class BaseCreatureRenderer {
  constructor(snapshot) {
    this.display = {
      x: snapshot.x,
      y: snapshot.y,
      angle: snapshot.angle,
      direction: snapshot.direction || (snapshot.vx >= 0 ? 1 : -1),
      pulse: snapshot.pulse || 0,
      glow: snapshot.glow || 0,
      lure: snapshot.lure || 0,
      segments: snapshot.segments?.map((segment) => ({ ...segment })) || null
    };
    this.sync(snapshot, true);
  }

  sync(snapshot, immediate = false) {
    this.snapshot = snapshot;
    if (immediate) {
      this.display.x = snapshot.x;
      this.display.y = snapshot.y;
      this.display.angle = snapshot.angle;
      this.display.direction = snapshot.direction || (snapshot.vx >= 0 ? 1 : -1);
      this.display.pulse = snapshot.pulse || 0;
      this.display.glow = snapshot.glow || 0;
      this.display.lure = snapshot.lure || 0;
      this.display.segments = snapshot.segments?.map((segment) => ({ ...segment })) || null;
    }
  }

  update(deltaTime) {
    const alpha = clamp(deltaTime * 9, 0.08, 0.32);
    this.display.x = lerp(this.display.x, this.snapshot.x, alpha);
    this.display.y = lerp(this.display.y, this.snapshot.y, alpha);
    this.display.angle = lerp(this.display.angle, this.snapshot.angle, alpha);
    this.display.direction = this.snapshot.direction || (this.snapshot.vx >= 0 ? 1 : -1);
    this.display.pulse = lerp(this.display.pulse, this.snapshot.pulse || 0, alpha);
    this.display.glow = lerp(this.display.glow, this.snapshot.glow || 0, alpha);
    this.display.lure = lerp(this.display.lure, this.snapshot.lure || 0, alpha);

    if (this.snapshot.segments?.length) {
      this.display.segments = this.display.segments || this.snapshot.segments.map((segment) => ({ ...segment }));
      this.snapshot.segments.forEach((segment, index) => {
        this.display.segments[index].x = lerp(this.display.segments[index].x, segment.x, alpha);
        this.display.segments[index].y = lerp(this.display.segments[index].y, segment.y, alpha);
      });
    }
  }

  meta() {
    return SPECIES[this.snapshot.species];
  }

  scale() {
    return this.snapshot.scale || this.meta().sizeScale || 1;
  }

  palette(baseHue) {
    const seed = this.snapshot.seed;
    return {
      outline: hsl(baseHue + seeded(seed, 1) * 12, 18, 14),
      body: hsl(baseHue, 62, 56),
      shade: hsl(baseHue + 6, 46, 32),
      accent: hsl(baseHue + 28 + seeded(seed, 2) * 30, 78, 64),
      glow: hsl(baseHue + 18, 88, 80, 0.5),
      pale: hsl(baseHue + 4, 44, 78)
    };
  }

  drawShadow(ctx, width, height, alpha = 0.18) {
    ctx.fillStyle = hsl(218, 38, 7, alpha);
    ctx.fillRect(-width * 0.4, height * 0.45, width * 0.8, 2);
  }

  drawSegmentTrail(ctx, segments, color, size = 2) {
    ctx.fillStyle = color;
    segments.forEach((segment, index) => {
      const shrink = Math.max(1, size - index * 0.1);
      ctx.fillRect(segment.x - this.display.x - shrink * 0.5, segment.y - this.display.y - shrink * 0.5, shrink, shrink);
    });
  }

  render(ctx, time, environment) {
    this.update(environment.deltaTime);
    ctx.save();
    ctx.translate(this.display.x, this.display.y);
    this.draw(ctx, time, environment);
    ctx.restore();
  }

  draw(_ctx, _time, _environment) {}
}
