import { createId } from "../shared/math.js";
import { AquariumSimulation } from "./simulation.js";
import { PROTOCOL, decode, encode } from "./protocol.js";

export class AquariumRoom {
  constructor({ code, settings, onStatsChange }) {
    this.code = code;
    this.simulation = new AquariumSimulation(settings);
    this.connections = new Map();
    this.onStatsChange = onStatsChange;
    this.interval = setInterval(() => this.tick(), 50);
  }

  addConnection(socket, { name, color }) {
    const playerId = createId("player");
    const player = this.simulation.addPlayer(playerId, {
      name,
      color,
      isHost: this.connections.size === 0
    });

    this.connections.set(playerId, socket);

    socket.send(
      encode({
        type: PROTOCOL.WELCOME,
        playerId,
        roomCode: this.code,
        hostId: this.simulation.hostId,
        settings: this.simulation.settings,
        snapshot: this.simulation.getSnapshot()
      })
    );

    this.broadcast({
      type: PROTOCOL.PLAYER_JOINED,
      player
    });

    socket.on("message", (raw) => {
      const message = decode(raw);
      if (!message?.type) {
        return;
      }
      this.handleMessage(playerId, message);
    });

    socket.on("close", () => {
      this.removeConnection(playerId);
    });

    this.emitStats();
  }

  removeConnection(playerId) {
    if (!this.connections.has(playerId)) {
      return;
    }

    const player = this.simulation.players.get(playerId);
    this.connections.delete(playerId);
    this.simulation.removePlayer(playerId);

    this.broadcast({
      type: PROTOCOL.PLAYER_LEFT,
      playerId,
      name: player?.name || "Guest"
    });

    this.emitStats();
  }

  handleMessage(playerId, message) {
    switch (message.type) {
      case PROTOCOL.CURSOR:
        this.simulation.setCursor(playerId, message);
        break;
      case PROTOCOL.TAP:
        this.simulation.handleTap(playerId, Number(message.x), Number(message.y));
        break;
      case PROTOCOL.FEED:
        this.simulation.handleFeed(playerId, Number(message.x), Number(message.y));
        break;
      case PROTOCOL.SETTINGS: {
        const settings = this.simulation.setSettings(message.settings, playerId);
        this.broadcast({
          type: PROTOCOL.SETTINGS,
          settings
        });
        break;
      }
      case PROTOCOL.CHAT: {
        this.simulation.setChat(playerId, message.text);
        const player = this.simulation.players.get(playerId);
        this.broadcast({
          type: PROTOCOL.CHAT,
          playerId,
          name: player?.name || "Guest",
          color: player?.color || "#8ee8ff",
          text: String(message.text || "")
        });
        break;
      }
      default:
        break;
    }
  }

  tick() {
    this.simulation.step(1 / 20);
    this.broadcast({
      type: PROTOCOL.SNAPSHOT,
      snapshot: this.simulation.getSnapshot()
    });
  }

  broadcast(message) {
    const payload = encode(message);
    for (const socket of this.connections.values()) {
      if (socket.readyState === 1) {
        socket.send(payload);
      }
    }
  }

  emitStats() {
    this.onStatsChange?.({
      roomCode: this.code,
      playerCount: this.connections.size
    });
  }

  destroy() {
    clearInterval(this.interval);
    for (const socket of this.connections.values()) {
      socket.close();
    }
    this.connections.clear();
  }
}
