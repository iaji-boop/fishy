import BaseCreatureRenderer from "./base-creature.js";

export default class OctopusRenderer extends BaseCreatureRenderer {
  draw(ctx, time) {
    const palette = this.palette(278 + Math.sin(time * 0.4 + this.display.glow) * 26);
    const size = 12 * this.scale();
    const segments = this.display.segments || [];

    this.drawShadow(ctx, size * 1.2, size, 0.2);
    ctx.fillStyle = palette.body;
    ctx.fillRect(-size * 0.35, -size * 0.4, size * 0.7, size * 0.64);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(-2, -size * 0.22, 4, 2);
    this.drawSegmentTrail(ctx, segments, palette.shade, 2.4);
    ctx.fillStyle = palette.outline;
    ctx.fillRect(2, -size * 0.18, 1, 1);
    ctx.fillRect(-3, -size * 0.18, 1, 1);
  }
}
