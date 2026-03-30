import BaseCreatureRenderer, { withDirection } from "./base-creature.js";

export default class MantaRayRenderer extends BaseCreatureRenderer {
  draw(ctx, time) {
    const palette = this.palette(210);
    const width = 28 * this.scale();
    const flap = Math.sin(time * 4 + this.display.pulse) * 3;

    withDirection(ctx, this.display.direction, () => {
      ctx.fillStyle = palette.body;
      ctx.fillRect(-width * 0.44, -4 - flap * 0.1, width * 0.88, 8);
      ctx.fillRect(-width * 0.14, -7, width * 0.28, 14);
      ctx.fillStyle = palette.shade;
      ctx.fillRect(-width * 0.24, 1, width * 0.48, 2);
      ctx.fillStyle = palette.outline;
      ctx.fillRect(width * 0.34, -1, 3, 2);
    });
  }
}
