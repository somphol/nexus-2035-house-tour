# Method

## World contract

Right-handed, Y-up, metres. Floor top `y ≈ 0`; ceiling beams `y = 3.42`; balcony deck
`y = 0.025`; plinth top `y = -0.075`.

| Axis / item | Extent |
| --- | --- |
| X | `-12 … +12` (west → east) |
| Z | `-9 … +9` shell, balcony to `≈ +12.5` |
| Plinth | 32 × 28 m centred at `(0, 0.8)` |
| Walls | `WALL_H = 3.35`, `WALL_T = 0.18` |

North is `-Z` on the compass and minimap. The front facade at `z = 9` has ten smart-glass
panels and a 3 m opening between `x = -1.5 … 1.5`. There is no roof; the dollhouse view
looks down into the rooms.

## Build order

1. **Engine** — renderer (`MAX_DPR` 2 desktop / 1.6 mobile), perspective camera (FOV 52 /
   64), OrbitControls, raycaster, clock, resize and visibility hooks.
2. **Materials and textures** — terrazzo, walnut, concrete, rugs, art, screens, city, glow;
   recolourable LED materials and the glass table.
3. **World** — lighting → sky → plinth → shell → balcony → city → interiors. Keep the
   interior-only materials created before the first prop call.
4. **Rooms** — living/kitchen, foyer, master, AR studio, eco bedroom, guest suite,
   ambient details. Add wall/furniture colliders with `addCollider`.
5. **City** — low-rise fabric, skyline towers, traffic, lights and neon signs; mobile counts
   are lower.
6. **Environment** — glass and light preset tables, current/target env state, smooth
   interpolation, sky/sun/city/LED/HUD updates.
7. **Camera** — overview and seven room presets, flights, orbit, walk, auto tour.
8. **UI** — drawer, minimap SVG, telemetry, dock, feature/help cards, toasts, loader.
9. **Persistence** — camera snapshot, versioned state, debounced save, sanitise presets,
   restore, export/import, reset.
10. **Boot** — phased loader, recoverable failure message, render loop, clock, telemetry.

## Room cameras

Room presets sit 2.15–2.75 m high just inside the doorway, aiming at 0.85–1.3 m furniture
height. The balcony preset deliberately looks outward (`target z = 22`) so the skyline is
the subject. Overview is `[23, 17, 27]` aiming at `[0, 0.4, 1.5]`.

## Materials and light

Eight interior point lights share one colour/intensity table; light presets mutate them
with the sun, sky, exposure, city glow and a CSS accent. Glass presets interpolate
transparency and a tint; clear is 0.14, privacy 0.86, night 0.58. Keep all three in sync
with the HUD labels.

## Persistence shape

```json
{
  "app": "nexus-2035",
  "version": 1,
  "settings": { "room": "living", "mode": "orbit", "lighting": "daylight", "glass": "clear" },
  "camera": { "position": [], "target": [], "yaw": 0, "pitch": 0 },
  "roomPresets": { "living": { "camera": [], "target": [] } }
}
```

Export filename: `nexus2035_house_state.json`. Sanitise every imported vector and preset
id; unknown values fall back field by field.
