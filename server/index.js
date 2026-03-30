import os from "node:os";
import { WebSocketServer } from "ws";
import { createDefaultSettings, normalizeSettings } from "../shared/species.js";
import { AquariumRoom } from "./room.js";

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getPrimaryIpAddress() {
  const networks = os.networkInterfaces();

  for (const list of Object.values(networks)) {
    for (const item of list || []) {
      if (item.family === "IPv4" && !item.internal) {
        return item.address;
      }
    }
  }

  return "127.0.0.1";
}

export class AquariumServerController {
  constructor({ onStatsChange } = {}) {
    this.onStatsChange = onStatsChange;
    this.rooms = new Map();
    this.server = null;
    this.port = null;
  }

  async start(port = 3476) {
    if (this.server) {
      return { port: this.port };
    }

    await new Promise((resolve, reject) => {
      this.server = new WebSocketServer({ port }, () => {
        this.port = port;
        resolve();
      });

      this.server.on("connection", (socket, request) => {
        const url = new URL(request.url || "/", `ws://127.0.0.1:${this.port}`);
        const roomCode = url.searchParams.get("room");
        const name = url.searchParams.get("name") || "Guest";
        const color = url.searchParams.get("color") || "#8ee8ff";
        const room = roomCode ? this.rooms.get(roomCode) : null;

        if (!room) {
          socket.send(JSON.stringify({ type: "error", message: "Room not found." }));
          socket.close();
          return;
        }

        room.addConnection(socket, { name, color });
      });

      this.server.once("error", reject);
    });

    return {
      port: this.port,
      localAddress: getPrimaryIpAddress()
    };
  }

  async ensureRoom(settings = createDefaultSettings(), port = 3476) {
    await this.start(port);

    const roomCode = makeRoomCode();
    const room = new AquariumRoom({
      code: roomCode,
      settings: normalizeSettings(settings),
      onStatsChange: (stats) => this.onStatsChange?.(stats)
    });

    this.rooms.set(roomCode, room);

    return {
      roomCode,
      port: this.port,
      localAddress: getPrimaryIpAddress(),
      wsUrl: `ws://${getPrimaryIpAddress()}:${this.port}/?room=${roomCode}`
    };
  }

  updateRoomSettings(roomCode, settings, actorId = null) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return null;
    }
    return room.simulation.setSettings(settings, actorId);
  }

  getRoomInfo(roomCode) {
    if (!this.rooms.has(roomCode)) {
      return null;
    }

    return {
      roomCode,
      port: this.port,
      localAddress: getPrimaryIpAddress(),
      wsUrl: `ws://${getPrimaryIpAddress()}:${this.port}/?room=${roomCode}`
    };
  }

  stopRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return;
    }
    room.destroy();
    this.rooms.delete(roomCode);
    this.onStatsChange?.({
      roomCode,
      playerCount: 0
    });
  }

  stop() {
    for (const roomCode of this.rooms.keys()) {
      this.stopRoom(roomCode);
    }

    this.server?.close();
    this.server = null;
    this.port = null;
  }
}
