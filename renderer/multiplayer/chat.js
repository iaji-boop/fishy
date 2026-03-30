export default class ChatOverlay {
  constructor(container) {
    this.container = container;
  }

  pushToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 180);
    }, 2800);
  }

  renderBubbles(ctx, players, selfId, time) {
    ctx.save();
    ctx.font = "5px monospace";
    for (const player of players) {
      if (player.id === selfId || !player.chatText || player.chatUntil <= time || !player.inside) {
        continue;
      }

      const width = Math.max(20, player.chatText.length * 4 + 8);
      ctx.fillStyle = "rgba(9, 16, 28, 0.9)";
      ctx.fillRect(player.x - width * 0.5, player.y - 18, width, 9);
      ctx.fillStyle = "#f5fbff";
      ctx.fillText(player.chatText, player.x - width * 0.5 + 4, player.y - 12);
    }
    ctx.restore();
  }
}
