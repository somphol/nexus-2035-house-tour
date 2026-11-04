# Reproduction book

This is the rebuild and verification book for **Nexus 2035: Futuristic 4BR House Tour Studio**. It is
written for a maintainer or AI agent who has the repository but not the original session.

**The three source files are the source of truth.** Rebuild from this book only if they are lost.
Do not rewrite the app for style reasons; read [ARCHITECTURE.md](ARCHITECTURE.md) for the map, then
use this book to reconstruct, extend or verify.

## 1. What is being reproduced

A single-page, static, procedural 3D architectural tour:

- **Subject:** a four-bedroom smart home in 2035, on a cantilevered plinth above a neon city.
- **Spaces:** Living & Kitchen, Master Suite, AR Studio, Eco Bedroom, Guest Suite, Central Foyer,
  Sky Balcony. Seven destinations plus an overview.
- **Interaction:** orbit camera, first-person walk camera with collision, room teleports from a
  drawer / minimap / number keys, an 8.2 s auto tour, inspectable props with feature cards and four
  object actions, three circadian lighting presets, three smart-glass presets.
- **Persistence:** `localStorage` autosave of room, mode, lighting, glass, camera and pinned room
  views; JSON export/import of the same state.
- **Delivery:** `index.html`, `style.css`, `script.js`; no build step, no package manager, no backend.
  Three.js r128 and OrbitControls 0.128.0 come from pinned CDNs; Orbitron and Manrope come from
  Google Fonts. Everything else — geometry, textures, screens, skyline — is generated in the browser.
- **Release:** `APP_VERSION = "1.0.0"`, save schema `STATE_VERSION = 1`.

It is **not** a CAD/BIM model, a photoreal renderer, a multiplayer app, an editor, or an offline-first
PWA. It has no audio, no accounts, no analytics and no server.

## 2. Requirements matrix

| Requirement | Implementation | Where |
| --- | --- | --- |
| Four-bedroom plan with living/kitchen and foyer | `buildShell`, `buildInteriors`, partitions at `x = -3/3/7.5` | `script.js` |
| Terrazzo, smart glass, LED channels, balcony skyline | `makeTerrazzo`, `M.glass`, `ledStrip`, `buildBalcony`, `buildCity` | `script.js` |
| Foyer hologram + hydro-moss wall | `buildFoyer`, `animatedRings` (`type: "holo"`) | `script.js` |
| Living sectional, glass island, dining, media wall | `buildLivingKitchen` | `script.js` |
| Master platform bed, bath partition, halo vanity | `buildMasterSuite` | `script.js` |
| AR dual curved monitors, acoustic wall, tech rack | `buildARStudio`, `monitorDesk`, `techRack` | `script.js` |
| Eco terrariums, timber wall, warm pendants | `buildEcoBedroom` | `script.js` |
| Guest pod bed + wall cinema | `buildGuestSuite` | `script.js` |
| Seven room teleports | `ROOM_DEFS`, `buildUI`, `flyToRoom` | `script.js`, `index.html` |
| Orbit pan/zoom, 360° drag | `OrbitControls` in `initEngine` | `script.js` |
| WASD/arrow walk, Shift boost, collision | `updateWalk`, `blocked`, `colliders` | `script.js` |
| Smart glass: clear → privacy → night | `GLASS_PRESETS`, `GLASS_ORDER`, `setGlassMode` | `script.js` |
| Circadian: daylight → sunset → neon | `LIGHT_PRESETS`, `LIGHT_ORDER`, `setLightingMode` | `script.js` |
| Inspectable props with specs | `FEATURES`, `interactables`, `pick`, `openFeature` | `script.js`, `index.html` |
| Focus View camera move | `focusFeature` → `flyTo` | `script.js` |
| localStorage camera/room/light/glass | `buildTourState`, `saveLocal`, `restoreLocal` | `script.js` |
| Download `nexus2035_house_state.json` | `exportTour`, `download` | `script.js` |
| Import a tour config | `importTourFile`, `applyTourState` | `script.js` |
| Glassmorphism HUD, drawer, badges, transitions | CSS tokens and panels | `style.css` |
| Floor-plan minimap, compass, FPS | `MAP_ROOMS`, `buildUI`, `updateMinimapCamera` | `script.js` |
| Auto tour every 8.2 s | `startAutoTour` | `script.js` |
| Pin current camera as room preset | `pinCurrentView`, `state.roomPresets` | `script.js` |
| Responsive desktop/mobile | 1280 / 1020 / 900 / 640 / 420 px breakpoints | `style.css` |
| Build state with time, tokens, credits | historical record | `state.json` |
| Release docs and reusable skill | this book, `AGENTS.md`, `docs/`, `skills/` | repository |

Late requirements that are now product requirements:

- The state file is part of the release and must credit OpenCode and the model.
- Upload the project to GitHub (Pages, `main`, root).
- Do not trigger repeated Keychain prompts during the build; use the stored credential helper.
- Keep it three files with a CDN Three.js build (the brief allowed OrbitControls or PointerLock).

## 3. Non-negotiable constraints

| Constraint | Why | Enforcement |
| --- | --- | --- |
| Three source files, no build | Lifetime simplicity; GitHub Pages root | `scripts/check.mjs` requires the files; no package manifest |
| No runtime data calls | Privacy; the only network is the pinned CDN/fonts | check rejects `fetch`, `XMLHttpRequest`, `WebSocket` in `script.js` |
| Three.js r128 / OrbitControls 0.128.0 pinned | r128 is the last non-module `three.min.js` that matches the examples script | check asserts both CDN URLs |
| Metres, Y-up, north = `-Z` | Every geometry, camera, collider and minimap value depends on it | documented in ARCHITECTURE §4 |
| Open roof | Orbit/overview must see interiors | no ceiling plane; beams only |
| Eight room lights in fixed order | Preset arrays are indexed by light | `addRoomLight` order is a contract |
| Shared `ledA`/`ledB` materials | One change recolours every strip | do not clone per strip without revisiting presets |
| localStorage key and schema | Restore/import compatibility | `nexus2035.tour.v1`, version 1 |
| `state.json` is historical | Honest build provenance | never fetched or parsed by the app |
| Documentation part of release | Handoff survives the session | `scripts/check.mjs` required files/links |
| Skill template byte-identical | The reusable copy must be the shipped code | check compares all three files |

## 4. Reference environment

| Tool | Version / note |
| --- | --- |
| macOS | Darwin, Apple Silicon (build machine) |
| Chrome | headless, SwiftShader (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`) |
| Node.js | 26.13.0 used for the release check; any modern Node runs `scripts/check.mjs` |
| Python | 3.x, only for `python3 -m http.server` |
| Dependencies | **none**; no `npm install` |
| Hosting | GitHub Pages, `main`, root |

```bash
cd ~/Projects/nexus-2035-house-tour
python3 -m http.server 8080        # http://localhost:8080
node --check script.js
node scripts/check.mjs
```

## 5. Repository map

| Path | Role |
| --- | --- |
| `index.html` | UI shell, HUD, modals, loader, CDN tags |
| `style.css` | Tokens, layout, panels, responsive rules |
| `script.js` | Engine, world, materials, environment, camera, interaction, persistence |
| `scripts/check.mjs` | Dependency-free release check |
| `docs/` | This book, architecture, testing, deployment, screenshots |
| `skills/nexus-2035-house-tour/` | Reusable skill + byte-identical template |
| `state.json` | Historical build report (time, tokens, verification, credits) |
| `.github/` | Issue forms, PR template, CODEOWNERS |
| `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` | Project policy |

## 6. Build from an empty directory

Each stage ends with an acceptance check. Do not skip ahead.

### Stage 0 — Scaffold

```bash
mkdir nexus-2035-house-tour && cd nexus-2035-house-tour
git init -b main
touch .nojekyll
```

Create `index.html`, `style.css`, `script.js`, `LICENSE` (MIT), `README.md`, `.gitignore` (ignore
`.DS_Store`, logs, `node_modules/`, `test-harness.html`).

**Accept:** `python3 -m http.server 8080` serves a blank page with no 404 for local files.

### Stage 1 — HTML shell and CDN

Build the DOM in this order: canvas, vignette/grain, top bar, room drawer, telemetry aside, room
banner, crosshair/hints, dock, feature card, help card, toast stack, loader. Use the ids in the
current `index.html`; `script.js` caches them all in `els`.

Add, immediately before `</body>`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="./script.js"></script>
```

**Accept:** the three scripts return 200; no app JS yet; the loader shows.

### Stage 2 — CSS system

Implement tokens (`--bg #05080e`, `--accent #5ee7ff`, `--accent-2 #9d7bff`, glass panels with
`backdrop-filter`, 12–22 px radii), the four HUD regions, the dock, cards, loader and the breakpoints
at 1280 / 1020 / 900 / 640 / 420 px. Add the `body[data-light]` accent themes (sunset warm, neon
magenta) and `prefers-reduced-motion`.

**Accept:** at 390 × 844 there is no horizontal page scroll; the telemetry column is hidden below
1280 px; the dock scrolls horizontally below 900 px.

### Stage 3 — Engine skeleton

In `script.js`, create the IIFE and constants, then:

1. `initEngine()` — renderer (`antialias`, ACESFilmic, sRGB, PCFSoft shadows), scene with fog,
   `PerspectiveCamera(52, aspect, 0.08, 500)`, `OrbitControls` (damping 0.065, distances 1.1–62,
   polar 0.08–0.495π), `Clock`, `Raycaster` (far 60), resize/visibility listeners.
2. `buildLighting()` — hemisphere, shadow sun, fill.
3. `buildSky()` — gradient shader sphere, stars, sun sprite.
4. Empty `buildWorld()` that adds a `house` group.

**Accept:** a coloured sky and ground plane render; no console errors; resizing keeps aspect.

### Stage 4 — Shell, plinth and balcony

Create `WALL_H = 3.35`, `WALL_T = 0.18`, `wallX`, `wallZ`, `addGlassPanel`, `addDoorFrame`, `ledStrip`,
`addCollider`.

- Foundation 24.6 × 18.6 at `y -0.13`; terrazzo floor 24 × 18 at `y 0.002`.
- Exterior walls at `z = -9`, `x = ±12`; front facade panels at `z = 9` with a 3 m opening at `x ±1.5`.
- Rear wall at `z = -2.5` with openings at `-9.5`, `0`, `5.3`, `9.7`.
- Partitions at `x = -3`, `3`, `7.5`; master bath partition at `x = -9` / `z = -6.4`.
- Ceiling beams at `y = 3.42`; LED channels at `y ≈ 3.1`; foyer floor rings at the origin.
- `buildPlinth()` 32 × 28 at `z = 0.8`; `buildBalcony()` deck, glass rails, canopy, solar panels,
  loungers, fire pit, planters, telescope.
- `addRoomLight()` × 8 in the documented order.

**Accept:** overview shows an open-roof plan with a readable facade, balcony and plinth; walking is not
possible yet.

### Stage 5 — Procedural textures and materials

Implement the canvas texture helpers and `buildMaterials()`. Match the generators, not the random
output: terrazzo base `#e9e5dc` with 1700 chips and 12 veins at repeat 5 × 4; wood planks 64 px at
repeat 3.5; concrete 9000 speckles at repeat 4; four art palettes; three screen layouts; three city
window maps; radial glow.

Use `MeshStandardMaterial` for architecture and `MeshPhysicalMaterial` for glass, partitions,
railings, water, glass tops and terrariums. Keep `ledA`/`ledB` shared. Create the interior-only
materials (`pendantWarm`, `acoustic1-3`, `glassTop`, `duvetWarm`, `terrariumGlass`) **before** any
interior builder runs.

**Accept:** the floor reads as terrazzo, glass is translucent, LEDs glow; no material is `undefined`
(a `THREE.Mesh` silently substitutes a default white `MeshBasicMaterial`, so the prop looks wrong
without any console error).

### Stage 6 — Interiors

Build in this order: `buildLivingKitchen`, `buildFoyer`, `buildMasterSuite`, `buildARStudio`,
`buildEcoBedroom`, `buildGuestSuite`, `buildAmbientDetails`. Use the coordinates in ARCHITECTURE §4
and the reference source for prop placement.

Register hero props:

```js
holoGroup.userData.feature = "hologram"; interactables.push(holoGroup);
bed.userData.feature = "bed";           interactables.push(bed);
island.userData.feature = "island";     interactables.push(island);
hw.userData.feature = "hydrowall";      interactables.push(hw);
media.userData.feature = "media";       interactables.push(media);
vanity.userData.feature = "vanity";     interactables.push(vanity);
terr.userData.feature = "terrarium";    interactables.push(terr);
pod.userData.feature = "pod";           interactables.push(pod);
screen.userData.feature = "pod";        interactables.push(screen);
```

Add colliders around walls, sofas, tables, beds and planters with `addCollider`.

**Accept:** each room reads correctly from its preset camera; the bed, island, hologram and moss wall
are visible and clickable in orbit mode.

### Stage 7 — City and traffic

Create the 420 × 420 ground, 58 towers (38 mobile), 145 low-rise blocks (80), a luminous road grid,
10 aircraft (6) and a horizon glow. Keep the near field clear: if a tower lands at `z < 88` and
`|x| < 42`, push it to `z 88–112`. Animate traffic wrap at `x = ±92`, bob with
`sin(elapsed * 0.9 + phase)`.

**Accept:** the overview and balcony show a skyline that does not intersect the house; traffic moves
without popping at the wrap.

### Stage 8 — Environment presets

Add `GLASS_PRESETS`, `LIGHT_PRESETS`, `createEnv`, `copyEnv`, `initEnvironmentState`,
`applyCurrentEnvironment`, `applyCurrentGlass`, `applyLightPreset`, `applyGlassPreset`,
`tickEnvironment`. Use the exponential ease in ARCHITECTURE §6.

**Accept:** `G` cycles clear → privacy → night with a visible fade; `L` cycles daylight → sunset →
neon and the HUD accent, sky, sun position, city glow and all eight interior lights change together.

### Stage 9 — UI and camera state

Build the room list and SVG minimap in `buildUI()`; cache the map dot/heading. Implement
`getRoomView`, `setActiveRoom`, `flyTo`, `flyToRoom`, `goOverview`, `applyRoomInstant`,
`pinCurrentView`, `setMode`, `enterWalkView`, `exitWalkView`, `updateCamera`, `updateWalk`,
`insideWalkBounds`, `blocked`, `tryMove`, `roomAtPosition`.

**Accept:** drawer, minimap, `1–7`, `0` and `W`/`O` behave; camera flights ease and end exactly on the
preset; walk mode collides with walls and furniture.

### Stage 10 — Inspection, help, auto tour

Add `FEATURES`, hover sampling, `pick`, `openFeature`, `closeFeature`, `focusFeature`,
`runFeatureAction`, `openHelp`/`closeHelp` and `startAutoTour`/`stopAutoTour`.

**Accept:** hovering a registered prop shows a label; clicking opens the matching card; Focus View
flies to the object; the first auto-tour step is living and the cycle advances every 8.2 s.

### Stage 11 — Persistence, export, import

Add `cameraSnapshot`, `buildTourState`, `scheduleSave`/`saveLocal`, `sanitizePresets`,
`applyTourState`, `exportTour`, `importTourFile`, `restoreLocal`, `resetTour`. Use
`nexus2035.tour.v1` and the schema in ARCHITECTURE §9. Debounce saves at 650 ms and save on
`beforeunload` and `visibilitychange`.

**Accept:** reload restores room, mode, glass, lighting and camera; export downloads
`nexus2035_house_state.json`; importing it restores the same; Reset returns to overview/daylight/clear.

### Stage 12 — Boot, telemetry, docs, deploy

Implement `boot()` with the six loader phases, `animate()`, the compass/minimap/FPS/clock/telemetry
updates and all keyboard/pointer bindings. Add the release docs, `scripts/check.mjs` and the skill
directory. Commit and push `main`; enable Pages at root.

**Accept:** `node scripts/check.mjs` passes; the live URL returns 200 and the loader completes.

## 7. Where the non-obvious numbers came from

| Number | Origin |
| --- | --- |
| 24 × 18 m shell | Four bedrooms summing 9 + 6 + 4.5 + 4.5 = 24 m across; 6.5 m bedrooms + 5 m foyer + 6.5 m living = 18 m deep |
| Partitions `x = -3, 3, 7.5` | `-12 + 9`, `-3 + 6`, `3 + 4.5`; the fourth room ends at `12` |
| Rear wall `z = -2.5` | 6.5 m bedroom depth from `z = -9` |
| Facade `z = 9` | 6.5 m living depth from `z = 2.5` |
| `WALL_H 3.35` | 3.22 m glass + frame; keeps cameras below the beam line at 3.42 |
| Eye height 1.62 m | Adult eye level; keeps the camera under pendant globes and above tables |
| Walk 2.85 / 5.5 m/s | Brisk walk / jog; slow enough to read interiors, fast enough for a 24 m plan |
| Collision radius 0.34 m | Half a shoulder width; lets the walker pass the 1.4 m door openings |
| Walk margins 0.45 m | Stop before walls at `±11.55` and `-8.55`, before the balcony rail at `12.1` |
| FOV 52° / 64° | Architectural compression on desktop; wider mobile view for a narrow canvas |
| Sun positions 42,48,34 / 34,12,42 / -32,34,-26 | High south-east daylight, low west sunset, high back-left neon “moon” |
| 8.2 s auto tour | 1.5 s flight + 6.7 s dwell per room |
| 650 ms autosave debounce | Absorbs OrbitControls' change storm |
| 0.09 s minimap / 0.75 s FPS / 0.35 s room poll / 90 ms hover | Cheap HUD cadences, imperceptible lag |
| 4200 ms banner / 3200 ms toast | Long enough to read a room name or confirmation |
| 0.05 s dt clamp | Prevents a jump after a background tab; also floors the FPS readout at 20 |
| 2048² / 1024² shadows, DPR 2 / 1.6, 980/520 stars, 58/38 towers, 145/80 blocks | Visual budget split at the 900 px mobile breakpoint |
| 10 px/m minimap | 24 m × 18 m plan becomes 240 × 180 px inside a 240 × 215 viewBox |
| 284 m² HUD label | Sum of the seven room labels (96+42+28+24+22+18+54), not a measured area |
| Glass opacities 0.14 / 0.86 / 0.58 | Clear must read as glass; privacy must block the skyline; night sits between |
| Focus cameras | Authored by eye from each prop's hero angle; see `FEATURES[*].focus` |
| Room cameras | 2.15–2.75 m height just inside the door, aiming at 0.85–1.3 m furniture height |

## 8. Verification

```bash
node --check script.js
node scripts/check.mjs
node ~/.config/opencode/skills/skill-publish/scripts/check-skill.mjs skills/nexus-2035-house-tour
```

Expected:

```text
OK <n> checks
OK nexus-2035-house-tour — "Nexus 2035 House Tour", <n> files, <x> MB
```

Then serve and exercise [TESTING.md](TESTING.md). Minimum release pass:

1. Load overview, click every room in the drawer, then the minimap.
2. Press `1`–`7`, `0`; drag/scroll orbit.
3. Press `W`; walk through the foyer into the master, then to the balcony; confirm walls block.
4. Cycle glass and lighting; confirm sky, LEDs and HUD accent move together.
5. Click hologram, bed, island, hydro-wall, media wall, desk, terrarium, pod, vanity; open Focus View.
6. Use each action: hologram palette, bed glow, induction, grow lights.
7. Export, reset, import; reload and confirm autosave.
8. Emulate 390 × 844; check no horizontal overflow, drawer opens, dock scrolls.
9. Confirm no uncaught console errors.

## 9. What was tried and rejected

- **PointerLockControls.** The brief allowed it, but pointer lock hides the cursor and fights mobile
  drag. The release uses OrbitControls for orbit and a custom drag-look walk camera.
- **A build step / bundled Three.js.** Rejected to keep three static files and Pages-root delivery;
  the trade-off is a CDN requirement on first load.
- **Default headless GPU capture.** Produced unusable screenshots; the working recipe is Chrome
  `--headless=new` with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` and a
  virtual-time budget of 10–90 s.
- **Testing `localStorage` from a `data:` URL.** Chrome returns `SecurityError`; storage must be tested
  on the HTTP origin.
- **A single-pass import test.** The first harness read the previous state because `FileReader` and
  the `change` event are asynchronous. The harness gained read/change markers and waited for them; the
  application code was not changed. Final harness line: `IMPORT neon privacy eco`.
- **Balcony framing.** Nine successive screenshots (b2–b10) were used to settle the deck furniture,
  canopy and camera. The preset deliberately looks outward (`target z = 22`) rather than at the deck,
  so the skyline stays the subject.
- **A committed browser test.** The harness was useful but is not in the repo (`.gitignore` lists
  `test-harness.html`). Verification is documented in TESTING.md instead of shipped.
- **Material declaration order.** Interior-only materials must exist before the first `pendant()` /
  acoustic / terrarium call. The release creates them at the top of `buildInteriors()`; moving them
  back into their room builders gives those meshes a silent default material instead of the intended
  finish.

## 10. Honest deviations and unfinished parts

| Item | State |
| --- | --- |
| `firepit` feature | Record exists in `FEATURES`, but the fire-pit mesh is not registered in `interactables`, so the card cannot open. The fire still flickers. |
| Tech rack pick | `rack.userData.feature = "desk"` is set, but the rack group is not pushed to `interactables`; only the desk group is clickable. |
| Telemetry | Simulated random values, labelled as a live dashboard. No sensors. |
| 284 m² / room areas | Display copy; geometry is larger (432 m² gross). |
| Offline | First load needs the CDN and Google Fonts. The app is static, not offline-capable. |
| Audio | None. The brief did not request it. |
| Auto tour persistence | Always restored off; `settings.autoTour` is written as `false`. |
| Reduced motion | CSS and camera flights honour it; hologram, fire, traffic and glow continue animating. |
| Storage failure | `saveLocal()` catches errors, but the boot line `localStorage.getItem(STORAGE_KEY)` is outside a guard; a browser that throws on access can trip `fatal()`. Not reproduced. |
| Import schema | No version check or migration; unknown/invalid values fall back field by field. |
| Browser coverage | Verified in headless Chrome. Safari, Firefox, iOS and Android were not automated. |
| `state.json` hashes | Snapshot from the 1.0.0 build; documentation commits change `README.md`, so the recorded README hash is stale by design. |
| Browser test in CI | There is no CI workflow in this repository. |

Do not silently “fix” one of these without updating this table and the changelog.

## 11. Handoff checklist

- [ ] `node --check script.js` passes.
- [ ] `node scripts/check.mjs` passes.
- [ ] Skill check passes and `assets/template/*` matches the root sources byte for byte.
- [ ] `python3 -m http.server 8080` serves the app and the loader completes.
- [ ] Live URL returns 200.
- [ ] `state.json` is treated as historical, never loaded.
- [ ] New UI strings exist in `index.html` and any new feature in `FEATURES` has a registered object.
- [ ] A new lighting preset has eight light colours/intensities and a CSS accent.
- [ ] Docs and README are updated in the same commit.

## 12. Where to change what

| Change | Files |
| --- | --- |
| Layout, rooms, walls, colliders | `script.js` — `buildShell`, `buildInteriors`, `addCollider` |
| Furniture and props | `script.js` — room builders and prop helpers |
| Textures and palette | `script.js` — `make*` and `buildMaterials`; `style.css` tokens |
| Sky, sun, fog, LEDs | `script.js` — `buildLighting`, `buildSky`, `LIGHT_PRESETS` |
| Glass behaviour | `script.js` — `GLASS_PRESETS`, `applyGlassPreset`, `tickEnvironment` |
| Camera views and pins | `script.js` — `ROOM_DEFS`, `OVERVIEW`, `getRoomView` |
| Walk speed, collision, bounds | `script.js` — `updateWalk`, `blocked`, `insideWalkBounds` |
| Inspection cards | `script.js` — `FEATURES`, `openFeature`; `index.html` card shell |
| HUD structure | `index.html`; styles in `style.css` |
| Persistence/export | `script.js` — `buildTourState`, `applyTourState` |
| Verification | `scripts/check.mjs` |
| Release docs | `README.md`, `AGENTS.md`, `docs/`, `CHANGELOG.md` |
| Deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |
