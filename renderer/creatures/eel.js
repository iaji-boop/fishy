import BaseCreatureRenderer from "./base-creature.js";

export default class EelRenderer extends BaseCreatureRenderer {
  draw(ctx, time) {
    const species = this.snapshot.species;
    const palette = this.palette(species === "electricEel" ? 74 : species === "gardenEel" ? 42 : 128);
    const segments = this.display.segments || [{ x: this.display.x, y: this.display.y }];
    const size = species === "gardenEel" ? 3 : species === "morayEel" ? 4 : 5;

    this.drawSegmentTrail(ctx, segments, palette.body, size);

    if (species === "electricEel") {
      ctx.fillStyle = palette.accent;
      ctx.fillRect(-2, -2, 4, 4);
    }

    if (species === "gardenEel") {
      ctx.fillStyle = palette.pale;
      ctx.fillRect(-1, -6 - Math.sin(time * 3 + this.display.pulse) * 2, 2, 6);
      return;
    }

    ctx.fillStyle = palette.outline;
    ctx.fillRect(-size, -size, size * 1.6, size * 1.3);
    ctx.fillStyle = palette.pale;
    ctx.fillRect(size * 0.2, -size * 0.6, 1, 1);
  }
}
