# Architecture

Nexus 2035 is one static page with three authored files:

```text
index.html → style.css → Three.js r128 (CDN) → OrbitControls 0.128.0 (CDN) → script.js
```

`script.js` is a single IIFE (`(function () { … })()`), not a module. It boots on load and has no
exports, no bundler and no test hooks. The app needs WebGL and, on first load, network access for the
two CDN scripts and Google Fonts.

## 1. Files and responsibilities

| File | Role |
| --- | --- |
| `index.html` | Canvas, HUD shell (top bar, room drawer, telemetry/minimap, dock, feature card, help card, toasts, loader), CDN tags |
| `style.css` | Design tokens, glassmorphism panels, responsive layout, light-mode accent themes, reduced-motion CSS |
| `script.js` | All engine, geometry, materials, environment, camera, interaction, persistence and boot logic |
| `state.json` | Historical build report. Never read at runtime |
| `skills/nexus-2035-house-tour/assets/template/` | Byte-identical copy of the three source files, shipped with the skill |

## 2. Module map (real identifiers)

### Data and state

- `APP_ID = "nexus-2035"`, `APP_VERSION = "1.0.0"`, `STATE_VERSION = 1`.
- `STORAGE_KEY = "nexus2035.tour.v1"`.
- `IS_MOBILE` (`max-width: 900px`), `REDUCED_MOTION`, `MAX_DPR = IS_MOBILE ? 1.6 : 2`.
- `ROOM_DEFS` — seven destinations (`living`, `master`, `studio`, `eco`, `guest`, `foyer`, `balcony`)
  with `index`, `name`, `icon`, `area`, `meta`, camera `camera`/`target` arrays and `blurb`.
- `OVERVIEW` — `{ camera: [23, 17, 27], target: [0, 0.4, 1.5] }`.
- `GLASS_PRESETS` + `GLASS_ORDER`; `LIGHT_PRESETS` + `LIGHT_ORDER`.
- `FEATURES` — ten inspectable-object records (title, category, icon, object id, description, four
  specs, `focus` camera, optional `action`).
- `MAP_ROOMS` — the seven minimap rectangles in a 240 × 215 SVG viewBox.
- `state` — `{ mode, room, lighting, glass, autoTour, roomPresets, ready }`.
- `els` — cached DOM references; `MAP_ROOMS` supplies the minimap.

URL parameters are read once before boot: `?room=<id>` (must match a `ROOM_DEFS` entry),
`?light=<daylight|sunset|neon>`, `?glass=<clear|privacy|night>`. A saved `localStorage` record wins
over URL parameters because `restoreLocal()` runs after them.

### Engine and world construction

| Function | Responsibility |
| --- | --- |
| `initEngine()` | WebGL renderer, scene, perspective camera, `OrbitControls`, raycaster, resize/visibility hooks |
| `onResize()` | Aspect, FOV (52 desktop / 64 below 900 px), pixel ratio, renderer size |
| `canvasTexture()` | Wraps a 2D canvas in a repeating `CanvasTexture` |
| `makeTerrazzo()`, `makeWood()`, `makeConcrete()`, `makeRug()`, `makeArt()`, `makeScreen()`, `makeCityTexture()`, `makeGlowTexture()` | All surface and screen artwork |
| `buildMaterials()` | Fills the shared `M` material table, including the recolourable `ledA`/`ledB` and the glass/emissive materials |
| `addMesh()`, `box()`, `plane()`, `cyl()`, `sphere()`, `torus()`, `ring()`, `roundedBox()` | Geometry helpers; `roundedBox` extrudes a rounded `Shape` |
| `addCollider(cx, cz, w, d)` | Adds an axis-aligned walk collider to `colliders` |
| `buildLighting()` | Hemisphere, shadow-casting sun, glass-facade fill |
| `buildSky()` | Gradient sky shader, star `Points`, sun/moon sprite |
| `addRoomLight()` | Appends one of the eight interior point lights to `roomLights` |
| `buildPlinth()`, `buildShell()`, `buildBalcony()`, `buildCity()`, `buildInteriors()` | The world, in that order |
| `buildLivingKitchen()`, `buildFoyer()`, `buildMasterSuite()`, `buildARStudio()`, `buildEcoBedroom()`, `buildGuestSuite()`, `buildAmbientDetails()` | Interiors |
| `plant()`, `pendant()`, `addArt()`, `rug()`, `vase()`, `bookStack()`, `curvedScreen()`, `diningChair()`, `techRack()`, `monitorDesk()`, `officeChair()`, `cylinderBeam()` | Reusable prop builders |

### Environment

`createEnv()`, `copyEnv()`, `initEnvironmentState()`, `applyCurrentEnvironment()`,
`applyCurrentGlass()`, `applyLightPreset(name, immediate)`, `applyGlassPreset(name, immediate)`,
`tickEnvironment(dt)`. See §6.

### Navigation and UI

`buildUI()`, `updateModeUI()`, `updateGlassUI()`, `updateLightUI()`, `updateTourUI()`,
`setActiveRoom()`, `getRoomView()`, `setMode()`, `setModeVisuals()`, `enterWalkView()`,
`exitWalkView()`, `applyWalkRotation()`, `flyTo()`, `flyToRoom()`, `goOverview()`,
`applyRoomInstant()`, `pinCurrentView()`, `roomAtPosition()`, `insideWalkBounds()`, `blocked()`,
`tryMove()`, `updateWalk()`, `updateCamera()`.

### Interaction and features

`pick()`, `showInspectHint()`, `hideInspectHint()`, `onPointerMove()`, `openFeature()`,
`closeFeature()`, `focusFeature()`, `openHelp()`, `closeHelp()`, `toggleHelp()`, `runFeatureAction()`,
`startAutoTour()`, `stopAutoTour()`, `toggleAutoTour()`.

### Persistence, telemetry, loop

`cameraSnapshot()`, `buildTourState()`, `saveLocal()`, `scheduleSave()`, `sanitizePresets()`,
`applyTourState()`, `exportTour()`, `importTourFile()`, `restoreLocal()`, `resetTour()`; then
`updateClock()`, `updateTelemetry()`, `updateMinimapCamera()`, `onPointerDown/Up()`,
`onKeyDown/Up()`, `closeDrawer()`, `bindUI()`, `animateScene()`, `animate()`, `boot()`.

## 3. Boot sequence

`boot()` is async and updates the loader between phases:

| Loader | Phase |
| --- | --- |
| 6 % | `initEngine()` — renderer, camera, OrbitControls, clock, raycaster |
| 20 % | `buildMaterials()` — generate every canvas texture and material |
| 38 % | `buildWorld()` — lighting → sky → plinth → shell → balcony → city → interiors |
| 70 % | `initEnvironmentState()` — create env current/target from saved preset |
| 84 % | `buildUI()`, `bindUI()` — room buttons, minimap SVG, all listeners |
| 92 % | `restoreLocal()` — localStorage, then saved room/light/glass/camera, else URL room fallback |
| 99 % | clock start, HUD refresh, 520 ms pause |
| 100 % | loader `.is-done`, `body.is-loading` removed, `state.ready = true`, render loop starts |

`setInterval(updateClock, 1000)` and `setInterval(updateTelemetry, 2600)` start at the end. If any
step throws, `fatal()` prints the message into the loader and `console.error` logs it; the page stays
on the loader.

The loader is not a real progress metric. Each phase is followed by `await nextFrame()` (24 ms), so
the percentages mostly pace the reveal.

## 4. World contract

- **Right-handed, Y-up, metres.** Floor top is `y ≈ 0`; ceiling beams at `y = 3.42`; balcony deck at
  `y = 0.025`; plinth top at `y = -0.075`.
- **X** runs west → east (`-12 … +12`). **Z** runs north → south (`-9 … +12.5`). The entrance and
  balcony are at `+Z`; bedrooms are at `-Z`; north is `-Z` on the minimap and compass.
- The shell is 24 m wide × 18 m deep (`x ∈ [-12, 12]`, `z ∈ [-9, 9]`), plus a cantilevered balcony to
  `z ≈ 12.5` and a 32 × 28 m plinth centred at `(0, 0.8)`.
- `WALL_H = 3.35`, `WALL_T = 0.18`. The front facade at `z = 9` is ten smart-glass panels 3.22 m high
  with a 3 m opening between `x = -1.5 … 1.5`.
- There is no roof. The “dollhouse” presentation uses exposed ceiling beams and open sightlines; the
  sky shader is visible above the walls.

### Floor plan

```text
z = -9   ┌───────────────┬─────────┬───────┬───────┐
         │ MASTER SUITE  │ AR      │ ECO   │ GUEST │
         │ + bath        │ STUDIO  │       │       │
z = -2.5 ├───────────────┴─────────┴───────┴───────┤
         │                CENTRAL FOYER             │
z = +2.5 ├──────────────────────────────────────────┤
         │     LIVING        DINING      KITCHEN    │
z = +9   ├─────────────── BALCONY ──────────────────┤
         └──────────────────────────────────────────┘
x = -12                                          x = +12
```

| Space | Extent (x × z) | Notes |
| --- | --- | --- |
| Master Suite | `-12 … -3` × `-9 … -2.5` | 9 × 6.5 m; bath carved out at `x -12 … -9`, `z -9 … -6.4` behind a translucent partition |
| AR Studio | `-3 … 3` × `-9 … -2.5` | 6 × 6.5 m; rear acoustic-hex wall at `z = -8.86` |
| Eco Bedroom | `3 … 7.5` × `-9 … -2.5` | 4.5 × 6.5 m; timber slat wall at `z ≈ -8.87` |
| Guest Suite | `7.5 … 12` × `-9 … -2.5` | 4.5 × 6.5 m; wall cinema on `x = 11.82` |
| Central Foyer | full width × `-2.5 … 2.5` | Hologram at the origin, hydro-moss wall at `x = 2.96, z = -1.2` |
| Living / Dining / Kitchen | full width × `2.5 … 9` | Lounge at `x ≈ -7.2`, dining at `x = 4.35, z = 3.85`, island at `x = 8.05, z = 6.2` |
| Sky Balcony | `-8 … 8` × `9 … 12.5` | Deck, fire lounge at `z = 11.25`, telescope at `x = 2.6, z = 11.55` |

Rear wall openings are at `x = -9.5` (1.6 m), `x = 0` (2.6 m, 2.82 m high), `x = 5.3` (1.4 m) and
`x = 9.7` (1.4 m). Bedroom partitions sit at `x = -3`, `3` and `7.5`. The HUD “284 M²” is display
copy, not the footprint (24 × 18 = 432 m² gross before the balcony and plinth).

### Room camera presets

| id | Camera | Target | HUD meta |
| --- | --- | --- | --- |
| `living` | `[2.4, 2.7, 8.4]` | `[-5.8, 1.1, 4.4]` | 96 m² · OPEN PLAN · SOUTH |
| `master` | `[-9.7, 2.7, -2.8]` | `[-6.3, 1.0, -6.7]` | 42 m² · BEDROOM 01 · NORTH-WEST |
| `studio` | `[0, 2.55, -2.8]` | `[0, 1.0, -7.4]` | 28 m² · BEDROOM 02 · NORTH |
| `eco` | `[3.25, 2.75, -2.85]` | `[5.55, 0.85, -6.7]` | 24 m² · BEDROOM 03 · NORTH-EAST |
| `guest` | `[8.05, 2.75, -2.85]` | `[10.1, 0.85, -6.6]` | 22 m² · BEDROOM 04 · NORTH-EAST |
| `foyer` | `[0, 2.15, 5.2]` | `[0, 1.3, -0.8]` | 18 m² · CIRCULATION · CORE |
| `balcony` | `[0, 1.7, 9.4]` | `[0, 1.7, 22.0]` | 54 m² · OUTDOOR · SKYLINE |

These are framing choices, not measurements: each camera sits just inside or at the doorway of its
room and looks at the hero furniture. The balcony camera deliberately looks outward past the deck.

## 5. Materials and textures

All artwork is generated into 2D canvases at runtime; there are no image files in the app.

| Texture | Size | Repeat | Used by |
| --- | --- | --- | --- |
| terrazzo | 512² | 5 × 4 | main floor, master/guest floor tint |
| wood | 512² | 3.5 × 3.5 | deck, eco floor, walnut joinery |
| concrete | 512² | 4 × 4 | plinth / concrete surfaces |
| rug | 512² | 1 × 1 | lounge, master, studio, eco, guest rugs |
| art | 512 × 384 | 1 × 1 | four palette variants |
| screen | 768 × 432 | 1 × 1 | media wall, AR studio, guest cinema |
| city | 128 × 256 | 1 × 1 | three tower facade variants |
| glow | 128² | 1 × 1 | sun sprite, fire glow, floor glow, traffic sprites |

Materials are shared through `M`. Most are `MeshStandardMaterial`. Glass, partitions, railings,
water, glass worktops and terrarium glass use `MeshPhysicalMaterial` with transparency,
`depthWrite: false` for full-height glazing, and clearcoat. Emissive surfaces use a dark base colour
plus an emissive map or colour.

The two LED materials are global channels:

```js
ledA = M.ledA   // emissive 0xbfe9ff, intensity 1.5
ledB = M.ledB   // emissive 0x9d7bff, intensity 1.1
```

Every `ledStrip()`, most ceiling channels, the kitchen underline, city light strips and the foyer halo
share these, so changing the circadian preset recolours all of them at once. The `M.ledA`/`M.ledB`
names are aliases for the same material objects, not copies.

Palette anchors: wall `0xefece5`, exterior `0x222a33`, dark stone `0x1a222b`, marble `0x242c35`,
brushed metal `0xaab8c7`, brass `0xba8c5c`, fabric `0x5c6774`, leather `0x3b2e2a`, plant `0x3d7a4a`,
moss `0x2f6b3a`, accent cyan `0x5ee7ff`, secondary violet `0x9d7bff`, warm `0xffb26b`.

Textures use `Math.random()` without a seed. Two loads of the same build do not produce identical
grain, city windows or foliage. That is intentional variety, not a stable render.

### Lighting rig

- `HemisphereLight` (sky `0xe9f6ff`, ground `0x5f5a52`, initial 0.92).
- `DirectionalLight` sun (`0xfff4e0`, initial 2.1, position `(42, 48, 34)`), shadows on, PCFSoft,
  2048² map (1024² on mobile), orthographic shadow box ±25, near 1, far 120, bias `-0.0004`,
  normalBias `0.025`.
- Fill `DirectionalLight` `0xbcdcff` at 0.35 from `(-18, 12, 26)`.
- Eight interior `PointLight`s created by `addRoomLight(x, z, color, intensity, distance)` at
  `y = 2.92`, decay 2, except the fire light at `y = 0.75`.

`roomLights` order is a contract with `LIGHT_PRESETS[*].lightColors` and `lightIntensities`:

| # | Position | Default colour | Intensity / distance | Space |
| --- | --- | --- | --- | --- |
| 0 | `(-7.2, 5.2)` | `0xfff4e6` | 0.95 / 10 | Living |
| 1 | `(7.3, 5.0)` | `0xfff2df` | 0.95 / 10 | Kitchen / dining |
| 2 | `(0, 0)` | `0xdff7ff` | 0.8 / 7 | Foyer |
| 3 | `(-8.0, -6.0)` | `0xfff0df` | 0.9 / 8 | Master |
| 4 | `(0, -6.4)` | `0xdff7ff` | 0.85 / 8 | AR Studio |
| 5 | `(5.3, -6.4)` | `0xffd8a6` | 0.85 / 7 | Eco |
| 6 | `(9.8, -6.4)` | `0xffe9cf` | 0.8 / 7 | Guest |
| 7 | `(0, 11.25)`, `y = 0.75` | `0xff9a4c` | 1.0 / 7 | Fire lounge |

The sky is a `ShaderMaterial` on a 240-radius sphere (`BackSide`, `renderOrder -10`) mixing
`bottomColor` to `topColor` with `pow(max(h, 0), 0.62)` and an `offset` of 28. Fog is
`THREE.Fog(color, 55, 235)`. A 34-unit additive sprite is the sun/moon; stars are additive `Points`
at radius 150–210.

## 6. Environment transitions

Each preset is flattened into a plain “env” record by `createEnv()`: colour objects for sky, fog, sun,
hemisphere, LEDs and eight room lights, plus scalar intensities, sun position, stars, city glow, sun
sprite opacity and tone-mapping exposure.

Two records exist:

- `envTarget` — what the preset says.
- `envCurrent` — what is currently on screen.

`applyLightPreset(name, immediate)` writes the target. Every frame, `tickEnvironment(dt)` moves
current toward target:

```text
k  = 1 - exp(-dt * 3.9)      // environment
kg = 1 - exp(-dt * 5.5)      // glass
current += (target - current) * k
```

This is a frame-rate independent exponential ease: 63 % of the distance in ~0.26 s and ~95 % in
~0.77 s. Glass converges slightly faster. `applyCurrentEnvironment()` then copies the current record
into the sky uniforms, fog, sun, hemisphere, LED emissive colours/intensities, all eight room lights,
star opacity, sun sprite, city emissive intensity and `renderer.toneMappingExposure`. An `immediate`
call copies target into current and applies it in one step (used by import and reset).

Preset values that matter:

| Field | Daylight | Sunset | Neon |
| --- | --- | --- | --- |
| sky top / bottom | `0x63b4ef` / `0xe8f5fc` | `0x394b8f` / `0xff9d6a` | `0x02030b` / `0x25103f` |
| fog | `0xcfe6f2` | `0xd89578` | `0x160d29` |
| sun colour / intensity | `0xfff4e0` / 1.85 | `0xff8a4c` / 1.55 | `0x7f8cff` / 0.38 |
| sun position | `(42, 48, 34)` | `(34, 12, 42)` | `(-32, 34, -26)` |
| LED A / B | `0xbfe9ff` / `0x9d7bff` | `0xffb26b` / `0xff6f61` | `0xff4df0` / `0x5ee7ff` |
| stars / city glow | 0.1 / 0.72 | 0.38 / 0.9 | 0.95 / 1.75 |
| exposure | 1.0 | 0.98 | 1.1 |

Glass is a separate three-state target (`clear`, `privacy`, `night`) with colour, opacity, roughness
and metalness. `applyGlassPreset()` writes the target; `tickEnvironment()` lerps the same four
properties at `kg`. The CSS accent follows `body[data-light]`, so the HUD recolours with the scene.

## 7. Camera and navigation state machine

Two independent dimensions:

- `state.room`: `"overview"` or one of the seven ids. Set by `setActiveRoom()`, used for the HUD,
  the minimap highlight and the pinned-view lookup.
- `state.mode`: `"orbit"` or `"walk"`. Orbit uses `OrbitControls`; walk uses a fixed-height
  first-person camera with custom collision.

```text
                 flyToRoom / minimap / drawer / 1–7 / auto tour
        ┌─────────────────────────────────────────────────────────┐
        ▼                                                         │
   ┌─────────┐   W / WALK button   ┌──────────┐   O / ORBIT      │
   │  ORBIT  │ ──────────────────► │   WALK   │ ───────────────► │
   │controls │ ◄────────────────── │ y = 1.62 │                  │
   └─────────┘   flyTo forces orbit └──────────┘                  │
        │                                                         │
        └──────────── 0 / ✕ / reset → OVERVIEW ◄──────────────────┘
```

### Orbit

`OrbitControls` is damped (`dampingFactor 0.065`), distance clamped `1.1 … 62`, polar angle
`0.08 … 0.495π`, screen-space panning, no auto-rotate. Camera FOV is 52° (64° below 900 px), near
0.08, far 500. Every `change` event schedules an autosave.

### Transitions

`flyTo(position, target, duration, roomId)` creates `camTween` and disables controls. Each frame:

```text
t = clamp((now - start) / (duration * 1000), 0, 1)
e = t < 0.5 ? 4t³ : 1 - (-2t + 2)³ / 2
camera.position = lerp(fromPos, toPos, e)
controls.target = lerp(fromTarget, toTarget, e)
camera.lookAt(controls.target)
```

Durations: room fly 1.5 s, overview 1.55 s, feature focus 1.35 s. Under
`prefers-reduced-motion`, the tween is 0.02 s. At `t = 1` the tween clears, controls re-enable and
the end state autosaves. Drift from `OrbitControls` damping is not applied during a tween.

`getRoomView(id)` resolves in this order: overview → pinned preset for that room → `ROOM_DEFS`
default. `pinCurrentView()` writes `state.roomPresets[room]` from the current camera (in walk mode
the target is derived from the view direction × 4 m) and autosaves immediately. Pins are refused in
overview.

### Walk

`enterWalkView()` converts the current camera to eye height `y = 1.62`. If the position is outside
`insideWalkBounds()`, it spawns at `(0, 4.6)` looking north. Otherwise it derives
`yaw = atan2(-dir.x, -dir.z)` and `pitch = asin(dir.y)` clamped ±1.25. In walk mode, drag-look is:

```text
yaw   -= dx * 0.0032
pitch  = clamp(pitch - dy * 0.0028, -1.32, 1.32)
```

Movement (`updateWalk`) normalises diagonals and rotates the input by yaw:

```text
speed = (Shift ? 5.5 : 2.85) * dt
dx = (-sin(yaw) * f + cos(yaw) * s) * speed
dz = (-cos(yaw) * f - sin(yaw) * s) * speed
```

`tryMove()` applies each axis separately so sliding along a wall works. `blocked()` tests the walk
bounds and every AABB in `colliders` expanded by a 0.34 m body radius. Walk bounds are
`x ∈ (-11.55, 11.55), z ∈ (-8.55, 9.1)` indoors and `x ∈ (-7.65, 7.65), z ∈ (9.02, 12.1)` on the
balcony. There is no jump, stair, gravity or step-up logic; the balcony is reached through the
3 m facade opening at `z = 9`.

Every 0.35 s, `roomAtPosition(x, z)` updates the HUD from coarse thresholds:

```text
z < -2.5 → x < -3 ? master : x < 3 ? studio : x < 7.5 ? eco : guest
z >  9   → balcony
z >  2.5 → living
otherwise → foyer
```

This is a zone lookup, not a room-volume test: standing in the master bathroom still reports
`master`.

`exitWalkView()` points the orbit target 4.6 m ahead of the camera, clamps target `y` to `0.7 … 2.6`
and re-enables controls.

### Auto tour

`startAutoTour()` walks forward through `ROOM_DEFS` (wrapping) and calls `flyToRoom(id, true)` once
after 450 ms and then every 8200 ms. It does not include the overview. It stops on any manual room
selection, mode change, canvas drag start, feature/help card, reset or a second `T`. It is never
saved: `buildTourState()` always writes `settings.autoTour: false`.

## 8. Picking and feature cards

Ten feature records exist in `FEATURES`, but only objects registered in `interactables` can be
picked. A prop group is registered by setting `group.userData.feature = "<id>"` and pushing the group
into `interactables`. `pick()` raycasts recursively (`raycaster.far = 60`) and climbs parents until
it finds a `userData.feature`.

| Feature id | Object | Where | Action |
| --- | --- | --- | --- |
| `hologram` | `holoGroup` | foyer origin | cycle palette |
| `bed` | master bed group | master | toggle under-bed glow |
| `island` | island group | kitchen | toggle induction halos |
| `hydrowall` | `hw` moss wall | foyer east | toggle grow lights |
| `media` | media wall group | living west | none |
| `desk` | `monitorDesk()` group | AR studio | none |
| `terrarium` | `terr` group | eco | toggle grow lights |
| `pod` | guest pod group + wall screen | guest | none |
| `vanity` | vanity group | master bath | none |
| `firepit` | — | balcony | none (record only) |

Hover hints are sampled at most every 90 ms and only in orbit mode while not dragging. A click opens
a card when the pointer moved less than 7 px and was released within 700 ms. Opening a card stops the
auto tour and closes help. `Focus View` closes the card and flies to `FEATURES[id].focus`. The action
button calls `runFeatureAction(id)`:

- `hologram` cycles `HOLO_PALETTES` (Cyan → Magenta → Solar) and recolours core, wireframe, rings and
  particles.
- `bed` toggles `bedGlowMat.emissiveIntensity` between the animated value and 0.04.
- `island` toggles `inductionMat` between the animated value and 0.04.
- `hydrowall` and `terrarium` share one `growLightsOn` flag on `growMat`.

Action state is not part of the saved tour state.

## 9. Persistence and import

`localStorage` key `nexus2035.tour.v1`, schema version 1. `buildTourState()` produces:

```json
{
  "app": "nexus-2035",
  "version": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-11-01T00:00:00.000Z",
  "credits": { "studio": "OpenCode", "model": "DeepSeek V4.1 Flash", "engine": "Three.js r128" },
  "settings": { "room": "living", "mode": "orbit", "lighting": "daylight", "glass": "clear", "autoTour": false },
  "camera": { "position": [0, 0, 0], "target": [0, 0, 0], "yaw": 0, "pitch": 0 },
  "roomPresets": { "living": { "camera": [0, 0, 0], "target": [0, 0, 0] } }
}
```

`saveLocal()` adds `savedAt` before writing to storage; the exported file does not have it (the export
is built by `buildTourState()` directly). Writes are debounced by `scheduleSave()` at 650 ms, plus
immediate saves on visibility loss, `beforeunload`, mode change, glass/light change, pin and reset.

`applyTourState(data, opts)`:

1. Rejects non-objects.
2. Applies `settings.lighting` / `settings.glass` only if the names exist.
3. Replaces `roomPresets` with `sanitizePresets()` (`validVec` = array of three finite numbers, known
   room ids only).
4. Resolves `settings.room` to a known id or `overview`.
5. Sets mode to `walk` only when the value is exactly `"walk"`, otherwise orbit.
6. Applies `camera.position` if valid; in walk mode forces `y = 1.62` and prefers stored yaw/pitch,
   otherwise derives them from `camera.target`.
7. Updates HUD and optionally saves/toasts.

There is **no version check and no schema migration**. Any object with a `settings` field is accepted
by the import path (`importTourFile` rejects only when both `app` and `settings` are missing). Camera
values are not clamped to the house. A corrupt import cannot crash the render loop because invalid
presets are dropped and vectors are checked, but a wild camera position is possible.

`restoreLocal()` catches parse/storage errors and falls back to the URL/default room.
`resetTour()` removes the key, clears pins, restores daylight/clear/orbit/overview, then writes the
default state back.

## 10. HUD, minimap and telemetry

`buildUI()` generates the seven room buttons and the SVG plan. The plan is 10 px per metre:

```text
mapX = clamp((worldX + 12) * 10, 2, 238)
mapY = clamp((worldZ + 9)  * 10, 2, 213)
```

`MAP_ROOMS` rectangles use the same scale (master 90 × 65 px, studio 60 × 65, eco 45 × 65, guest
45 × 65, foyer 60 × 50, living 240 × 65, balcony 160 × 35). The camera dot and heading line refresh
at most every 0.09 s:

```text
heading = (atan2(dir.x, -dir.z) * 180 / π + 360) % 360
line end = (x + sin(heading) * 9, y - cos(heading) * 9)
```

The same heading rotates `.compass-needle` and fills `#heading-value` as a zero-padded degree.

Telemetry (`updateTelemetry`, every 2.6 s) is **simulated**, not sensor data: energy 96–99 %,
temperature 21.1–21.9 °C, air 9–14 AQI, water 84–88 %, with bar widths `energy`,
`(temp - 18) / 8 * 100`, `100 - air * 2` and `water`. The clock is real local time, updated every
second. FPS is measured over a 0.75 s window.

The room banner shows for 4.2 s. Toasts last 3.2 s plus a 420 ms fade. The loader stays until boot
completes.

## 11. Render loop

```text
requestAnimationFrame(animate)
  dt = min(clock.getDelta(), 0.05)
  elapsed += dt
  tickEnvironment(dt)
  animateScene(dt)       // hologram, induction, bed glow, fire flicker, traffic, star twinkle
  updateCamera(dt, now)  // tween → orbit controls → walk
  renderer.render(scene, camera)
  minimap (throttled 0.09 s)
  FPS (0.75 s window)
```

The 50 ms dt clamp keeps a backgrounded tab from jumping the animation when it returns. It also means
the FPS counter never reads below 20 FPS: a 200 ms frame is counted as 50 ms.

Device budgets:

| Item | Desktop | Mobile (`max-width: 900px`) |
| --- | --- | --- |
| Pixel ratio cap | 2 | 1.6 |
| Shadow map | 2048² | 1024² |
| Stars | 980 | 520 |
| Skyline towers | 58 | 38 |
| Low-rise blocks | 145 | 80 |
| Air traffic | 10 | 6 |
| Hologram particles | 80 | 45 |
| FOV | 52° | 64° |

## 12. Extension points

- **Add a room:** add a `ROOM_DEFS` entry (camera/target), a `MAP_ROOMS` rectangle, a case in
  `roomAtPosition()`, any new walls/furniture/colliders, and a help/README row. Keyboard `1–7` is
  hard-coded to seven entries; update that guard and the auto-tour cycle follows `ROOM_DEFS`
  automatically.
- **Add an inspectable prop:** set `userData.feature`, push the group to `interactables`, add a
  `FEATURES` record with `focus`, optionally add an action branch in `runFeatureAction()`. A record
  without a registered object is unreachable.
- **Add a light/glass preset:** extend the preset table and `*_ORDER`, keep eight entries in
  `lightColors`/`lightIntensities` matching `roomLights`, and add a CSS accent block under
  `body[data-light="…"]`.
- **Change the save shape:** bump `STATE_VERSION`, add a migration in `applyTourState()`, and update
  all three docs and `README.md`. Existing v1 files will otherwise be read as v1.
- **Re-theme:** palette lives in `style.css` tokens plus `M.*` material colours and the preset tables.
  Changing only CSS leaves the 3D scene unchanged, and vice versa.
