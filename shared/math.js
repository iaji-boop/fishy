export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

export function pick(items) {
  return items[randInt(0, items.length - 1)];
}

export function chance(probability) {
  return Math.random() < probability;
}

export function normalizeVector(x, y) {
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

export function limitVector(x, y, max) {
  const length = Math.hypot(x, y);
  if (length <= max || length === 0) {
    return { x, y };
  }

  return {
    x: (x / length) * max,
    y: (y / length) * max
  };
}

export function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

export function wrap(value, min, max) {
  const range = max - min;
  if (range <= 0) {
    return min;
  }
  return ((((value - min) % range) + range) % range) + min;
}

export function seeded(seed, offset = 0) {
  const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
