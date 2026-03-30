import BaseCreatureRenderer from "./base-creature.js";

export default class JellyfishRenderer extends BaseCreatureRenderer {
  draw(ctx, time) {
    const species = this.snapshot.species;
    const palette = this.palette(species === "boxJellyfish" ? 340 : species === "lionsManeJellyfish" ? 28 : 202);
    const size = (species === "lionsManeJellyfish" ? 18 : species === "moonJellyfish" ? 13 : 10) * this.scale();
    const pulse = 1 + Math.sin(time * 3 + this.display.pulse) * 0.08;
    const width = size * pulse;
    const height = size * 0.9;

    ctx.fillStyle = palette.glow;
    ctx.fillRect(-width * 0.8, -height * 0.8, width * 1.6, height * 1.6);
    ctx.fillStyle = palette.pale;
    ctx.fillRect(-width * 0.45, -height * 0.48, width * 0.9, height * 0.48);
    ctx.fillStyle = palette.body;
    ctx.fillRect(-width * 0.36, -height * 0.24, width * 0.72, height * 0.32);
    ctx.fillStyle = palette.shade;
    ctx.fillRect(-width * 0.22, 0, width * 0.44, 2);

    ctx.fillStyle = species === "boxJellyfish" ? palette.accent : palette.outline;
    const tentacleCount = species === "lionsManeJellyfish" ? 8 : species === "moonJellyfish" ? 5 : 6;
    for (let index = 0; index < tentacleCount; index += 1) {
      const offset = -width * 0.3 + index * (width * 0.12);
      const sway = Math.sin(time * 2 + this.display.glow + index) * (species === "lionsManeJellyfish" ? 5 : 3);
      const length = species === "lionsManeJellyfish" ? height + 16 : height + 7;
      ctx.fillRect(offset + sway * 0.1, 1, 1, length);
    }
  }
}
