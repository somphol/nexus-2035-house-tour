# AGENTS.md — NEXUS 2035 HOUSE TOUR

> Handoff for the next maintainer or agent. The rebuild book is
> [docs/REPRODUCTION.md](docs/REPRODUCTION.md); the technical map is
> [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); evidence is
> [docs/TESTING.md](docs/TESTING.md).

## 1. What this is

A static, three-file **3D house-tour studio**: `index.html`, `style.css` and a 3,525-line
IIFE in `script.js`, with **Three.js r128** and OrbitControls from CDNs. It renders a
procedural four-bedroom smart home on a cantilevered plinth above a neon city: seven
rooms, ten inspectable props, orbit and first-person walk modes, a room drawer, a
clickable floor-plan minimap, smart-glass tints, circadian lighting presets, an 8.2-second
auto tour, a simulated-telemetry HUD, and `localStorage` persistence with JSON
export/import.

It is **not** a CAD or architectural design tool, not a real property listing, not
server-backed, not multiplayer, and **not offline-capable**: the first load needs Three.js,
OrbitControls and Google Fonts. It has **no audio** and no backend. Camera, room, lighting,
glass and pinned presets persist; the auto tour always restores off.

Live copy: <https://somphol.github.io/nexus-2035-house-tour/>. Local master:
`~/Projects/nexus-2035-house-tour`. App version **1.0.0**, state schema **1**
(`script.js:18–20`); there is no git tag. Latest source commit at the time of writing:
`3454a78`.

## 2. Commands

```bash
cd ~/Projects/nexus-2035-house-tour

# run
python3 -m http.server 8080
open http://localhost:8080/

# syntax + release check (no dependencies)
node --check script.js
node scripts/check.mjs

# skill check (optional, uses the local skill-publish tooling)
node ~/.config/opencode/skills/skill-publish/scripts/check-skill.mjs \
  skills/nexus-2035-house-tour

# headless render — this app needs SwiftShader flags, not --use-angle=metal
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --use-gl=angle --use-angle=swiftshader \
  --enable-unsafe-swiftshader --mute-audio \
  --virtual-time-budget=20000 --timeout=30000 --window-size=1440,900 \
  --screenshot=/tmp/nexus.png "http://localhost:8080/"

# live probe
curl -s -o /dev/null -w '%{http_code}\n' https://somphol.github.io/nexus-2035-house-tour/

# deploy — Pages serves the repository root of main; no workflow
git push origin main
```

`scripts/check.mjs` is the release gate: required files, local asset/Markdown links,
JavaScript syntax, JSON parsing, skill-template byte equality, README documentation links
and app invariants. Keep it green. There is no CI workflow.

## 3. Architecture

| File | Lines | Role |
| --- | ---: | --- |
| `index.html` | 288 | canvas, top bar, room drawer, telemetry/minimap, dock, feature card, help card, toasts, loader, CDN tags |
| `style.css` | 1,807 | tokens, glass panels, responsive layout, lighting accent themes, reduced motion |
| `script.js` | 3,525 | engine, architecture, props, materials, environment, camera, interaction, persistence, boot |
| `state.json` | — | historical build report; never read at runtime |
| `scripts/check.mjs` | — | dependency-free release check |
| `skills/nexus-2035-house-tour/` | — | reusable skill + byte-identical template |

Key paths:

- **Data/state** — `APP_ID`, `APP_VERSION`, `STORAGE_KEY = "nexus2035.tour.v1"` and
  `STATE_VERSION` (`script.js:17–20`); `IS_MOBILE` at 900 px (22); `ROOM_DEFS` (27),
  `GLASS_PRESETS`/`GLASS_ORDER` (75), `LIGHT_PRESETS`/`LIGHT_ORDER` (92), `FEATURES`
  (127), `MAP_ROOMS`, and the `state` object (196).
- **World** — `initEngine()` (364) sets the renderer, scene, camera, OrbitControls and
  raycaster; `buildWorld()` (1473) runs lighting → sky → plinth → shell → balcony → city
  → interiors; `buildInteriors()` (1688) builds the seven rooms; `buildMaterials()` and
  the `make*()` canvas textures supply every surface.
- **World contract** — metres, Y-up, floor at `y ≈ 0`, shell `x ∈ [-12,12]`,
  `z ∈ [-9,9]`, balcony to `z ≈ 12.5`, `WALL_H = 3.35`, `WALL_T = 0.18`, no roof.
  Wall and furniture colliders are registered with `addCollider(cx, cz, w, d)`.
- **Navigation** — `buildUI()` (2424), `setActiveRoom()` (2490), `setMode()` (2539),
  `flyTo()` (2596), `flyToRoom()` (2613), `goOverview()` (2623), `applyRoomInstant()`
  (2631), `pinCurrentView()` (2641), `updateWalk()` (2688). Orbit uses OrbitControls;
  walk uses a custom drag-look camera with AABB collision.
- **Environment** — `applyLightPreset()` (2338), `applyGlassPreset()` (2366),
  `tickEnvironment(dt)` (2378). Presets coordinate sky, sun, city glow, LEDs, room lights,
  exposure and the CSS accent.
- **Inspection** — `pick()`, `onPointerMove()`, `openFeature()` (2869), `focusFeature()`,
  `runFeatureAction()`. `FEATURES` has ten records; each needs a registered object in
  `interactables` or its card is unreachable.
- **Persistence** — `cameraSnapshot()` (2969), `buildTourState()` (2981), `saveLocal()`
  (3005), `scheduleSave()` (3019, 650 ms), `sanitizePresets()` (3027),
  `applyTourState()` (3040), `exportTour()` (3099), `importTourFile()` (3105),
  `restoreLocal()` (3124), `resetTour()` (3144). Export filename:
  `nexus2035_house_state.json`.
- **Boot/loop** — `boot()` (3477) is async and updates the loader in phases; it catches
  failures through `fatal()`. `animateScene()` (3391) drives the props; `animate()`
  (3450) clamps `dt` to 50 ms, ticks environment, camera, minimap and FPS, then renders.

## 4. Decisions and constraints

- **Three static files, no build.** `index.html` + `style.css` + `script.js` are the
  delivery format. Do not add npm, modules, a bundler or a build step without a product
  decision.
- **The app is procedural.** No GLB, image or audio assets are loaded at runtime; canvas
  textures and geometry are generated. Keep it that way unless the load contract is
  deliberately changed.
- **The world contract is shared.** Coordinates, wall thickness, floor heights, room
  camera presets, colliders and the minimap all assume the §4 numbers. Move one, move all.
- **Feature cards need registered objects.** A `FEATURES` record alone is not clickable;
  the prop group must be pushed to `interactables` with `userData.feature`. The docs list
  two known cases where this is not true.
- **Persistence is versioned.** Key `nexus2035.tour.v1`, `STATE_VERSION = 1`, fields
  `settings`, `camera`, `roomPresets`. A shape change needs migration or a new key.
- **Autosave is debounced.** `scheduleSave()` waits 650 ms and `saveLocal()` is guarded by
  `state.ready`. Do not save during boot.
- **The auto tour is always restored off.** `settings.autoTour` is written as `false` by
  design so a reload does not start a moving camera unasked.
- **URL parameters are hints, not truth.** `?room`, `?light`, `?glass` are read before
  boot, then a saved local record wins because `restoreLocal()` runs last.
- **The skill template is byte-identical.** `skills/…/assets/template/{index,style,script}`
  must match the root files; `scripts/check.mjs` enforces it. Update both copies together.
- **The docs are part of the release gate.** `scripts/check.mjs` requires `AGENTS.md`,
  the four docs and the skill files, and checks README links. Do not delete a doc without
  updating the check and the index.
- **Docs-only changes should not touch the three source files.** Pages serves `main`
  directly; there is no staging build.

## 5. Known issues

- **Room selection alone does not autosave.** `flyToRoom()` changes `state.room` and flies
  the camera but does not call `scheduleSave()`; the new room reaches storage only when a
  later action (orbit drag, walk, glass/light, pin) schedules a save. Verified in a live
  session: after clicking Master Suite the stored record still said `overview`; after the
  glass/light cycles it said `master`.
- **Two feature records are unreachable.** The `firepit` record has no object in
  `interactables`, and the tech rack sets `feature = "desk"` but is not pushed, so only the
  desk is clickable. The fire still animates. Documented in
  [docs/REPRODUCTION.md](docs/REPRODUCTION.md) §10.
- **Telemetry is simulated.** Energy, temperature, air, water, solar and AQI values are
  generated for the HUD; there are no sensors. The 284 m² label is display copy, not a
  measured area (gross geometry is larger).
- **No audio.** The brief did not request it; there are no sound cues.
- **Reduced motion is partial.** CSS transitions and camera flights honour the preference;
  hologram, fire, traffic, glow and other ambient animation keep running.
- **Storage read is unguarded at boot.** `restoreLocal()` wraps its read, but the boot
  `localStorage.getItem` line is outside a guard; a browser that throws on access can hit
  `fatal()`. Not reproduced.
- **Import has no version migration.** `applyTourState()` validates field by field and
  falls back, but unknown versions are not rejected or migrated.
- **Runtime CDN dependency.** Three.js, OrbitControls and Google Fonts are remote; if
  `initEngine()` fails the loader reports “Spatial engine failed” and the tour cannot run.
  The script tags have no SRI.
- **Only Chromium headless was verified.** Safari, Firefox, Edge, real iOS/Android, touch
  gestures, HiDPI and screen-reader output are unverified. The headless path needs
  SwiftShader flags, not Metal.
- **No CI.** `scripts/check.mjs` is the release gate, but nothing runs it automatically.
- **`state.json` is historical.** Its file counts and hashes describe the 1.0.0 build and
  are stale after documentation changes by design.
- **The docs set was incomplete before this release.** `docs/ARCHITECTURE.md`,
  `REPRODUCTION.md`, `DEPLOYMENT.md`, `scripts/check.mjs` and the skill template were
  untracked; `docs/TESTING.md` and the skill's `SKILL.md`/`ATTRIBUTION.md`/references were
  missing, so the release check failed. This commit adds the missing docs and skill files;
  treat `node scripts/check.mjs` as the source of truth.

## 6. Continuity

- Live: <https://somphol.github.io/nexus-2035-house-tour/> (HTTP 200 at the time of writing).
- Pages: `main` branch, repository root, `.nojekyll` present, no Actions workflow.
- Repository: <https://github.com/somphol/nexus-2035-house-tour>.
- Local master copy: `~/Projects/nexus-2035-house-tour`.
- Initial build: commit `e5426f4` "Build Nexus 2035 futuristic 4BR house tour studio".
- Build state / deployment: commit `8be8611` "Add final build state report and deployment
  verification".
- Last source commit before the documentation release: `3454a78` "docs: add complete
  repository documentation and community files".
- Documentation release: the commit adding this file, `docs/TESTING.md`, the release docs
  and the skill files.
- Author: Somphol Boonjing, MIT. Three.js and OrbitControls are MIT; Manrope and Orbitron
  are SIL OFL. See [LICENSE](LICENSE) and the skill's
  [ATTRIBUTION.md](skills/nexus-2035-house-tour/ATTRIBUTION.md).
