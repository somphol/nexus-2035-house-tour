# Testing

## Status of this release

| Evidence | When | Result |
| --- | --- | --- |
| `node --check script.js` | 2026-11-03 | **pass** |
| `node scripts/check.mjs` | 2026-11-03 | **pass after the docs/skill completion** (see §2) |
| Skill checker | 2026-11-03 | **pass** |
| Local load (headless SwiftShader) | 2026-11-03 | **loader `is-done`, 7 room buttons, 7 minimap rooms** |
| Room teleport | 2026-11-03 | **Master Suite active**, banner and minimap updated |
| Smart glass | 2026-11-03 | **Clear → Privacy → Night**, body data and label updated |
| Circadian lighting | 2026-11-03 | **Daylight → Sunset → Neon**, body data and label updated |
| Console exceptions | 2026-11-03 | **0** |
| Phone layout, 390 × 844 | 2026-11-03 | **scrollWidth 390**, no horizontal overflow |
| Desktop screenshot, 1440 × 900 | 2026-11-03 | **831,847-byte PNG** (overview) / **1,082,689-byte PNG** (Master, neon) |
| Phone screenshot, 390 × 844 | 2026-11-03 | **310,540-byte PNG** |
| Live Pages probe (`curl`) | 2026-11-03 | **200** |
| Local vs live `index.html`/`style.css`/`script.js` (SHA-1) | 2026-11-03 | **all match** (`04cd6f9b…` / `b5906b11…` / `28292ceb…`) |
| CDN probes (Three, Orbit, fonts) | 2026-11-03 | **200 / 200 / 200** |
| Feature cards, walk collision, export/import, auto tour | — | **Not re-run** this release |
| Safari / Firefox / Edge / real touch / screen reader | — | **Not verified** |
| CI | — | **No workflow**; `scripts/check.mjs` is manual |

The documentation commit changes Markdown and the skill files only; `index.html`,
`style.css` and `script.js` are untouched.

## 1. Commands

```bash
cd ~/Projects/nexus-2035-house-tour

# run
python3 -m http.server 8080          # http://localhost:8080/
open index.html                      # server preferred for localStorage

# release gate
node --check script.js
node scripts/check.mjs
node ~/.config/opencode/skills/skill-publish/scripts/check-skill.mjs \
  skills/nexus-2035-house-tour

# headless render — SwiftShader, not Metal
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --use-gl=angle --use-angle=swiftshader \
  --enable-unsafe-swiftshader --mute-audio \
  --virtual-time-budget=20000 --timeout=30000 --window-size=1440,900 \
  --screenshot=/tmp/nexus.png "http://localhost:8080/"

# live probe and source match
curl -s -o /dev/null -w '%{http_code}\n' https://somphol.github.io/nexus-2035-house-tour/
shasum index.html style.css script.js
for f in index.html style.css script.js; do
  curl -sL "https://raw.githubusercontent.com/somphol/nexus-2035-house-tour/main/$f" | shasum
done
```

### Browser-console audit

Start Chrome with `--remote-debugging-port=9250 --user-data-dir=/tmp/nexus-profile` and
attach with the DevTools Protocol (Node's built-in `WebSocket` is enough). The checks used
here were:

```js
({
  loader: document.getElementById('loader').className,
  rooms: document.querySelectorAll('.room-btn').length,
  mapRooms: document.querySelectorAll('.map-room').length,
  banner: document.getElementById('banner-name').textContent,
  room: document.querySelector('.room-btn.active')?.dataset.room || null,
  body: document.body.className
})
```

Then click `.room-btn[data-room="master"]`, wait for the flight, and read
`#banner-name`, `#map-room-name` and the stored record under
`localStorage["nexus2035.tour.v1"]`. Cycle `#glass-btn` and `#light-btn` and read
`document.body.dataset.glass` / `.light`.

## 2. Results (2026-11-03)

### Release gate

`node scripts/check.mjs` initially failed **14 of 63 checks** because `AGENTS.md`,
`docs/TESTING.md`, the skill `SKILL.md`/`ATTRIBUTION.md`/references and several README
links were missing. After this documentation release it passes: **OK 82 checks**.

The check covers: required files, local `src`/`href` resolution, relative Markdown links,
`node --check` for every JS file, JSON parsing, skill-template byte equality, README
documentation links, and application invariants (pinned CDNs, canvas hook, storage key,
build/fly/apply functions, export filename, pick function, no `fetch`/XHR/WebSocket,
no TODO/FIXME).

### Local load and state

```text
loader class:        loader is-done
body class:          (loading class removed)
room buttons:        7
minimap rooms:       7
initial banner:      Living & Kitchen
```

Clicking **Master Suite** set the active room, banner and minimap label. The stored
record still showed `overview` immediately afterwards, then showed
`room: "master", lighting: "neon", glass: "night"` after the glass/light cycles. That is
the autosave gap recorded in [AGENTS.md §5](../AGENTS.md#5-known-issues), not a test
failure.

Smart-glass cycling reached **Crystal Clear → Privacy → Night Mode**; circadian cycling
reached **Daylight White → Warm Evening → Cyberpunk Neon**. Body `data-*`, dock labels and
the telemetry strings moved together.

### Phone layout

```text
innerWidth 390 · scrollWidth 390 · no horizontal overflow
room buttons 7 · drawer width 300 px
top bar and dock fit; the drawer opens from the menu button
```

### Screenshots

| View | Size | Observed |
| --- | --- | --- |
| Overview, 1440 × 900 | 831,847 bytes | open-roof house, room drawer, telemetry, dock |
| Master Suite, neon/night, 1440 × 900 | 1,082,689 bytes | restored room, neon lighting, night glass |
| Phone, 390 × 844 | 310,540 bytes | top bar, master suite, dock; no overflow |

The repository screenshots in `docs/*.png` are older captures from the 1.0.0 build.

## 3. Manual matrix

| Area | Check | Status |
| --- | --- | --- |
| Boot | Loader reaches "Nexus online"; overview renders | Verified headless |
| Rooms | Seven room buttons and seven minimap rooms | Verified |
| Teleport | Click a room; camera flies; banner updates | Verified |
| Minimap | Camera dot/heading, room highlight | Rendered; live motion not measured |
| Orbit | Drag/scroll/right-drag | Controls present; gesture not measured |
| Walk | WASD, Shift, drag look, wall collision | Not re-run |
| Glass | Three presets, label and body state | Verified |
| Lighting | Three presets, label and body state | Verified |
| Feature cards | Open/close, focus view, actions | Not re-run |
| Auto tour | T cycles rooms every 8.2 s | Not re-run |
| Pin view | Save and restore a room camera | Not run |
| Autosave | Room, camera, lighting, glass | Verified except room-only save gap |
| Export | `nexus2035_house_state.json` download | Not re-run |
| Import | File restore and validation | Not re-run |
| Reset | Defaults and local record cleared | Not re-run |
| Mobile | 390 × 844, no overflow, drawer/dock usable | Verified in emulation |
| Reload | Restores saved room/lighting/glass | Stored record verified; reload by code |

## 4. Failure triage

- **Loader never leaves "Preparing"** — check the console and the CDN; `initEngine()` is
  the first hard dependency. The loader prints "Spatial engine failed" through `fatal()`.
- **Black or blank canvas** — WebGL is unavailable or the renderer failed. Try a hardware-
  accelerated browser; headless needs the SwiftShader flags above.
- **A room click does not persist** — known: room selection alone does not call
  `scheduleSave()`. Change glass/light or move the camera, or use **Pin View**.
- **A feature card will not open** — the prop may not be registered in `interactables`
  (`firepit`, tech rack). See `docs/REPRODUCTION.md` §10.
- **Import rejected** — the file must be JSON with `app: "nexus-2035"` or a `settings`
  object; field-level fallbacks are intentional.
- **Storage warning** — private mode or a blocked origin; the HUD shows
  `AUTOSAVE BLOCKED`.
- **Fonts look wrong** — Google Fonts was blocked; the app falls back to system faces.

## 5. Not verified

- Walk mode: WASD, Shift boost, drag look, collision with every wall/furniture collider.
- Feature-card opening, focus view and the four object actions (hologram, bed glow,
  induction, grow lights).
- Auto tour timing and wrap-around; pin view save/restore.
- A real JSON export download and import into a cleared profile.
- Reset.
- Safari, Firefox, Edge, real iOS/Android, touch orbit/pinch, HiDPI and screen readers.
- Long-session stability, FPS under load, and reduced-motion behaviour for ambient
  animation.
- The older 1.0.0 verification claims in `state.json` and `docs/REPRODUCTION.md` §8; this
  release re-checked boot, room/glass/light interaction, storage shape and mobile layout.
