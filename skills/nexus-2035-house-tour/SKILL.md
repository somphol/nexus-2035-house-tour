---
name: nexus-2035-house-tour
description: Build a static Three.js futuristic house-tour studio with procedural rooms, orbit and walk cameras, a floor-plan minimap, smart-glass and circadian presets, inspectable props, localStorage persistence and JSON export/import. Use when recreating or extending the Nexus 2035 house tour or a similar single-page 3D architectural walkthrough.
---

# Nexus 2035 House Tour

A reusable recipe for a **single-page 3D architectural tour** with no build step, no
backend and no external art. The reference build is a four-bedroom smart home on a
cantilevered plinth above a neon city.

## What it produces

- A procedural residence: seven rooms, open-roof dollhouse shell, balcony, city below.
- Orbit and first-person walk cameras, cinematic room flights, an 8.2 s auto tour.
- A room drawer, clickable floor-plan minimap, compass, FPS and simulated telemetry.
- Smart-glass and circadian-lighting presets that move sky, sun, city, LEDs, room lights
  and the CSS accent together.
- Ten inspectable props with feature cards, specs and focus views.
- `localStorage` persistence plus `nexus2035_house_state.json` export/import.
- Three static files: `index.html`, `style.css`, `script.js`.

## When to use it

Use this skill to build or extend:

- a room-by-room 3D property or exhibition tour;
- a procedural interior scene with orbit + walk navigation;
- a single-page Three.js app that needs presets, minimap, inspection and portable state.

Do not use it for CAD, measured architectural drawings, multiplayer, or an offline-first
app. The reference build needs WebGL and, on first load, Three.js, OrbitControls and Google
Fonts from CDNs.

## Quick start

1. Copy `assets/template/index.html`, `style.css` and `script.js` into a new folder.
2. Serve it: `python3 -m http.server 8080`.
3. Open `http://localhost:8080/` and confirm the loader clears and the overview renders.
4. Read [references/method.md](references/method.md) before changing geometry or camera
   presets.
5. Run the checks in [references/verification.md](references/verification.md).

## Invariants to preserve

- **Metres, Y-up, no roof.** Floor at `y ≈ 0`, shell `x ∈ [-12, 12]`, `z ∈ [-9, 9]`,
  walls 3.35 m high, 0.18 m thick.
- **Seven rooms, ten features.** Room ids and camera presets are shared by the drawer,
  minimap, walk-region logic and auto tour.
- **A feature card needs a registered object.** Add `userData.feature`, push the group to
  `interactables`, and add a `FEATURES` record; a record alone is unreachable.
- **The save shape is versioned.** `nexus2035.tour.v1`, `STATE_VERSION = 1`. A change needs
  migration or a new key.
- **The auto tour restores off.** Do not start a moving camera on reload without a gesture.
- **The template is byte-identical.** `assets/template/*` must match the root sources.

## Files

- `assets/template/index.html` — shell, HUD, modals, loader, CDN tags.
- `assets/template/style.css` — glassmorphism design system and responsive layout.
- `assets/template/script.js` — engine, world, materials, presets, camera, persistence.
- [references/method.md](references/method.md) — build order and world contract.
- [references/lessons.md](references/lessons.md) — non-obvious decisions and limits.
- [references/verification.md](references/verification.md) — release checks.
- [ATTRIBUTION.md](ATTRIBUTION.md) — provenance and licences.
