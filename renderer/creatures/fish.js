import BaseCreatureRenderer, { withDirection } from "./base-creature.js";

export default class FishRenderer extends BaseCreatureRenderer {
  draw(ctx) {
    const barracuda = this.snapshot.species === "barracuda";
    const palette = this.palette(barracuda ? 196 : 34 + (this.snapshot.seed % 120));
    const width = barracuda ? 26 * this.scale() : 16 * this.scale();
    const height = barracuda ? 7 * this.scale() : 10 * this.scale();

    this.drawShadow(ctx, width, height, barracuda ? 0.24 : 0.18);

    withDirection(ctx, this.display.direction, () => {
      ctx.fillStyle = palette.outline;
      ctx.fillRect(-width * 0.5 - 3, -height * 0.15, 4, height * 0.35);
      ctx.fillRect(width * 0.12, -height * 0.42, 4, 3);

      ctx.fillStyle = palette.body;
      ctx.fillRect(-width * 0.35, -height * 0.3, width * 0.7, height * 0.6);
      ctx.fillStyle = palette.shade;
      ctx.fillRect(-width * 0.3, height * 0.05, width * 0.56, height * 0.2);
      ctx.fillStyle = palette.accent;
      ctx.fillRect(-width * 0.1, -height * 0.12, width * 0.22, barracuda ? 2 : 3);
      ctx.fillRect(width * 0.08, barracuda ? 0 : 1, width * 0.12, 2);
      ctx.fillStyle = palette.outline;
      ctx.fillRect(width * 0.24, -2, 2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(width * 0.28, -3, 1, 1);
    });
  }
}
