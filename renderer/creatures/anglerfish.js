import BaseCreatureRenderer, { withDirection } from "./base-creature.js";
import { hsl } from "../utils.js";

export default class AnglerfishRenderer extends BaseCreatureRenderer {
  draw(ctx) {
    const palette = this.palette(248);
    const width = 18 * this.scale();
    const lureGlow = 0.3 + this.display.lure * 0.7;

    this.drawShadow(ctx, width, 10 * this.scale(), 0.2);

    withDirection(ctx, this.display.direction, () => {
      ctx.fillStyle = palette.body;
      ctx.fillRect(-width * 0.34, -4, width * 0.68, 8);
      ctx.fillStyle = palette.shade;
      ctx.fillRect(-width * 0.2, 1, width * 0.36, 2);
      ctx.fillStyle = palette.outline;
      ctx.fillRect(width * 0.16, -1, 2, 2);
      ctx.fillRect(-2, -7, 1, 5);
      ctx.fillStyle = hsl(46, 96, 72, lureGlow);
      ctx.fillRect(-3, -8, 3, 3);
    });
  }
}
