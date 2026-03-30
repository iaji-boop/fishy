import BaseCreatureRenderer from "./base-creature.js";

export default class SeahorseRenderer extends BaseCreatureRenderer {
  draw(ctx, time) {
    const palette = this.palette(162);
    const size = 10 * this.scale();
    const curl = Math.sin(time * 2 + this.display.pulse) * 2;

    ctx.fillStyle = palette.body;
    ctx.fillRect(-2, -size * 0.5, 4, size * 0.8);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(-1, -size * 0.72, 3, 4);
    ctx.fillRect(1, size * 0.12, 3, 2);
    ctx.fillStyle = palette.outline;
    ctx.fillRect(1, -size * 0.56, 1, 1);
    ctx.fillRect(-3 + curl, size * 0.22, 2, 2);
    ctx.fillRect(-4 + curl, size * 0.34, 2, 2);
  }
}
