import { AquariumSimulation } from "../../shared/aquarium-simulation.js";
import { createDefaultSettings } from "../../shared/species.js";
import { PROTOCOL, decode, encode } from "../../server/protocol.js";

function buildRemoteUrl(target, roomCode, name, color) {
  const normalized = target.startsWith("ws://") || target.startsWith("wss://") ? target : `ws://${target}`;
  const url = new URL(normalized);
  if (roomCode) {
    url.searchParams.set("room", roomCode);
  }
  url.searchParams.set("name", name);
  url.searchParams.set("color", color);
  return url.toString();
}

export default class AquariumMultiplayerClient {
  constructor({ electronAPI, onSnapshot, onStateChange, onToast }) {
    this.electronAPI = electronAPI;
    this.onSnapshot = onSnapshot;
    this.onStateChange = onStateChange;
    this.onToast = onToast;
    this.mode = "local";
    this.selfId = "local-player";
    this.socket = null;
    this.localInterval = null;
    this.localSimulation = null;
    this.intentionalClose = false;
    this.connection = {
      connected: false,
      mode: "local",
      roomCode: null,
      localAddress: null,
      users: [],
      isHost: true
    };
  }

  setState(next) {
    this.connection = {
      ...this.connection,
      ...next
    };
    this.onStateChange?.({
      ...this.connection,
      selfId: this.selfId
    });
  }

  startLocal(settings = createDefaultSettings(), profile = { name: "Local Guest", color: "#8ee8ff" }) {
    this.disconnect({ silent: true });
    this.mode = "local";
    this.selfId = "local-player";
    this.localSimulation = new AquariumSimulation(settings);
    this.localSimulation.addPlayer(this.selfId, {
      name: profile.name,
      color: profile.color,
      isHost: true
    });

    this.localInterval = setInterval(() => {
      this.localSimulation.step(1 / 20);
      this.onSnapshot?.(this.localSimulation.getSnapshot());
      this.setState({
        connected: true,
        mode: "local",
        roomCode: "LOCAL",
        localAddress: "Offline",
        users: this.localSimulation.getSnapshot().players,
        isHost: true
      });
    }, 50);
  }

  async hostElectron(settings, profile) {
    if (!this.electronAPI?.hostAquarium) {
      this.startLocal(settings, profile);
      this.onToast?.("Multiplayer host is unavailable in the web version. Staying in local mode.");
      return;
    }

    const hosted = await this.electronAPI.hostAquarium({
      settings,
      roomCode: null
    });

    await this.connectRemote(
      buildRemoteUrl(`ws://127.0.0.1:${hosted.port}`, hosted.roomCode, profile.name, profile.color),
      {
        hosted: true,
        roomCode: hosted.roomCode,
        localAddress: hosted.localAddress
      }
    );
  }

  async joinRemote(target, roomCode, profile) {
    const url = buildRemoteUrl(target, roomCode, profile.name, profile.color);
    await this.connectRemote(url, {
      hosted: false,
      roomCode
    });
  }

  async connectRemote(url, { hosted, roomCode, localAddress }) {
    this.disconnect({ silent: true });
    this.mode = hosted ? "host" : "remote";

    await new Promise((resolve, reject) => {
      this.socket = new WebSocket(url);
      this.intentionalClose = false;

      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
      this.socket.addEventListener("message", (event) => this.handleMessage(event.data));
      this.socket.addEventListener("close", () => {
        if (!this.intentionalClose && this.mode !== "local") {
          this.onToast?.("Connection lost. Falling back to local aquarium.");
          this.startLocal(createDefaultSettings(), {
            name: "Local Guest",
            color: "#8ee8ff"
          });
        }
      });
    });

    this.setState({
      connected: true,
      mode: this.mode,
      roomCode,
      localAddress: localAddress || null,
      users: [],
      isHost: hosted
    });
  }

  handleMessage(raw) {
    const message = decode(raw);
    if (!message?.type) {
      return;
    }

    switch (message.type) {
      case PROTOCOL.WELCOME:
        this.selfId = message.playerId;
        this.onSnapshot?.(message.snapshot);
        this.setState({
          connected: true,
          mode: this.mode,
          roomCode: message.roomCode,
          users: message.snapshot.players,
          isHost: message.playerId === message.hostId
        });
        break;
      case PROTOCOL.SNAPSHOT:
        this.onSnapshot?.(message.snapshot);
        this.setState({
          users: message.snapshot.players,
          isHost: this.selfId === message.snapshot.hostId
        });
        break;
      case PROTOCOL.PLAYER_JOINED:
        this.onToast?.(`🐠 ${message.player.name} joined the aquarium`);
        break;
      case PROTOCOL.PLAYER_LEFT:
        this.onToast?.(`🐠 ${message.name} left the aquarium`);
        break;
      case PROTOCOL.SETTINGS:
        this.onStateChange?.({
          ...this.connection,
          selfId: this.selfId,
          syncedSettings: message.settings
        });
        break;
      case PROTOCOL.CHAT:
        this.onToast?.(`${message.name}: ${message.text}`);
        break;
      default:
        break;
    }
  }

  send(type, payload) {
    if (this.mode === "local") {
      return;
    }
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(encode({ type, ...payload }));
    }
  }

  updateCursor(cursor) {
    if (this.mode === "local") {
      this.localSimulation?.setCursor(this.selfId, cursor);
      return;
    }
    this.send(PROTOCOL.CURSOR, cursor);
  }

  tap(x, y) {
    if (this.mode === "local") {
      this.localSimulation?.handleTap(this.selfId, x, y);
      return;
    }
    this.send(PROTOCOL.TAP, { x, y });
  }

  feed(x, y) {
    if (this.mode === "local") {
      this.localSimulation?.handleFeed(this.selfId, x, y);
      return;
    }
    this.send(PROTOCOL.FEED, { x, y });
  }

  updateSettings(settings) {
    if (this.mode === "local") {
      this.localSimulation?.setSettings(settings, this.selfId);
      return;
    }
    this.send(PROTOCOL.SETTINGS, { settings });
  }

  sendChat(text) {
    if (!text.trim()) {
      return;
    }

    if (this.mode === "local") {
      this.localSimulation?.setChat(this.selfId, text);
      return;
    }

    this.send(PROTOCOL.CHAT, { text });
  }

  disconnect({ silent = false } = {}) {
    clearInterval(this.localInterval);
    this.localInterval = null;
    this.localSimulation = null;

    if (this.socket) {
      const socket = this.socket;
      this.socket = null;
      this.intentionalClose = true;
      socket.close();
    }

    if (!silent) {
      this.setState({
        connected: false,
        mode: "disconnected",
        roomCode: null,
        localAddress: null,
        users: [],
        isHost: false
      });
    }
  }
}
