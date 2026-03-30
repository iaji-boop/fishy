import { clamp } from "./math.js";

export const BASE_WIDTH = 320;
export const BASE_HEIGHT = 180;
export const MAX_TOTAL_CREATURES = 30;

export const SPECIES_ORDER = [
  "genericFish",
  "greatWhiteShark",
  "hammerheadShark",
  "barracuda",
  "moonJellyfish",
  "boxJellyfish",
  "lionsManeJellyfish",
  "morayEel",
  "gardenEel",
  "electricEel",
  "pufferfish",
  "seahorse",
  "clownfish",
  "mantaRay",
  "anglerfish",
  "seaTurtle",
  "octopus",
  "swordfish",
  "starfish"
];

export const SPECIES = {
  genericFish: {
    id: "genericFish",
    label: "Generic Fish",
    renderer: "fish",
    category: "Schooling Fish",
    sizeScale: 1,
    defaultCount: 6,
    maxCount: 15,
    schooling: true,
    canEatFood: true,
    zone: "mid",
    importance: 8
  },
  greatWhiteShark: {
    id: "greatWhiteShark",
    label: "Great White Shark",
    renderer: "shark",
    category: "Predator",
    sizeScale: 3,
    defaultCount: 1,
    maxCount: 2,
    predator: true,
    fearRadius: 60,
    zone: "wide",
    importance: 2
  },
  hammerheadShark: {
    id: "hammerheadShark",
    label: "Hammerhead Shark",
    renderer: "shark",
    category: "Predator",
    sizeScale: 2.5,
    defaultCount: 1,
    maxCount: 2,
    predator: true,
    fearRadius: 52,
    zone: "bottom",
    importance: 2
  },
  barracuda: {
    id: "barracuda",
    label: "Barracuda",
    renderer: "fish",
    category: "Predator",
    sizeScale: 2,
    defaultCount: 1,
    maxCount: 2,
    predator: true,
    fearRadius: 40,
    zone: "mid",
    importance: 3
  },
  moonJellyfish: {
    id: "moonJellyfish",
    label: "Moon Jellyfish",
    renderer: "jellyfish",
    category: "Jellyfish",
    sizeScale: 1.4,
    defaultCount: 1,
    maxCount: 4,
    zone: "mid",
    importance: 5
  },
  boxJellyfish: {
    id: "boxJellyfish",
    label: "Box Jellyfish",
    renderer: "jellyfish",
    category: "Jellyfish",
    sizeScale: 1,
    defaultCount: 1,
    maxCount: 4,
    zone: "mid",
    importance: 4
  },
  lionsManeJellyfish: {
    id: "lionsManeJellyfish",
    label: "Lion's Mane Jellyfish",
    renderer: "jellyfish",
    category: "Jellyfish",
    sizeScale: 2,
    defaultCount: 1,
    maxCount: 2,
    zone: "mid",
    importance: 1
  },
  morayEel: {
    id: "morayEel",
    label: "Moray Eel",
    renderer: "eel",
    category: "Eel",
    sizeScale: 1.8,
    defaultCount: 1,
    maxCount: 2,
    canEatFood: true,
    zone: "anchor",
    importance: 2
  },
  gardenEel: {
    id: "gardenEel",
    label: "Garden Eel",
    renderer: "eel",
    category: "Eel",
    sizeScale: 1.2,
    defaultCount: 3,
    maxCount: 5,
    schooling: true,
    canEatFood: true,
    zone: "sand",
    importance: 5
  },
  electricEel: {
    id: "electricEel",
    label: "Electric Eel",
    renderer: "eel",
    category: "Eel",
    sizeScale: 1.9,
    defaultCount: 1,
    maxCount: 2,
    canEatFood: true,
    zone: "bottom",
    importance: 2
  },
  pufferfish: {
    id: "pufferfish",
    label: "Pufferfish",
    renderer: "pufferfish",
    category: "Small Fish",
    sizeScale: 1,
    defaultCount: 2,
    maxCount: 4,
    canEatFood: true,
    zone: "mid",
    importance: 4
  },
  seahorse: {
    id: "seahorse",
    label: "Seahorse",
    renderer: "seahorse",
    category: "Reef",
    sizeScale: 1,
    defaultCount: 2,
    maxCount: 4,
    canEatFood: true,
    zone: "mid",
    importance: 4
  },
  clownfish: {
    id: "clownfish",
    label: "Clownfish",
    renderer: "clownfish",
    category: "Schooling Fish",
    sizeScale: 1,
    defaultCount: 3,
    maxCount: 6,
    schooling: true,
    canEatFood: true,
    zone: "reef",
    importance: 6
  },
  mantaRay: {
    id: "mantaRay",
    label: "Manta Ray",
    renderer: "mantaRay",
    category: "Large",
    sizeScale: 2.4,
    defaultCount: 1,
    maxCount: 2,
    zone: "upper",
    importance: 2
  },
  anglerfish: {
    id: "anglerfish",
    label: "Anglerfish",
    renderer: "anglerfish",
    category: "Deep Ocean",
    sizeScale: 1.4,
    defaultCount: 1,
    maxCount: 2,
    zone: "bottom",
    importance: 2
  },
  seaTurtle: {
    id: "seaTurtle",
    label: "Sea Turtle",
    renderer: "seaTurtle",
    category: "Large",
    sizeScale: 2.1,
    defaultCount: 1,
    maxCount: 2,
    zone: "wide",
    importance: 2
  },
  octopus: {
    id: "octopus",
    label: "Octopus",
    renderer: "octopus",
    category: "Deep Ocean",
    sizeScale: 1.6,
    defaultCount: 1,
    maxCount: 1,
    zone: "bottom",
    importance: 1
  },
  swordfish: {
    id: "swordfish",
    label: "Swordfish",
    renderer: "swordfish",
    category: "Predator",
    sizeScale: 2,
    defaultCount: 1,
    maxCount: 2,
    predator: true,
    fearRadius: 30,
    zone: "wide",
    importance: 2
  },
  starfish: {
    id: "starfish",
    label: "Starfish",
    renderer: "starfish",
    category: "Decorative",
    sizeScale: 0.9,
    defaultCount: 2,
    maxCount: 5,
    zone: "sand",
    importance: 5
  }
};

export const SPECIES_GROUP_CAPS = {
  sharks: 2,
  largeJellyfish: 2,
  octopus: 1
};

export const PRESETS = {
  coralReef: {
    id: "coralReef",
    label: "Coral Reef",
    counts: {
      genericFish: 6,
      clownfish: 3,
      seahorse: 3,
      pufferfish: 2,
      moonJellyfish: 1,
      boxJellyfish: 1,
      seaTurtle: 1,
      starfish: 1
    }
  },
  deepOcean: {
    id: "deepOcean",
    label: "Deep Ocean",
    counts: {
      anglerfish: 1,
      morayEel: 1,
      gardenEel: 3,
      electricEel: 1,
      octopus: 1,
      lionsManeJellyfish: 1,
      boxJellyfish: 1,
      barracuda: 1,
      swordfish: 1,
      genericFish: 2
    }
  },
  sharkTank: {
    id: "sharkTank",
    label: "Shark Tank",
    counts: {
      greatWhiteShark: 1,
      hammerheadShark: 1,
      barracuda: 1,
      swordfish: 2,
      mantaRay: 1,
      genericFish: 4
    }
  },
  peaceful: {
    id: "peaceful",
    label: "Peaceful",
    counts: {
      seahorse: 3,
      starfish: 3,
      moonJellyfish: 2,
      boxJellyfish: 1,
      seaTurtle: 1,
      genericFish: 6,
      clownfish: 2,
      gardenEel: 3
    }
  },
  everything: {
    id: "everything",
    label: "Everything",
    counts: {
      genericFish: 5,
      greatWhiteShark: 1,
      hammerheadShark: 1,
      barracuda: 1,
      moonJellyfish: 1,
      boxJellyfish: 1,
      lionsManeJellyfish: 1,
      morayEel: 1,
      gardenEel: 3,
      electricEel: 1,
      pufferfish: 2,
      seahorse: 2,
      clownfish: 3,
      mantaRay: 1,
      anglerfish: 1,
      seaTurtle: 1,
      octopus: 1,
      swordfish: 1,
      starfish: 2
    }
  }
};

export const DECORATIONS = {
  anemones: [
    { x: 78, y: 149 },
    { x: 228, y: 150 }
  ],
  eelCrevices: [
    { x: 58, y: 142 },
    { x: 185, y: 144 },
    { x: 256, y: 143 }
  ],
  seaweedAnchors: [28, 46, 64, 84, 110, 136, 168, 192, 220, 246, 272, 294]
};

export function createDefaultSettings() {
  const species = {};
  for (const speciesId of SPECIES_ORDER) {
    const meta = SPECIES[speciesId];
    species[speciesId] = {
      enabled: meta.defaultCount > 0,
      count: meta.defaultCount
    };
  }

  return {
    theme: "ocean",
    bubbleDensity: 1,
    cycleSpeed: 1,
    alwaysOnTop: false,
    totalCap: 24,
    balancedAuto: true,
    preset: "everything",
    species
  };
}

export function cloneSettings(settings) {
  return JSON.parse(JSON.stringify(settings));
}

export function applyPresetToSettings(presetId, source = createDefaultSettings()) {
  const settings = cloneSettings(source);
  const preset = PRESETS[presetId] || PRESETS.everything;

  settings.preset = preset.id;
  settings.balancedAuto = true;

  for (const speciesId of SPECIES_ORDER) {
    const count = preset.counts[speciesId] || 0;
    settings.species[speciesId] = {
      enabled: count > 0,
      count
    };
  }

  return normalizeSettings(settings);
}

export function normalizeSettings(settings) {
  const base = createDefaultSettings();
  const next = cloneSettings(base);

  next.theme = settings?.theme || base.theme;
  next.bubbleDensity = clamp(Number(settings?.bubbleDensity ?? base.bubbleDensity), 0, 2);
  next.cycleSpeed = clamp(Number(settings?.cycleSpeed ?? base.cycleSpeed), 0.25, 3);
  next.alwaysOnTop = Boolean(settings?.alwaysOnTop);
  next.totalCap = clamp(Math.round(Number(settings?.totalCap ?? base.totalCap)), 1, MAX_TOTAL_CREATURES);
  next.balancedAuto = settings?.balancedAuto ?? base.balancedAuto;
  next.preset = PRESETS[settings?.preset] ? settings.preset : base.preset;

  for (const speciesId of SPECIES_ORDER) {
    const meta = SPECIES[speciesId];
    const incoming = settings?.species?.[speciesId];
    next.species[speciesId] = {
      enabled: incoming?.enabled ?? base.species[speciesId].enabled,
      count: clamp(Math.round(Number(incoming?.count ?? base.species[speciesId].count)), 0, meta.maxCount)
    };
  }

  return next;
}
