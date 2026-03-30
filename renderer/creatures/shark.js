import BaseCreatureRenderer, { withDirection } from "./base-creature.js";

export default class SharkRenderer extends BaseCreatureRenderer {
  draw(ctx) {
    const hammerhead = this.snapshot.species === "hammerheadShark";
    const palette = this.palette(204);
    const width = (hammerhead ? 30 : 34) * this.scale();
    const height = (hammerhead ? 12 : 13) * this.scale();

    this.drawShadow(ctx, width, height, 0.26);

    withDirection(ctx, this.display.direction, () => {
      ctx.fillStyle = palette.outline;
      ctx.fillRect(-width * 0.48, -2, 5, 4);
      ctx.fillRect(-width * 0.04, -height * 0.56, 5, 4);

      ctx.fillStyle = palette.body;
      ctx.fillRect(-width * 0.34, -height * 0.34, width * 0.68, height * 0.68);
      ctx.fillStyle = palette.shade;
      ctx.fillRect(-width * 0.28, height * 0.02, width * 0.52, height * 0.18);

      if (hammerhead) {
        ctx.fillStyle = palette.body;
        ctx.fillRect(width * 0.18, -height * 0.28, width * 0.22, height * 0.56);
        ctx.fillStyle = palette.outline;
        ctx.fillRect(width * 0.36, -height * 0.4, 2, height * 0.8);
      } else {
        ctx.fillStyle = palette.body;
        ctx.fillRect(width * 0.18, -height * 0.22, width * 0.18, height * 0.44);
      }

      ctx.fillStyle = palette.accent;
      ctx.fillRect(-width * 0.04, -height * 0.52, 4, 5);
      ctx.fillRect(-width * 0.08, height * 0.24, 5, 3);
      ctx.fillStyle = palette.outline;
      ctx.fillRect(width * 0.12, -2, 2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(width * 0.16, -3, 1, 1);
    });
  }
}
