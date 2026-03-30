# Pixel Aquarium

Pixel Aquarium is now a shared, multi-species aquarium for Electron on macOS with a browser-friendly fallback view in the repo. The tank supports predators, jellyfish, eels, reef species, large gliders, decorative creatures, and authoritative multiplayer over WebSockets.

## New Species

- Predators: Great White Shark, Hammerhead Shark, Barracuda
- Jellyfish: Moon Jellyfish, Box Jellyfish, Lion's Mane Jellyfish
- Eels: Moray Eel, Garden Eel, Electric Eel
- Reef / Other: Pufferfish, Seahorse, Clownfish, Manta Ray, Anglerfish, Sea Turtle, Octopus, Swordfish, Starfish
- Existing schooling generic fish remain part of the ecosystem

## Ecosystem Rules

- Small fish flee sharks, barracuda, electric eel zaps, and sudden taps on the glass.
- Clownfish, generic fish, and garden eels group together.
- Predators ignore food. Feeders chase food. Jellyfish and starfish never eat.
- Seahorses attach to seaweed, clownfish orbit anemones, moray eels lunge from rock crevices, and octopus avoids nearby eels.
- Spawn balancing respects the prompt caps:
  - max 2 sharks
  - max 2 large jellyfish
  - max 1 octopus
  - max 15 generic fish
  - total cap adjustable up to 30

## Multiplayer

The app supports two modes:

- Local/offline fallback:
  - Runs the shared aquarium simulation inside the renderer with no server required.
- Hosted room:
  - The Electron main process starts a `ws` server on port `3476`
  - A 6-character room code is generated
  - Other clients join using `ws://HOST_IP:3476` plus the room code

Shared multiplayer features:

- authoritative creature simulation at 20 ticks per second
- synced feeding and tap-glass ripples
- shared user cursors with name tags
- join/leave toast notifications
- chat bubbles near player cursors

## Settings Panel

The updated panel includes:

- ecosystem presets
- balanced auto-populate mode
- total creature cap
- full species checklist and per-species sliders
- custom preset save/load via local storage
- multiplayer host/join/disconnect/chat controls

## Development

Install dependencies and run the Electron desktop app:

```bash
npm install
npm start
```

The repo also contains a browser entrypoint at [index.html](/Users/jj/pixel-aquarium/index.html) that embeds the renderer for Git-backed sharing.

## macOS Build / Xcode

Packaging config lives in [electron-builder.yml](/Users/jj/pixel-aquarium/electron-builder.yml).

Build commands:

```bash
npm run build:dir
npm run build:mac
```

Notes:

- Product name is `Pixel Aquarium`
- App ID is `com.iaji.pixelaquarium`
- DMG and unpacked `.app` targets are configured
- Native macOS menu entries and fullscreen support are enabled in [main.js](/Users/jj/pixel-aquarium/main.js)
- Dock badge updates with multiplayer player count
- For ad-hoc signing, run:

```bash
codesign --deep --force --sign - dist/mac/Pixel\\ Aquarium.app
```

The project folder can still be opened directly in Xcode for inspection/editing, but the runtime and packaging flow remain Electron-based.

## Repo URLs

- GitHub repo: [iaji-boop/fishy](https://github.com/iaji-boop/fishy)
- Repo-backed share URL: [https://raw.githack.com/iaji-boop/fishy/main/index.html](https://raw.githack.com/iaji-boop/fishy/main/index.html)
