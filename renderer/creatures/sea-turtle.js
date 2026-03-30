import BaseCreatureRenderer, { withDirection } from "./base-creature.js";

export default class SeaTurtleRenderer extends BaseCreatureRenderer {
  draw(ctx) {
    const palette = this.palette(126);
    const width = 24 * this.scale();
    const height = 14 * this.scale();

    this.drawShadow(ctx, width, height, 0.22);

    withDirection(ctx, this.display.direction, () => {
      ctx.fillStyle = palette.body;
      ctx.fillRect(-width * 0.2, -height * 0.26, width * 0.4, height * 0.52);
      ctx.fillStyle = palette.accent;
      ctx.fillRect(-width * 0.08, -height * 0.12, width * 0.16, height * 0.24);
      ctx.fillStyle = palette.pale;
      ctx.fillRect(width * 0.2, -height * 0.16, 4, 4);
      ctx.fillRect(-width * 0.34, -height * 0.24, 4, 3);
      ctx.fillRect(-width * 0.34, height * 0.1, 4, 3);
      ctx.fillRect(width * 0.04, -height * 0.46, 4, 3);
      ctx.fillRect(width * 0.04, height * 0.26, 4, 3);
    });
  }
}
