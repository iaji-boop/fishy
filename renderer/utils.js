import {
  TAU,
  chance,
  clamp,
  distance,
  lerp,
  pick,
  randInt,
  randRange,
  seeded,
  smoothstep
} from "../shared/math.js";

export { TAU, chance, clamp, distance, lerp, pick, randInt, randRange, seeded, smoothstep };

export function hsl(h, s, l, alpha = 1) {
  const hue = ((h % 360) + 360) % 360;
  if (alpha >= 1) {
    return `hsl(${hue} ${s}% ${l}%)`;
  }
  return `hsl(${hue} ${s}% ${l}% / ${alpha})`;
}

export function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function formatMultiplier(value) {
  return `${value.toFixed(1)}x`;
}

export function seedHue(seed, base, spread = 22) {
  return base + (seeded(seed, 1) - 0.5) * spread;
}
