import BaseCreatureRenderer, { withDirection } from "./base-creature.js";

export default class ClownfishRenderer extends BaseCreatureRenderer {
  draw(ctx) {
    const width = 16 * this.scale();
    const height = 10 * this.scale();
    const palette = {
      outline: "#3f1e15",
      body: "#ff8d28",
      shade: "#d96218",
      accent: "#fff7ee"
    };

    this.drawShadow(ctx, width, height, 0.16);

    withDirection(ctx, this.display.direction, () => {
      ctx.fillStyle = palette.outline;
      ctx.fillRect(-width * 0.48, -2, 4, 4);
      ctx.fillStyle = palette.body;
      ctx.fillRect(-width * 0.34, -height * 0.28, width * 0.68, height * 0.56);
      ctx.fillStyle = palette.shade;
      ctx.fillRect(-width * 0.26, height * 0.04, width * 0.48, height * 0.16);
      ctx.fillStyle = palette.accent;
      ctx.fillRect(-width * 0.08, -height * 0.3, 2, height * 0.6);
      ctx.fillRect(width * 0.06, -height * 0.28, 2, height * 0.56);
      ctx.fillStyle = palette.outline;
      ctx.fillRect(width * 0.2, -2, 2, 2);
    });
  }
}
