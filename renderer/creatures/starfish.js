import BaseCreatureRenderer from "./base-creature.js";
import { clamp } from "../utils.js";

export default class StarfishRenderer extends BaseCreatureRenderer {
  draw(ctx, time) {
    const palette = this.palette(24);
    const waving = clamp((this.snapshot.waveUntil - time) / 4, 0, 1);
    const pulse = 1 + Math.sin(time * 4 + this.display.pulse) * 0.04 * waving;
    const size = 7 * this.scale() * pulse;

    ctx.fillStyle = palette.body;
    ctx.fillRect(-1, -size * 0.42, 2, size * 0.84);
    ctx.fillRect(-size * 0.42, -1, size * 0.84, 2);
    ctx.fillRect(-size * 0.28, -size * 0.28, size * 0.56, size * 0.56);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(0, 0, 1, 1);
  }
}
