import { hsl } from "../utils.js";

export default class CursorSyncRenderer {
  render(ctx, players, selfId) {
    for (const player of players) {
      if (!player.inside || player.id === selfId) {
        continue;
      }

      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.fillStyle = player.color;
      ctx.fillRect(0, 0, 5, 2);
      ctx.fillRect(0, 0, 2, 6);
      ctx.fillRect(2, 2, 2, 4);

      ctx.fillStyle = hsl(210, 20, 8, 0.9);
      const labelWidth = Math.max(18, player.name.length * 4 + 6);
      ctx.fillRect(7, -6, labelWidth, 8);
      ctx.fillStyle = "#f5fbff";
      ctx.font = "5px monospace";
      ctx.fillText(player.name, 10, 0);
      ctx.restore();
    }
  }
}
