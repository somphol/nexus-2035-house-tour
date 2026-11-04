# Verification

## Static checks

```bash
node --check script.js
node scripts/check.mjs
```

`scripts/check.mjs` is the release gate. It verifies:

- required files (sources, docs, `AGENTS.md`, `scripts/check.mjs`, skill files);
- local `src`/`href` references in `index.html`;
- relative Markdown links in README, AGENTS and the docs/skill tree;
- `node --check` for every `.js`/`.mjs`;
- every `.json` parses;
- the skill template is byte-identical to the root sources;
- README links to AGENTS, the four docs and the skill;
- app invariants: pinned Three.js/OrbitControls, `#scene-canvas`, storage key,
  `buildWorld`, `tickEnvironment`, `flyTo`, `applyTourState`, export filename, `pick`;
- no `fetch`, XHR or WebSocket in the app; no TODO/FIXME.

A release is not done until it prints `OK <n> checks`.

## Serve

```bash
python3 -m http.server 8080
# http://localhost:8080/
```

Confirm:

1. The loader reaches its final phase and disappears.
2. The overview renders with the room drawer, minimap and dock.
3. Seven room buttons and seven minimap rooms are present.
4. Clicking **Master Suite** moves the camera and updates the banner and minimap label.
5. **Smart Glass** cycles Clear → Privacy → Night; body `data-glass`, labels and the HUD
   agree.
6. **Circadian** cycles Daylight → Sunset → Neon; sky, LEDs, room lights and the CSS accent
   move together.
7. `localStorage["nexus2035.tour.v1"]` contains the expected `settings`, `camera` and
   `roomPresets`.
8. Export downloads `nexus2035_house_state.json`; import restores it; reset clears it.
9. A phone width (390 × 844) has no horizontal overflow; the drawer opens and the dock
   scrolls.
10. No uncaught console errors.

## Headless render

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --use-gl=angle --use-angle=swiftshader \
  --enable-unsafe-swiftshader --mute-audio \
  --virtual-time-budget=20000 --timeout=30000 --window-size=1440,900 \
  --screenshot=/tmp/nexus.png "http://localhost:8080/"
```

Use SwiftShader on headless Chrome for this project; the Metal path used by other Three.js
projects can produce an unusable capture.

## What to check by inspection

- Every `FEATURES` record has a matching object in `interactables`.
- Every new room has a `ROOM_DEFS` entry, a `MAP_ROOMS` rectangle, a `roomAtPosition` case,
  colliders and a help/README row.
- Every new light or glass preset is in both the preset table and the `*_ORDER` list, and
  the eight room-light colours/intensities match.
- The skill template matches the root sources byte for byte.
- `state.json` is historical; do not treat its hashes as current.

## Known gaps

Feature-card clicking, walk collision, auto tour, export/import and real touch were not
re-verified in the documentation release. Record what you actually run; do not copy the
older 1.0.0 verification claims forward unexamined.
