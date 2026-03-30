export const PROTOCOL = {
  HELLO: "hello",
  WELCOME: "welcome",
  SNAPSHOT: "snapshot",
  CURSOR: "cursor",
  TAP: "tap",
  FEED: "feed",
  SETTINGS: "settings",
  CHAT: "chat",
  PLAYER_JOINED: "player-joined",
  PLAYER_LEFT: "player-left",
  ERROR: "error"
};

export function encode(message) {
  return JSON.stringify(message);
}

export function decode(raw) {
  try {
    return JSON.parse(String(raw));
  } catch {
    return null;
  }
}
