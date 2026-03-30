import BaseCreatureRenderer, { withDirection } from "./base-creature.js";

export default class SwordfishRenderer extends BaseCreatureRenderer {
  draw(ctx) {
    const palette = this.palette(212);
    const width = 30 * this.scale();

    this.drawShadow(ctx, width, 10 * this.scale(), 0.18);

    withDirection(ctx, this.display.direction, () => {
      ctx.fillStyle = palette.body;
      ctx.fillRect(-width * 0.38, -3, width * 0.6, 6);
      ctx.fillStyle = palette.accent;
      ctx.fillRect(width * 0.22, -1, width * 0.2, 2);
      ctx.fillStyle = palette.outline;
      ctx.fillRect(-width * 0.48, -2, 4, 4);
      ctx.fillRect(width * 0.12, -4, 4, 3);
      ctx.fillRect(width * 0.12, 1, 4, 3);
    });
  }
}
