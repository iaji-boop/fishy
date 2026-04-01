# Pixel Aquarium

Pixel Aquarium is a frameless Electron desktop app that renders a low-resolution pixel-art aquarium on an HTML5 canvas. Fish are procedurally styled, follow boids-inspired steering, react to the mouse, flee from taps, eat falling food, and settle into a sleep state during the night cycle.

## Features

- 320x180 internal pixel-art scene scaled crisply to the full window.
- Procedurally generated fish built from randomized body masks, fins, tails, eye styles, and palette variations.
- Fish AI states for idle wandering, curiosity, fleeing, feeding, and sleeping.
- Parallax-inspired aquarium background with seaweed sway, bubbles, light rays, shells, pebbles, and a treasure chest bubble burst.
- Pixel-styled settings overlay with fish count, bubble density, day/night speed, always-on-top, and theme controls.
- Frameless resizable window plus tray menu actions for Show, Settings, Always On Top, and Quit.

## Project Structure

```text
pixel-aquarium/
├── main.js
├── preload.js
├── renderer/
│   ├── index.html
│   ├── app.js
│   ├── aquarium.js
│   ├── fish.js
│   ├── particles.js
│   ├── background.js
│   └── utils.js
├── assets/
│   └── sprites/
├── package.json
└── README.md
```

## Setup

```bash
npm install
npm start
```

## Web Version

The browser-shareable build is the static site in [renderer/index.html](/Users/jj/pixel-aquarium/renderer/index.html). It runs without Electron, and the desktop-only always-on-top control is hidden automatically on the web.

For a local preview of the website version:

```bash
cd renderer
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

## Interaction

- Move the mouse near fish to pull them into a curious follow state.
- Click to tap the glass, generate a ripple, and scare nearby fish.
- Move the mouse quickly to scatter fish without clicking.
- Double-click anywhere to drop food particles that sink toward the bottom.
- Hover over a fish to reveal its generated name.

## Notes

- The scene targets 60fps via `requestAnimationFrame`.
- Sprites are generated at runtime, so there are no external fish sheets to manage.
- Closing or minimizing the window hides the app to the system tray instead of exiting immediately.
