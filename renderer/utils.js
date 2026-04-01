export const TAU = Math.PI * 2;

export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  sub(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  scale(value) {
    this.x *= value;
    this.y *= value;
    return this;
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  normalize() {
    const len = this.length();
    if (len > 0.0001) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  limit(max) {
    const len = this.length();
    if (len > max && len > 0) {
      this.scale(max / len);
    }
    return this;
  }

  lerp(vector, alpha) {
    this.x += (vector.x - this.x) * alpha;
    this.y += (vector.y - this.y) * alpha;
    return this;
  }

  static fromAngle(angle, magnitude = 1) {
    return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
  }
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
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

export function signOrOne(value) {
  return value === 0 ? 1 : Math.sign(value);
}

export function angleBetween(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}
