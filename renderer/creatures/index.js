import AnglerfishRenderer from "./anglerfish.js";
import BaseCreatureRenderer from "./base-creature.js";
import ClownfishRenderer from "./clownfish.js";
import EelRenderer from "./eel.js";
import FishRenderer from "./fish.js";
import JellyfishRenderer from "./jellyfish.js";
import MantaRayRenderer from "./manta-ray.js";
import OctopusRenderer from "./octopus.js";
import PufferfishRenderer from "./pufferfish.js";
import SeaTurtleRenderer from "./sea-turtle.js";
import SeahorseRenderer from "./seahorse.js";
import SharkRenderer from "./shark.js";
import StarfishRenderer from "./starfish.js";
import SwordfishRenderer from "./swordfish.js";

const REGISTRY = {
  genericFish: FishRenderer,
  barracuda: FishRenderer,
  greatWhiteShark: SharkRenderer,
  hammerheadShark: SharkRenderer,
  moonJellyfish: JellyfishRenderer,
  boxJellyfish: JellyfishRenderer,
  lionsManeJellyfish: JellyfishRenderer,
  morayEel: EelRenderer,
  gardenEel: EelRenderer,
  electricEel: EelRenderer,
  pufferfish: PufferfishRenderer,
  seahorse: SeahorseRenderer,
  clownfish: ClownfishRenderer,
  mantaRay: MantaRayRenderer,
  anglerfish: AnglerfishRenderer,
  seaTurtle: SeaTurtleRenderer,
  octopus: OctopusRenderer,
  swordfish: SwordfishRenderer,
  starfish: StarfishRenderer
};

export function createCreatureRenderer(snapshot) {
  const Renderer = REGISTRY[snapshot.species] || BaseCreatureRenderer;
  return new Renderer(snapshot);
}
