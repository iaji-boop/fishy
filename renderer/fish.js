import {
  TAU,
  Vector2,
  clamp,
  createCanvas,
  distance,
  hsl,
  lerp,
  randRange,
  signOrOne,
  smoothstep
} from "./utils.js";

const BODY_MASKS = [
  [
    "................",
    "................",
    ".....######.....",
    "...##########...",
    "..############..",
    "...##########...",
    ".....######.....",
    "................",
    "................",
    "................"
  ],
  [
    "................",
    "................",
    "......#####.....",
    "...##########...",
    "..#############.",
    "...##########...",
    "......#####.....",
    "................",
    "................",
    "................"
  ],
  [
    "................",
    "................",
    ".....#######....",
    "...###########..",
    "..############..",
    "..############..",
    "...###########..",
    ".....#######....",
    "................",
    "................"
  ],
  [
    "................",
    "................",
    "......######....",
    "...###########..",
    "..#############.",
    "..#############.",
    "...###########..",
    "......######....",
    "................",
    "................"
  ]
];

const FIN_TYPES = [
  {
    dorsal: [
      [7, 1],
      [8, 0],
      [9, 1]
    ],
    ventral: [
      [7, 7],
      [8, 8],
      [9, 7]
    ]
  },
  {
    dorsal: [
      [6, 1],
      [7, 0],
      [8, 0],
      [9, 1]
    ],
    ventral: [
      [7, 7],
      [8, 7],
      [9, 8]
    ]
  },
  {
    dorsal: [
      [6, 1],
      [7, 1],
      [8, 0],
      [9, 1],
      [10, 1]
    ],
    ventral: [
      [6, 7],
      [7, 8],
      [8, 8],
      [9, 7]
    ]
  },
  {
    dorsal: [
      [8, 0],
      [9, 1],
      [10, 0]
    ],
    ventral: [
      [7, 8],
      [8, 7],
      [9, 8]
    ]
  }
];

const TAIL_TYPES = [
  {
    points: [
      [2, 4],
      [1, 3],
      [0, 2],
      [0, 5],
      [1, 6]
    ],
    wiggle: 1
  },
  {
    points: [
      [2, 4],
      [1, 2],
      [1, 6],
      [0, 1],
      [0, 7]
    ],
    wiggle: 2
  },
  {
    points: [
      [3, 4],
      [2, 3],
      [1, 2],
      [1, 6],
      [0, 4]
    ],
    wiggle: 1
  },
  {
    points: [
      [2, 4],
      [1, 3],
      [1, 5],
      [0, 2],
      [0, 6]
    ],
    wiggle: 2
  }
];

const ACCENT_PATTERNS = [
  [
    [7, 3],
    [8, 3],
    [9, 4],
    [10, 4],
    [11, 5]
  ],
  [
    [6, 5],
    [7, 4],
    [8, 4],
    [9, 3],
    [10, 3]
  ],
  [
    [8, 2],
    [8, 3],
    [8, 4],
    [9, 5],
    [9, 6]
  ],
  [
    [6, 3],
    [7, 3],
    [8, 4],
    [9, 5],
    [10, 5]
  ]
];

const EYE_STYLES = [
  { eye: [12, 4], shine: [13, 3] },
  { eye: [12, 3], shine: [13, 2] },
  { eye: [11, 4], shine: [12, 3] },
  { eye: [12, 4], shine: [12, 3] }
];

const FISH_VARIANTS = [
  {
    name: "Amber Fish",
    bodyMask: BODY_MASKS[0],
    fin: FIN_TYPES[0],
    tail: TAIL_TYPES[0],
    accentPattern: ACCENT_PATTERNS[0],
    eye: EYE_STYLES[0],
    body: hsl(28, 84, 61),
    bodyShade: hsl(28, 66, 42),
    belly: hsl(42, 78, 79),
    accent: hsl(12, 88, 57),
    outline: hsl(214, 26, 16),
    spriteScale: 1,
    baseSpeed: 16,
    restOffset: 0
  },
  {
    name: "Reef Fish",
    bodyMask: BODY_MASKS[1],
    fin: FIN_TYPES[1],
    tail: TAIL_TYPES[1],
    accentPattern: ACCENT_PATTERNS[1],
    eye: EYE_STYLES[1],
    body: hsl(198, 72, 60),
    bodyShade: hsl(202, 56, 41),
    belly: hsl(188, 74, 82),
    accent: hsl(52, 88, 62),
    outline: hsl(214, 26, 16),
    spriteScale: 1.05,
    baseSpeed: 15,
    restOffset: -3
  },
  {
    name: "Coral Fish",
    bodyMask: BODY_MASKS[2],
    fin: FIN_TYPES[2],
    tail: TAIL_TYPES[2],
    accentPattern: ACCENT_PATTERNS[2],
    eye: EYE_STYLES[2],
    body: hsl(346, 74, 66),
    bodyShade: hsl(348, 54, 46),
    belly: hsl(18, 88, 82),
    accent: hsl(24, 90, 58),
    outline: hsl(220, 24, 16),
    spriteScale: 0.98,
    baseSpeed: 17,
    restOffset: 2
  },
  {
    name: "Kelp Fish",
    bodyMask: BODY_MASKS[3],
    fin: FIN_TYPES[3],
    tail: TAIL_TYPES[3],
    accentPattern: ACCENT_PATTERNS[3],
    eye: EYE_STYLES[3],
    body: hsl(144, 44, 60),
    bodyShade: hsl(148, 34, 39),
    belly: hsl(58, 46, 80),
    accent: hsl(226, 66, 67),
    outline: hsl(214, 24, 14),
    spriteScale: 1.08,
    baseSpeed: 14.5,
    restOffset: 4
  }
];

function drawPixel(grid, x, y, color) {
  if (x < 0 || y < 0 || y >= grid.length || x >= grid[0].length) {
    return;
  }
  grid[y][x] = color;
}

function drawPoints(grid, points, color, offsetY = 0) {
  for (const [x, y] of points) {
    drawPixel(grid, x, y + offsetY, color);
  }
}

function buildSpriteFrames(appearance) {
  const frames = [0, 1].map((frameIndex) => {
    const grid = Array.from({ length: 10 }, () => Array(16).fill(null));
    const bodyShade = appearance.bodyShade;
    const bellyShade = appearance.belly;
    const outline = appearance.outline;
    const bodyMask = appearance.bodyMask;

    for (let y = 0; y < bodyMask.length; y += 1) {
      for (let x = 0; x < bodyMask[y].length; x += 1) {
        if (bodyMask[y][x] !== "#") {
          continue;
        }

        const color = y >= 5 ? bodyShade : appearance.body;
        drawPixel(grid, x, y, color);
        if (y >= 4 && x >= 7) {
          drawPixel(grid, x, y, bellyShade);
        }
      }
    }

    const tailOffset = frameIndex === 0 ? -appearance.tail.wiggle : appearance.tail.wiggle;
    drawPoints(grid, appearance.tail.points, bodyShade, tailOffset);
    drawPoints(grid, appearance.fin.dorsal, appearance.accent, frameIndex === 0 ? -1 : 0);
    drawPoints(grid, appearance.fin.ventral, appearance.accent, frameIndex === 0 ? 0 : 1);
    drawPoints(grid, appearance.accentPattern, appearance.accent);

    drawPixel(grid, appearance.eye.eye[0], appearance.eye.eye[1], appearance.eyeColor);
    drawPixel(grid, appearance.eye.shine[0], appearance.eye.shine[1], appearance.shineColor);

    applyOutline(grid, outline);
    return gridToCanvas(grid);
  });

  const sleepGrid = Array.from({ length: 10 }, () => Array(16).fill(null));
  const bodyMask = appearance.bodyMask;

  for (let y = 0; y < bodyMask.length; y += 1) {
    for (let x = 0; x < bodyMask[y].length; x += 1) {
      if (bodyMask[y][x] !== "#") {
        continue;
      }
      drawPixel(sleepGrid, x, y, y >= 5 ? appearance.bodyShade : appearance.body);
      if (y >= 4 && x >= 7) {
        drawPixel(sleepGrid, x, y, appearance.belly);
      }
    }
  }

  drawPoints(sleepGrid, appearance.tail.points, appearance.bodyShade);
  drawPoints(sleepGrid, appearance.fin.dorsal, appearance.accent);
  drawPoints(sleepGrid, appearance.fin.ventral, appearance.accent);
  drawPoints(sleepGrid, appearance.accentPattern, appearance.accent);
  drawPixel(sleepGrid, appearance.eye.eye[0], appearance.eye.eye[1], appearance.outline);
  drawPixel(sleepGrid, appearance.eye.eye[0] + 1, appearance.eye.eye[1], appearance.outline);
  applyOutline(sleepGrid, appearance.outline);

  return {
    awake: frames,
    sleep: gridToCanvas(sleepGrid)
  };
}

function applyOutline(grid, outlineColor) {
  const width = grid[0].length;
  const height = grid.length;
  const additions = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!grid[y][x]) {
        continue;
      }

      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || !grid[ny][nx]) {
          additions.push([nx, ny]);
        }
      }
    }
  }

  for (const [x, y] of additions) {
    if (x >= 0 && y >= 0 && y < grid.length && x < grid[0].length && !grid[y][x]) {
      grid[y][x] = outlineColor;
    }
  }
}

function gridToCanvas(grid) {
  const canvas = createCanvas(grid[0].length, grid.length);
  const ctx = canvas.getContext("2d");

  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      const color = grid[y][x];
      if (!color) {
        continue;
      }
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return canvas;
}

function createAppearance(variant) {
  const appearance = {
    bodyMask: variant.bodyMask,
    fin: variant.fin,
    tail: variant.tail,
    accentPattern: variant.accentPattern,
    eye: variant.eye,
    body: variant.body,
    bodyShade: variant.bodyShade,
    belly: variant.belly,
    accent: variant.accent,
    outline: variant.outline,
    eyeColor: hsl(214, 33, 10),
    shineColor: hsl(0, 0, 100)
  };

  appearance.frames = buildSpriteFrames(appearance);
  return appearance;
}

function createName(variant) {
  return variant.name;
}

export default class Fish {
  constructor(id, x, y) {
    const variant = FISH_VARIANTS[(Math.max(1, id) - 1) % FISH_VARIANTS.length];
    this.id = id;
    this.name = createName(variant);
    this.position = new Vector2(x, y);
    this.velocity = Vector2.fromAngle(randRange(0, TAU), randRange(8, 16));
    this.desiredVelocity = this.velocity.clone();
    this.state = "idle";
    this.stateAge = 0;
    this.wanderAngle = randRange(0, TAU);
    this.bobPhase = randRange(0, TAU);
    this.maxSpeed = variant.baseSpeed;
    this.baseSpeed = this.maxSpeed;
    this.appearance = createAppearance(variant);
    this.spriteScale = variant.spriteScale;
    this.spriteWidth = 16 * this.spriteScale;
    this.spriteHeight = 10 * this.spriteScale;
    this.fleeTimer = 0;
    this.fleeSource = new Vector2();
    this.socialMode = null;
    this.socialTarget = null;
    this.socialTimer = 0;
    this.restOffset = variant.restOffset;
  }

  setSocial(mode, target, duration) {
    this.socialMode = mode;
    this.socialTarget = target;
    this.socialTimer = duration;
  }

  clearSocial() {
    this.socialMode = null;
    this.socialTarget = null;
    this.socialTimer = 0;
  }

  triggerFlee(source, duration = 1.6) {
    this.fleeSource.set(source.x, source.y);
    this.fleeTimer = Math.max(this.fleeTimer, duration);
  }

  containsPoint(x, y, time) {
    const renderY = this.position.y + this.getBobOffset(time);
    return (
      x >= this.position.x - this.spriteWidth * 0.6 &&
      x <= this.position.x + this.spriteWidth * 0.6 &&
      y >= renderY - this.spriteHeight * 0.7 &&
      y <= renderY + this.spriteHeight * 0.7
    );
  }

  getBobOffset(time) {
    if (this.state === "sleep") {
      return Math.sin(time * 0.8 + this.bobPhase) * 0.4;
    }
    return Math.sin(time * 3 + this.bobPhase) * 1.2;
  }

  findNearestFood(foodParticles) {
    let nearest = null;
    let bestDistance = Infinity;

    for (const food of foodParticles) {
      const d = distance(this.position, food);
      if (d < bestDistance) {
        nearest = food;
        bestDistance = d;
      }
    }

    return { food: nearest, distance: bestDistance };
  }

  computeBoids(fishList) {
    const separation = new Vector2();
    const alignment = new Vector2();
    const cohesion = new Vector2();
    let neighbors = 0;

    for (const fish of fishList) {
      if (fish === this) {
        continue;
      }

      const d = distance(this.position, fish.position);
      if (d > 40) {
        continue;
      }

      neighbors += 1;
      alignment.add(fish.velocity);
      cohesion.add(fish.position);

      if (d < 14) {
        separation.add(this.position.clone().sub(fish.position).scale(1 / Math.max(d, 1)));
      }
    }

    if (neighbors > 0) {
      alignment.scale(1 / neighbors).normalize();
      cohesion.scale(1 / neighbors).sub(this.position).normalize();
    }

    return { separation, alignment, cohesion };
  }

  computeBoundaryForce(bounds) {
    const marginX = 20;
    const marginTop = 18;
    const marginBottom = 28;
    const force = new Vector2();

    if (this.position.x < marginX) {
      force.x += (marginX - this.position.x) / marginX;
    }

    if (this.position.x > bounds.width - marginX) {
      force.x -= (this.position.x - (bounds.width - marginX)) / marginX;
    }

    if (this.position.y < marginTop) {
      force.y += (marginTop - this.position.y) / marginTop;
    }

    if (this.position.y > bounds.height - marginBottom) {
      force.y -= (this.position.y - (bounds.height - marginBottom)) / marginBottom;
    }

    return force;
  }

  computeSocialVector() {
    if (!this.socialMode || !this.socialTarget || this.socialTimer <= 0) {
      return null;
    }

    const targetPos = this.socialTarget.position;
    if (this.socialMode === "kiss") {
      const midpoint = new Vector2(
        lerp(this.position.x, targetPos.x, 0.5),
        lerp(this.position.y, targetPos.y, 0.5)
      );
      return midpoint.sub(this.position).normalize().scale(this.baseSpeed * 0.6);
    }

    if (this.socialMode === "chase-lead") {
      this.wanderAngle += 0.15;
      return Vector2.fromAngle(this.wanderAngle, this.baseSpeed * 1.15);
    }

    if (this.socialMode === "chase-follow") {
      return targetPos.clone().sub(this.position).normalize().scale(this.baseSpeed * 1.25);
    }

    return null;
  }

  update(deltaTime, fishList, environment) {
    this.stateAge += deltaTime;
    this.fleeTimer = Math.max(0, this.fleeTimer - deltaTime);
    this.socialTimer = Math.max(0, this.socialTimer - deltaTime);
    if (this.socialTimer <= 0 && this.socialMode) {
      this.clearSocial();
    }

    const boids = this.computeBoids(fishList);
    const boundaryForce = this.computeBoundaryForce(environment.bounds);
    const { food: nearestFood, distance: nearestFoodDistance } = this.findNearestFood(environment.food);
    const mouseDistance = environment.mouse.inside ? distance(this.position, environment.mouse) : Infinity;

    let nextState = "idle";

    if (environment.isNight) {
      nextState = "sleep";
    } else if (this.fleeTimer > 0.01) {
      nextState = "flee";
    } else if (nearestFood && nearestFoodDistance < 88) {
      nextState = "feed";
    } else if (environment.mouse.inside && mouseDistance < 150) {
      nextState = "curious";
    }

    this.state = nextState;

    let desired = new Vector2();

    if (this.state === "sleep") {
      const restTarget = new Vector2(
        this.position.x + Math.sin(environment.time * 0.3 + this.id) * 4,
        environment.bounds.height - 24 + Math.sin(environment.time * 0.7 + this.id) * 1.4 + this.restOffset * 0.1
      );
      desired = restTarget.sub(this.position).scale(0.9);
      desired.add(boids.separation.scale(0.35));
      desired.add(boundaryForce.scale(16));
      desired.limit(this.baseSpeed * 0.4);
    } else if (this.state === "flee") {
      desired = this.position.clone().sub(this.fleeSource).normalize().scale(this.baseSpeed * 2);
      desired.add(boundaryForce.scale(22));
      desired.limit(this.baseSpeed * 2.2);
    } else if (this.state === "feed" && nearestFood) {
      desired = new Vector2(nearestFood.x, nearestFood.y).sub(this.position).normalize().scale(this.baseSpeed * 1.4);
      desired.add(boids.separation.scale(0.8));
      desired.add(boundaryForce.scale(18));

      if (nearestFoodDistance < 6) {
        environment.consumeFood(nearestFood);
      }
    } else if (this.state === "curious") {
      const slowRadius = 42;
      const intensity = clamp(mouseDistance / 120, 0.25, 1);
      desired = new Vector2(environment.mouse.x, environment.mouse.y)
        .sub(this.position)
        .normalize()
        .scale(this.baseSpeed * intensity);

      if (mouseDistance < slowRadius) {
        desired.scale(smoothstep(0, slowRadius, mouseDistance));
      }

      desired.add(boids.alignment.scale(0.8));
      desired.add(boids.cohesion.scale(0.3));
      desired.add(boundaryForce.scale(14));
    } else {
      this.wanderAngle += randRange(-0.55, 0.55) * deltaTime;
      desired = Vector2.fromAngle(this.wanderAngle + Math.sin(environment.time + this.id) * 0.15, this.baseSpeed * 0.9);
      desired.add(boids.alignment.scale(1.6));
      desired.add(boids.cohesion.scale(0.9));
      desired.add(boids.separation.scale(1.9));
      desired.add(boundaryForce.scale(18));
    }

    const socialVector = this.computeSocialVector();
    if (socialVector) {
      desired.lerp(socialVector, 0.55);
    }

    this.desiredVelocity = desired;
    this.velocity.lerp(this.desiredVelocity, clamp(deltaTime * 2.4, 0.04, 0.18));
    this.velocity.limit(this.state === "sleep" ? this.baseSpeed * 0.5 : this.baseSpeed * 2.25);

    this.position.add(this.velocity.clone().scale(deltaTime));

    this.position.x = clamp(this.position.x, 10, environment.bounds.width - 10);
    this.position.y = clamp(this.position.y, 12, environment.bounds.height - 24);
  }

  render(ctx, time, hovered = false) {
    const bob = this.getBobOffset(time);
    const renderX = this.position.x;
    const renderY = this.position.y + bob;
    const facing = signOrOne(this.velocity.x);
    const frameIndex = this.state === "sleep" ? 0 : Math.floor(time * 6 + this.id) % 2;
    const sprite =
      this.state === "sleep" ? this.appearance.frames.sleep : this.appearance.frames.awake[frameIndex];

    ctx.save();
    ctx.translate(renderX, renderY);
    ctx.scale(facing >= 0 ? 1 : -1, 1);

    ctx.fillStyle = hsl(216, 40, 8, hovered ? 0.34 : 0.2);
    ctx.fillRect(-this.spriteWidth * 0.2, this.spriteHeight * 0.45, this.spriteWidth * 0.7, 2);

    ctx.drawImage(
      sprite,
      -this.spriteWidth * 0.5,
      -this.spriteHeight * 0.5,
      this.spriteWidth,
      this.spriteHeight
    );

    if (hovered) {
      ctx.strokeStyle = hsl(48, 92, 72, 0.85);
      ctx.strokeRect(-this.spriteWidth * 0.55, -this.spriteHeight * 0.55, this.spriteWidth * 1.1, this.spriteHeight * 1.1);
    }

    ctx.restore();
  }
}
