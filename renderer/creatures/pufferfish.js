import BaseCreatureRenderer, { withDirection } from "./base-creature.js";

export default class PufferfishRenderer extends BaseCreatureRenderer {
  draw(ctx) {
    const palette = this.palette(54);
    const puffed = this.snapshot.puffed;
    const size = (puffed ? 14 : 9) * this.scale();

    this.drawShadow(ctx, size * 1.5, size, 0.18);

    withDirection(ctx, this.display.direction, () => {
      ctx.fillStyle = palette.body;
      ctx.fillRect(-size * 0.45, -size * 0.4, size * 0.9, size * 0.8);
      ctx.fillStyle = palette.shade;
      ctx.fillRect(-size * 0.35, size * 0.05, size * 0.7, size * 0.18);
      ctx.fillStyle = palette.outline;
      ctx.fillRect(size * 0.18, -2, 2, 2);
      if (puffed) {
        ctx.fillStyle = palette.accent;
        for (let index = -2; index <= 2; index += 1) {
          ctx.fillRect(index * 3, -size * 0.55, 1, 3);
          ctx.fillRect(index * 3, size * 0.32, 1, 3);
        }
      }
    });
  }
}
