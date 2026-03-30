import {
  TAU,
  chance,
  clamp,
  createId,
  distance,
  lerp,
  limitVector,
  normalizeVector,
  pick,
  randInt,
  randRange,
  smoothstep
} from "./math.js";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  DECORATIONS,
  PRESETS,
  SPECIES,
  SPECIES_GROUP_CAPS,
  SPECIES_ORDER,
  createDefaultSettings,
  normalizeSettings
} from "./species.js";

const FLOOR_Y = BASE_HEIGHT - 24;
const SURFACE_Y = 10;
const NAME_PREFIX = ["Bloop", "Tide", "Nova", "Kelp", "Moss", "Coral", "Echo", "Drift", "Pebble", "Sprig", "Reef", "Marble"];
const NAME_SUFFIX = ["gleam", "whisk", "drift", "ray", "bubble", "dash", "pulse", "glint", "glow", "loop", "wisp", "bloom"];

const SMALL_CREATURES = new Set([
  "genericFish",
  "clownfish",
  "seahorse",
  "pufferfish",
  "gardenEel"
]);

const FEEDERS = new Set([
  "genericFish",
  "clownfish",
  "seahorse",
  "pufferfish",
  "barracuda",
  "morayEel",
  "gardenEel",
  "electricEel"
]);

const LARGE_CREATURES = new Set([
  "greatWhiteShark",
  "hammerheadShark",
  "mantaRay",
  "seaTurtle",
  "swordfish",
  "lionsManeJellyfish"
]);

const SHARKS = new Set(["greatWhiteShark", "hammerheadShark"]);
const JELLYFISH = new Set(["moonJellyfish", "boxJellyfish", "lionsManeJellyfish"]);
const EELS = new Set(["morayEel", "gardenEel", "electricEel"]);

function makeName(speciesId) {
  const label = SPECIES[speciesId].label.split(" ")[0];
  return `${pick(NAME_PREFIX)} ${label} ${pick(NAME_SUFFIX)}`;
}

function makeSegments(count, x, y) {
  return Array.from({ length: count }, () => ({ x, y }));
}

function steerTo(entity, tx, ty, speed, dt, responsiveness = 0.18) {
  const dir = normalizeVector(tx - entity.x, ty - entity.y);
  const desired = { x: dir.x * speed, y: dir.y * speed };
  entity.vx = lerp(entity.vx, desired.x, clamp(responsiveness + dt * 0.8, 0.08, 0.35));
  entity.vy = lerp(entity.vy, desired.y, clamp(responsiveness + dt * 0.8, 0.08, 0.35));
}

function steerAway(entity, sx, sy, speed, dt, responsiveness = 0.22) {
  const dir = normalizeVector(entity.x - sx, entity.y - sy);
  const desired = { x: dir.x * speed, y: dir.y * speed };
  entity.vx = lerp(entity.vx, desired.x, clamp(responsiveness + dt * 0.8, 0.1, 0.45));
  entity.vy = lerp(entity.vy, desired.y, clamp(responsiveness + dt * 0.8, 0.1, 0.45));
}

function applyCurrent(entity, dx, dy, amount, dt) {
  entity.vx += dx * amount * dt;
  entity.vy += dy * amount * dt;
}

function clampToBounds(entity, marginX = 10, marginTop = 12, marginBottom = 24) {
  entity.x = clamp(entity.x, marginX, BASE_WIDTH - marginX);
  entity.y = clamp(entity.y, marginTop, BASE_HEIGHT - marginBottom);
}

function followSegments(entity, spacing = 4) {
  if (!entity.segments?.length) {
    return;
  }

  entity.segments[0].x = entity.x;
  entity.segments[0].y = entity.y;

  for (let index = 1; index < entity.segments.length; index += 1) {
    const prev = entity.segments[index - 1];
    const current = entity.segments[index];
    const dir = normalizeVector(current.x - prev.x, current.y - prev.y);
    current.x = prev.x + dir.x * spacing;
    current.y = prev.y + dir.y * spacing;
  }
}

function flattenSettingsCounts(settings) {
  const requested = {};
  const presetCounts = PRESETS[settings.preset]?.counts || {};

  for (const speciesId of SPECIES_ORDER) {
    const meta = SPECIES[speciesId];
    const sourceCount = settings.balancedAuto
      ? presetCounts[speciesId] ?? settings.species[speciesId].count
      : settings.species[speciesId].count;

    requested[speciesId] = settings.species[speciesId].enabled ? clamp(sourceCount, 0, meta.maxCount) : 0;
  }

  requested.genericFish = Math.min(requested.genericFish, 15);
  requested.octopus = Math.min(requested.octopus, SPECIES_GROUP_CAPS.octopus);
  requested.lionsManeJellyfish = Math.min(requested.lionsManeJellyfish, SPECIES_GROUP_CAPS.largeJellyfish);

  let sharkCount = requested.greatWhiteShark + requested.hammerheadShark;
  while (sharkCount > SPECIES_GROUP_CAPS.sharks) {
    if (requested.hammerheadShark > requested.greatWhiteShark) {
      requested.hammerheadShark -= 1;
    } else {
      requested.greatWhiteShark -= 1;
    }
    sharkCount -= 1;
  }

  let total = Object.values(requested).reduce((sum, value) => sum + value, 0);
  while (total > settings.totalCap) {
    const removable = SPECIES_ORDER.filter((speciesId) => requested[speciesId] > 0).sort((left, right) => {
      const leftMeta = SPECIES[left];
      const rightMeta = SPECIES[right];
      if (requested[right] !== requested[left]) {
        return requested[right] - requested[left];
      }
      return (rightMeta.importance || 0) - (leftMeta.importance || 0);
    });

    if (!removable.length) {
      break;
    }

    requested[removable[0]] -= 1;
    total -= 1;
  }

  return requested;
}

function findNearest(items, x, y, predicate = () => true) {
  let nearest = null;
  let bestDistance = Infinity;

  for (const item of items) {
    if (!predicate(item)) {
      continue;
    }
    const d = Math.hypot(item.x - x, item.y - y);
    if (d < bestDistance) {
      nearest = item;
      bestDistance = d;
    }
  }

  return { item: nearest, distance: bestDistance };
}

function schoolForces(entity, entities) {
  let neighbors = 0;
  let alignX = 0;
  let alignY = 0;
  let cohX = 0;
  let cohY = 0;
  let sepX = 0;
  let sepY = 0;

  for (const other of entities) {
    if (other.id === entity.id || !SPECIES[other.species].schooling) {
      continue;
    }
    const d = Math.hypot(entity.x - other.x, entity.y - other.y);
    if (d > 34) {
      continue;
    }
    neighbors += 1;
    alignX += other.vx;
    alignY += other.vy;
    cohX += other.x;
    cohY += other.y;

    const extraSpace = other.species === "pufferfish" && other.puffed ? 10 : 0;
    if (d < 14 + extraSpace) {
      sepX += (entity.x - other.x) / Math.max(1, d);
      sepY += (entity.y - other.y) / Math.max(1, d);
    }
  }

  if (!neighbors) {
    return { x: 0, y: 0 };
  }

  const cohesion = normalizeVector(cohX / neighbors - entity.x, cohY / neighbors - entity.y);
  const alignment = normalizeVector(alignX / neighbors, alignY / neighbors);
  const separation = normalizeVector(sepX, sepY);

  return {
    x: cohesion.x * 0.7 + alignment.x * 0.8 + separation.x * 1.2,
    y: cohesion.y * 0.7 + alignment.y * 0.8 + separation.y * 1.2
  };
}

function randomMidPosition() {
  return {
    x: randRange(26, BASE_WIDTH - 26),
    y: randRange(36, BASE_HEIGHT - 44)
  };
}

function spawnEntity(speciesId, index, count) {
  const meta = SPECIES[speciesId];
  const entity = {
    id: createId(speciesId),
    species: speciesId,
    name: makeName(speciesId),
    seed: randInt(1, 999999),
    x: BASE_WIDTH * 0.5,
    y: BASE_HEIGHT * 0.5,
    vx: randRange(-14, 14),
    vy: randRange(-8, 8),
    angle: 0,
    state: "idle",
    scale: meta.sizeScale,
    phase: randRange(0, TAU),
    timer: randRange(0, 2),
    cooldown: randRange(0.4, 4),
    direction: chance(0.5) ? -1 : 1,
    fearTimer: 0,
    fearSource: { x: 0, y: 0 },
    anchorX: null,
    anchorY: null,
    dashTimer: 0,
    puffUntil: 0,
    retractUntil: 0,
    attachUntil: 0,
    pulse: randRange(0, TAU),
    glow: randRange(0, TAU),
    lure: 0.35,
    emerge: 1,
    lunge: 0,
    segments: null,
    waveUntil: 0,
    inkUntil: 0,
    holdTimer: randRange(2, 6)
  };

  if (speciesId === "greatWhiteShark" || speciesId === "hammerheadShark") {
    entity.x = randRange(48, BASE_WIDTH - 48);
    entity.y = speciesId === "hammerheadShark" ? FLOOR_Y - randRange(16, 30) : randRange(42, 92);
    entity.cooldown = randRange(10, 18);
  } else if (speciesId === "barracuda") {
    Object.assign(entity, randomMidPosition());
    entity.cooldown = randRange(1.5, 2.6);
  } else if (JELLYFISH.has(speciesId)) {
    entity.x = randRange(32, BASE_WIDTH - 32);
    entity.y = randRange(36, 112);
    entity.vx = randRange(-8, 8);
    entity.vy = randRange(-3, 5);
  } else if (speciesId === "morayEel") {
    const anchor = DECORATIONS.eelCrevices[index % DECORATIONS.eelCrevices.length];
    entity.anchorX = anchor.x;
    entity.anchorY = anchor.y;
    entity.x = anchor.x;
    entity.y = anchor.y;
    entity.segments = makeSegments(6, anchor.x, anchor.y);
  } else if (speciesId === "gardenEel") {
    const span = count > 1 ? index / Math.max(1, count - 1) : 0.5;
    entity.anchorX = lerp(52, BASE_WIDTH - 52, span);
    entity.anchorY = FLOOR_Y;
    entity.x = entity.anchorX;
    entity.y = FLOOR_Y - 18;
    entity.segments = makeSegments(4, entity.x, entity.y);
  } else if (speciesId === "electricEel") {
    entity.x = randRange(36, BASE_WIDTH - 36);
    entity.y = FLOOR_Y - randRange(10, 18);
    entity.segments = makeSegments(7, entity.x, entity.y);
    entity.cooldown = randRange(20, 40);
  } else if (speciesId === "seahorse") {
    entity.anchorX = pick(DECORATIONS.seaweedAnchors);
    entity.anchorY = FLOOR_Y - randRange(24, 48);
    entity.x = entity.anchorX + randRange(-8, 8);
    entity.y = entity.anchorY;
  } else if (speciesId === "clownfish") {
    const anchor = DECORATIONS.anemones[index % DECORATIONS.anemones.length];
    entity.anchorX = anchor.x;
    entity.anchorY = anchor.y - 10;
    entity.x = anchor.x + randRange(-12, 12);
    entity.y = anchor.y - randRange(12, 20);
  } else if (speciesId === "mantaRay") {
    entity.x = randRange(40, BASE_WIDTH - 40);
    entity.y = randRange(28, 54);
  } else if (speciesId === "anglerfish") {
    entity.x = randRange(32, BASE_WIDTH - 32);
    entity.y = FLOOR_Y - randRange(8, 12);
  } else if (speciesId === "seaTurtle") {
    entity.x = randRange(24, BASE_WIDTH - 24);
    entity.y = randRange(42, 76);
  } else if (speciesId === "octopus") {
    entity.x = randRange(34, BASE_WIDTH - 34);
    entity.y = FLOOR_Y - randRange(4, 10);
    entity.anchorY = FLOOR_Y - randRange(4, 10);
    entity.segments = makeSegments(8, entity.x, entity.y);
  } else if (speciesId === "swordfish") {
    entity.x = randRange(20, BASE_WIDTH - 20);
    entity.y = randRange(38, 92);
  } else if (speciesId === "starfish") {
    entity.x = randRange(22, BASE_WIDTH - 22);
    entity.y = FLOOR_Y - randRange(0, 2);
    entity.anchorX = entity.x;
    entity.anchorY = entity.y;
    entity.cooldown = randRange(2, 6);
  } else {
    Object.assign(entity, randomMidPosition());
  }

  return entity;
}

export class AquariumSimulation {
  constructor(settings = createDefaultSettings()) {
    this.players = new Map();
    this.entities = [];
    this.food = [];
    this.effects = [];
    this.settings = normalizeSettings(settings);
    this.time = 0;
    this.tick = 0;
    this.cycle = 0.08;
    this.hostId = null;
    this.applySettings(this.settings);
  }

  applySettings(settings) {
    this.settings = normalizeSettings(settings);
    const counts = flattenSettingsCounts(this.settings);
    this.entities = [];

    for (const speciesId of SPECIES_ORDER) {
      const count = counts[speciesId];
      for (let index = 0; index < count; index += 1) {
        this.entities.push(spawnEntity(speciesId, index, count));
      }
    }

    this.food = [];
    this.effects = [];
  }

  setSettings(settings, actorId = null) {
    if (this.hostId && actorId && actorId !== this.hostId) {
      return this.settings;
    }

    this.applySettings(settings);
    return this.settings;
  }

  addPlayer(playerId, { name, color, isHost = false } = {}) {
    this.players.set(playerId, {
      id: playerId,
      name: name || "Guest",
      color: color || "#8ee8ff",
      x: BASE_WIDTH * 0.5,
      y: BASE_HEIGHT * 0.5,
      inside: false,
      chatText: "",
      chatUntil: 0
    });

    if (!this.hostId || isHost) {
      this.hostId = playerId;
    }

    return this.players.get(playerId);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    if (playerId === this.hostId) {
      this.hostId = this.players.keys().next().value || null;
    }
  }

  setCursor(playerId, payload) {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }

    player.x = clamp(Number(payload.x ?? player.x), 0, BASE_WIDTH);
    player.y = clamp(Number(payload.y ?? player.y), 0, BASE_HEIGHT);
    player.inside = Boolean(payload.inside);
  }

  setChat(playerId, text) {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }

    player.chatText = String(text || "").slice(0, 80);
    player.chatUntil = this.time + 5;
  }

  addEffect(type, x, y, options = {}) {
    this.effects.push({
      id: createId(type),
      type,
      x,
      y,
      ttl: options.ttl ?? 0.8,
      radius: options.radius ?? 2,
      growth: options.growth ?? 26,
      color: options.color ?? null
    });
  }

  handleTap(_playerId, x, y) {
    this.addEffect("ripple", x, y, { ttl: 0.85, radius: 2, growth: 34 });

    for (const entity of this.entities) {
      const d = Math.hypot(entity.x - x, entity.y - y);
      if (d > 74) {
        continue;
      }

      if (entity.species === "hammerheadShark") {
        entity.direction *= -1;
        entity.state = "u-turn";
        entity.cooldown = 1.2;
      }

      if (entity.species === "gardenEel") {
        entity.retractUntil = this.time + randRange(3, 4.5);
      }

      if (entity.species === "pufferfish") {
        entity.puffUntil = this.time + 3;
      }

      if (entity.species === "octopus") {
        entity.inkUntil = this.time + 1;
        entity.fearTimer = 1.6;
        entity.fearSource = { x, y };
        this.addEffect("ink", entity.x, entity.y, { ttl: 1.2, radius: 5, growth: 12 });
      }

      if (!JELLYFISH.has(entity.species) && entity.species !== "seaTurtle") {
        entity.fearTimer = Math.max(entity.fearTimer, 1.6);
        entity.fearSource = { x, y };
      }

      if (entity.species === "starfish") {
        entity.waveUntil = this.time + 4;
      }
    }
  }

  handleFeed(_playerId, x, y) {
    const count = randInt(3, 5);
    for (let index = 0; index < count; index += 1) {
      this.food.push({
        id: createId("food"),
        x: x + randRange(-8, 8),
        y: y + randRange(-2, 4),
        vx: randRange(-2, 2),
        vy: randRange(7, 13),
        ttl: 16
      });
    }

    for (const entity of this.entities) {
      if (entity.species === "morayEel") {
        entity.state = "lunge";
        entity.targetX = x;
        entity.targetY = y;
      }
    }
  }

  findNearestCursor(entity) {
    const cursors = Array.from(this.players.values()).filter((player) => player.inside);
    return findNearest(cursors, entity.x, entity.y);
  }

  findNearestFood(entity) {
    if (!FEEDERS.has(entity.species)) {
      return { item: null, distance: Infinity };
    }
    return findNearest(this.food, entity.x, entity.y);
  }

  nearestThreat(entity) {
    let threat = null;
    let bestDistance = Infinity;

    for (const other of this.entities) {
      if (other.id === entity.id) {
        continue;
      }
      const otherSpecies = other.species;
      const isPredator = SHARKS.has(otherSpecies) || otherSpecies === "barracuda";
      if (!isPredator && otherSpecies !== "electricEel" && otherSpecies !== "pufferfish") {
        continue;
      }
      if (JELLYFISH.has(entity.species) || entity.species === "seaTurtle") {
        continue;
      }
      const d = Math.hypot(entity.x - other.x, entity.y - other.y);
      const radius = otherSpecies === "electricEel" ? 34 : SPECIES[otherSpecies].fearRadius || 26;
      if (d < radius && d < bestDistance) {
        threat = other;
        bestDistance = d;
      }
    }

    return { item: threat, distance: bestDistance };
  }

  updateFood(dt) {
    this.food = this.food.filter((food) => {
      food.ttl -= dt;
      food.y += food.vy * dt;
      food.x += Math.sin(this.time * 2 + food.id.length) * food.vx * dt;
      if (food.y >= FLOOR_Y - 1) {
        food.y = FLOOR_Y - 1;
        food.vy *= 0.2;
      }
      return food.ttl > 0;
    });
  }

  updateEffects(dt) {
    this.effects = this.effects.filter((effect) => {
      effect.ttl -= dt;
      effect.radius += effect.growth * dt;
      return effect.ttl > 0;
    });

    for (const player of this.players.values()) {
      if (player.chatUntil <= this.time) {
        player.chatText = "";
      }
    }
  }

  consumeFood(foodId) {
    this.food = this.food.filter((food) => food.id !== foodId);
  }

  updateEntity(entity, dt, isNight) {
    const meta = SPECIES[entity.species];
    const nearestCursor = this.findNearestCursor(entity);
    const nearestFood = this.findNearestFood(entity);
    const nearestThreat = this.nearestThreat(entity);
    const schooling = meta.schooling ? schoolForces(entity, this.entities) : { x: 0, y: 0 };

    entity.timer += dt;
    entity.pulse += dt * 2.6;
    entity.glow += dt;
    entity.angle = Math.atan2(entity.vy, entity.vx || entity.direction);
    entity.fearTimer = Math.max(0, entity.fearTimer - dt);
    entity.puffed = entity.puffUntil > this.time;

    if (nearestThreat.item && entity.species !== "octopus") {
      entity.fearTimer = Math.max(entity.fearTimer, 1.2);
      entity.fearSource = { x: nearestThreat.item.x, y: nearestThreat.item.y };
    }

    if (entity.species === "genericFish" || entity.species === "clownfish" || entity.species === "pufferfish" || entity.species === "seahorse") {
      if (nearestThreat.item && (entity.species === "pufferfish" || entity.species === "seahorse")) {
        entity.fearTimer = Math.max(entity.fearTimer, 1.4);
        entity.fearSource = { x: nearestThreat.item.x, y: nearestThreat.item.y };
      }
    }

    switch (entity.species) {
      case "genericFish": {
        if (isNight) {
          steerTo(entity, entity.x + Math.sin(this.time + entity.phase) * 6, FLOOR_Y - 10, 8, dt);
          entity.state = "sleep";
        } else if (entity.fearTimer > 0) {
          steerAway(entity, entity.fearSource.x, entity.fearSource.y, 32, dt);
          entity.state = "flee";
        } else if (nearestFood.item && nearestFood.distance < 72) {
          steerTo(entity, nearestFood.item.x, nearestFood.item.y, 22, dt);
          entity.state = "feed";
          if (nearestFood.distance < 6) {
            this.consumeFood(nearestFood.item.id);
          }
        } else if (nearestCursor.item && nearestCursor.distance < 150) {
          steerTo(entity, nearestCursor.item.x, nearestCursor.item.y, 18, dt);
          entity.state = "curious";
        } else {
          steerTo(
            entity,
            entity.x + Math.cos(this.time * 0.8 + entity.phase) * 12 + schooling.x * 14,
            entity.y + Math.sin(this.time * 1.1 + entity.phase) * 10 + schooling.y * 14,
            14,
            dt
          );
          entity.state = "idle";
        }
        break;
      }
      case "clownfish": {
        const anchorX = entity.anchorX ?? entity.x;
        const anchorY = entity.anchorY ?? entity.y;
        const intruder = findNearest(
          this.entities,
          anchorX,
          anchorY,
          (other) => other.id !== entity.id && other.species !== "clownfish" && !JELLYFISH.has(other.species)
        );

        if (entity.fearTimer > 0) {
          steerAway(entity, entity.fearSource.x, entity.fearSource.y, 28, dt);
          entity.state = "flee";
        } else if (nearestFood.item && nearestFood.distance < 60) {
          steerTo(entity, nearestFood.item.x, nearestFood.item.y, 20, dt);
          entity.state = "feed";
          if (nearestFood.distance < 6) {
            this.consumeFood(nearestFood.item.id);
          }
        } else if (nearestCursor.item && nearestCursor.distance < 165) {
          steerTo(entity, nearestCursor.item.x, nearestCursor.item.y, 22, dt);
          entity.state = "curious";
        } else if (intruder.item && intruder.distance < 22) {
          steerTo(entity, intruder.item.x, intruder.item.y, 24, dt);
          entity.state = "territorial";
        } else {
          steerTo(
            entity,
            anchorX + Math.cos(this.time * 1.2 + entity.phase) * 10 + schooling.x * 10,
            anchorY + Math.sin(this.time * 1.6 + entity.phase) * 6 + schooling.y * 8,
            14,
            dt
          );
          entity.state = "idle";
        }
        break;
      }
      case "pufferfish": {
        if (entity.fearTimer > 0) {
          entity.puffUntil = this.time + 3;
          steerAway(entity, entity.fearSource.x, entity.fearSource.y, 16, dt);
          entity.state = "puffed";
        } else if (nearestFood.item && nearestFood.distance < 52) {
          steerTo(entity, nearestFood.item.x, nearestFood.item.y, 16, dt);
          entity.state = "feed";
          if (nearestFood.distance < 5) {
            this.consumeFood(nearestFood.item.id);
          }
        } else {
          steerTo(
            entity,
            entity.x + Math.cos(this.time * 0.7 + entity.phase) * 9,
            entity.y + Math.sin(this.time * 0.9 + entity.phase) * 7,
            entity.puffed ? 8 : 12,
            dt
          );
          entity.state = entity.puffed ? "puffed" : "idle";
        }
        break;
      }
      case "seahorse": {
        if (entity.fearTimer > 0) {
          entity.attachUntil = 0;
          steerAway(entity, entity.fearSource.x, entity.fearSource.y, 18, dt);
          entity.state = "flee";
        } else if (entity.attachUntil > this.time) {
          entity.x = lerp(entity.x, entity.anchorX, 0.2);
          entity.y = lerp(entity.y, entity.anchorY, 0.2);
          entity.vx *= 0.7;
          entity.vy *= 0.7;
          entity.state = "anchored";
        } else if (nearestFood.item && nearestFood.distance < 56) {
          steerTo(entity, nearestFood.item.x, nearestFood.item.y, 14, dt);
          entity.state = "feed";
          if (nearestFood.distance < 5) {
            this.consumeFood(nearestFood.item.id);
          }
        } else if (nearestCursor.item && nearestCursor.distance < 120) {
          steerTo(entity, nearestCursor.item.x, nearestCursor.item.y, 15, dt);
          entity.state = "curious";
        } else {
          steerTo(
            entity,
            (entity.anchorX ?? entity.x) + Math.cos(this.time * 0.7 + entity.phase) * 6,
            (entity.anchorY ?? entity.y) + Math.sin(this.time * 1.2 + entity.phase) * 10,
            10,
            dt
          );
          entity.state = "idle";
          if (entity.timer > entity.holdTimer) {
            entity.attachUntil = this.time + randRange(2, 4);
            entity.holdTimer = this.time + randRange(5, 8);
          }
        }
        break;
      }
      case "barracuda": {
        if (entity.dashTimer > 0) {
          entity.dashTimer -= dt;
          entity.vx = entity.direction * 48;
          entity.vy = Math.sin(this.time * 5 + entity.phase) * 3;
          entity.state = "dart";
        } else if (nearestCursor.item && nearestCursor.distance < 170) {
          steerTo(entity, nearestCursor.item.x, nearestCursor.item.y, 34, dt, 0.28);
          entity.state = "rush";
          if (nearestCursor.distance < 18) {
            entity.vx *= 0.55;
            entity.vy *= 0.55;
          }
        } else if (entity.cooldown <= 0) {
          entity.dashTimer = randRange(0.45, 0.75);
          entity.cooldown = randRange(2, 3);
          entity.direction = entity.vx >= 0 ? 1 : -1;
        } else {
          entity.cooldown -= dt;
          entity.vx *= 0.92;
          entity.vy *= 0.88;
          entity.state = "hover";
        }
        break;
      }
      case "greatWhiteShark": {
        const tx = BASE_WIDTH * 0.5 + Math.cos(this.time * 0.22 + entity.phase) * 114;
        const ty = 74 + Math.sin(this.time * 0.35 + entity.phase) * 28;
        steerTo(entity, tx, ty, 20, dt, 0.1);
        entity.state = "patrol";
        if ((entity.x < 22 || entity.x > BASE_WIDTH - 22) && entity.cooldown <= 0) {
          entity.cooldown = randRange(8, 14);
          this.addEffect("shake", entity.x, entity.y, { ttl: 0.35, radius: 4, growth: 0 });
        } else {
          entity.cooldown -= dt;
        }
        break;
      }
      case "hammerheadShark": {
        const tx = entity.direction > 0 ? BASE_WIDTH - 26 : 26;
        const ty = FLOOR_Y - 18 + Math.sin(this.time * 1.5 + entity.phase) * 5;
        steerTo(entity, tx, ty, 18, dt, 0.12);
        entity.state = entity.cooldown > 0.8 ? "u-turn" : "scan";
        if (Math.abs(entity.x - tx) < 10) {
          entity.direction *= -1;
        }
        entity.cooldown = Math.max(0, entity.cooldown - dt);
        break;
      }
      case "moonJellyfish":
      case "boxJellyfish":
      case "lionsManeJellyfish": {
        const driftStrength = entity.species === "boxJellyfish" ? 10 : entity.species === "lionsManeJellyfish" ? 5 : 7;
        if (entity.cooldown <= 0) {
          entity.cooldown = randRange(2, 5);
          entity.direction *= chance(0.45) ? -1 : 1;
        }
        entity.cooldown -= dt;
        applyCurrent(entity, entity.direction, Math.sin(this.time * 0.8 + entity.phase) * 0.25, driftStrength, dt);
        entity.vx *= 0.97;
        entity.vy = Math.sin(this.time * 2.2 + entity.pulse) * (entity.species === "boxJellyfish" ? 8 : 5);
        entity.state = "drift";
        break;
      }
      case "morayEel": {
        const target = nearestFood.item && nearestFood.distance < 90
          ? nearestFood.item
          : entity.state === "lunge"
            ? { x: entity.targetX ?? entity.anchorX, y: entity.targetY ?? entity.anchorY }
            : nearestCursor.item;

        if (target && (nearestFood.item || nearestCursor.distance < 64)) {
          entity.lunge = clamp(entity.lunge + dt * 1.8, 0, 1);
          const aim = normalizeVector(target.x - entity.anchorX, target.y - entity.anchorY);
          entity.x = entity.anchorX + aim.x * 30 * entity.lunge;
          entity.y = entity.anchorY + aim.y * 20 * entity.lunge;
          entity.state = "lunge";
          if (nearestFood.item && nearestFood.distance < 7) {
            this.consumeFood(nearestFood.item.id);
          }
        } else {
          entity.lunge = Math.max(0, entity.lunge - dt * 1.2);
          entity.x = lerp(entity.x, entity.anchorX, 0.2);
          entity.y = lerp(entity.y, entity.anchorY, 0.2);
          entity.state = "watch";
        }
        break;
      }
      case "gardenEel": {
        const retracted = entity.retractUntil > this.time;
        entity.emerge = retracted ? Math.max(0, entity.emerge - dt * 3.8) : Math.min(1, entity.emerge + dt * 0.75);
        const sway = Math.sin(this.time * 1.7 + entity.phase) * 5 * entity.emerge;
        entity.x = entity.anchorX + sway;
        entity.y = FLOOR_Y - 18 * entity.emerge;
        entity.state = retracted ? "retract" : "sway";
        break;
      }
      case "electricEel": {
        if (entity.cooldown <= 0) {
          entity.cooldown = randRange(20, 40);
          this.addEffect("zap", entity.x, entity.y, { ttl: 0.65, radius: 2, growth: 22, color: "#c9f8ff" });
          for (const other of this.entities) {
            if (other.id !== entity.id && SMALL_CREATURES.has(other.species) && distance(other, entity) < 36) {
              other.fearTimer = 1.4;
              other.fearSource = { x: entity.x, y: entity.y };
            }
          }
        } else {
          entity.cooldown -= dt;
        }
        steerTo(
          entity,
          entity.x + Math.cos(this.time * 0.6 + entity.phase) * 18,
          FLOOR_Y - 12 + Math.sin(this.time * 1.1 + entity.phase) * 4,
          11,
          dt
        );
        entity.state = "bottom-cruise";
        break;
      }
      case "mantaRay": {
        const tx = BASE_WIDTH * 0.5 + Math.cos(this.time * 0.15 + entity.phase) * 120;
        const cursorLift = nearestCursor.item ? clamp((140 - nearestCursor.distance) / 140, 0, 1) * -8 : 0;
        const ty = 36 + Math.sin(this.time * 0.32 + entity.phase) * 12 + cursorLift;
        steerTo(entity, tx, ty, 12, dt, 0.08);
        entity.state = "glide";
        break;
      }
      case "anglerfish": {
        const nightBoost = isNight ? 1 : 0.35;
        entity.lure = lerp(entity.lure, nightBoost, 0.08);
        steerTo(
          entity,
          entity.x + Math.cos(this.time * 0.5 + entity.phase) * 12,
          FLOOR_Y - 10 + Math.sin(this.time * 0.7 + entity.phase) * 2,
          isNight ? 8 : 4,
          dt,
          0.08
        );
        entity.state = isNight ? "lure" : "hide";
        break;
      }
      case "seaTurtle": {
        entity.vx = entity.direction * 9;
        entity.vy = lerp(entity.vy, (46 + Math.sin(this.time * 0.4 + entity.phase) * 18 - entity.y) * 0.2, 0.08);
        entity.state = "cruise";
        if (entity.x < -20) {
          entity.x = BASE_WIDTH + 20;
        } else if (entity.x > BASE_WIDTH + 20) {
          entity.x = -20;
        }
        break;
      }
      case "octopus": {
        if (entity.fearTimer > 0) {
          steerAway(entity, entity.fearSource.x, entity.fearSource.y, 28, dt, 0.28);
          entity.state = "jet";
        } else {
          const nearestEel = findNearest(this.entities, entity.x, entity.y, (other) => EELS.has(other.species));
          if (nearestEel.item && nearestEel.distance < 28) {
            steerAway(entity, nearestEel.item.x, nearestEel.item.y, 16, dt);
            entity.state = "avoid";
          } else {
            steerTo(
              entity,
              entity.x + Math.cos(this.time * 0.45 + entity.phase) * 14,
              entity.anchorY + Math.sin(this.time * 0.9 + entity.phase) * 4,
              8,
              dt,
              0.1
            );
            entity.state = "crawl";
          }
        }
        break;
      }
      case "swordfish": {
        entity.vx = entity.direction * 28;
        entity.vy = (60 + Math.sin(this.time * 1.1 + entity.phase) * 26 - entity.y) * 0.22;
        entity.state = "dash";
        if (entity.x < -24) {
          entity.x = BASE_WIDTH + 24;
        } else if (entity.x > BASE_WIDTH + 24) {
          entity.x = -24;
        }
        break;
      }
      case "starfish": {
        entity.cooldown -= dt;
        if (entity.cooldown <= 0) {
          entity.cooldown = randRange(3, 6);
          entity.anchorX = clamp((entity.anchorX ?? entity.x) + randRange(-3, 3), 18, BASE_WIDTH - 18);
        }
        entity.x = lerp(entity.x, entity.anchorX ?? entity.x, 0.04);
        entity.y = FLOOR_Y - 1;
        entity.state = entity.waveUntil > this.time ? "wave" : "rest";
        break;
      }
      default:
        break;
    }

    if (entity.species === "genericFish" || entity.species === "clownfish") {
      entity.vx += schooling.x * 0.6;
      entity.vy += schooling.y * 0.6;
    }

    const capped = limitVector(entity.vx, entity.vy, LARGE_CREATURES.has(entity.species) ? 24 : entity.species === "swordfish" ? 30 : 22);
    entity.vx = capped.x;
    entity.vy = capped.y;

    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;

    if (!["seaTurtle", "swordfish"].includes(entity.species)) {
      clampToBounds(entity, 10, SURFACE_Y, 24);
    }

    if (entity.species === "seaTurtle") {
      entity.y = clamp(entity.y, 18, FLOOR_Y - 18);
    }
    if (entity.species === "mantaRay") {
      entity.y = clamp(entity.y, 18, 70);
    }
    if (entity.species === "greatWhiteShark") {
      entity.y = clamp(entity.y, 28, 110);
    }

    if (entity.species === "morayEel" || EELS.has(entity.species) || entity.species === "octopus") {
      followSegments(entity, entity.species === "octopus" ? 3 : 4);
    }
  }

  step(dt = 1 / 20) {
    this.tick += 1;
    this.time += dt;
    this.cycle = (this.cycle + (dt * this.settings.cycleSpeed) / 300) % 1;
    const daylight = (Math.sin(this.cycle * TAU - Math.PI / 2) + 1) * 0.5;
    const isNight = daylight < 0.28;

    this.updateFood(dt);
    this.updateEffects(dt);

    for (const entity of this.entities) {
      this.updateEntity(entity, dt, isNight);

      if (isNight && SMALL_CREATURES.has(entity.species) && !EELS.has(entity.species)) {
        entity.vx *= 0.97;
        entity.vy = lerp(entity.vy, (FLOOR_Y - 10 - entity.y) * 0.2, 0.06);
      }

      if (isNight && entity.species === "anglerfish") {
        for (const other of this.entities) {
          if (SMALL_CREATURES.has(other.species) && distance(other, entity) < 54) {
            steerTo(other, entity.x, entity.y, 10, dt, 0.05);
          }
        }
      }
    }
  }

  getSnapshot() {
    return {
      tick: this.tick,
      time: this.time,
      cycle: this.cycle,
      isNight: (Math.sin(this.cycle * TAU - Math.PI / 2) + 1) * 0.5 < 0.28,
      settings: this.settings,
      hostId: this.hostId,
      players: Array.from(this.players.values()).map((player) => ({
        id: player.id,
        name: player.name,
        color: player.color,
        x: player.x,
        y: player.y,
        inside: player.inside,
        chatText: player.chatText,
        chatUntil: player.chatUntil
      })),
      food: this.food.map((food) => ({
        id: food.id,
        x: food.x,
        y: food.y
      })),
      effects: this.effects.map((effect) => ({
        id: effect.id,
        type: effect.type,
        x: effect.x,
        y: effect.y,
        ttl: effect.ttl,
        radius: effect.radius,
        color: effect.color
      })),
      entities: this.entities.map((entity) => ({
        id: entity.id,
        species: entity.species,
        name: entity.name,
        seed: entity.seed,
        x: entity.x,
        y: entity.y,
        vx: entity.vx,
        vy: entity.vy,
        angle: entity.angle,
        state: entity.state,
        scale: entity.scale,
        direction: entity.direction,
        pulse: entity.pulse,
        glow: entity.glow,
        lure: entity.lure,
        puffed: entity.puffed,
        anchorX: entity.anchorX,
        anchorY: entity.anchorY,
        emerge: entity.emerge,
        segments: entity.segments?.map((segment) => ({ x: segment.x, y: segment.y })) || null,
        waveUntil: entity.waveUntil,
        inkUntil: entity.inkUntil
      }))
    };
  }
}
