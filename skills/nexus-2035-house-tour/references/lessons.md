# Lessons

These are the non-obvious decisions from the reference build. Read them before simplifying
the architecture.

## Keep the world contract in one place

Room cameras, colliders, walk-region tests, minimap rectangles and the auto tour all assume
the same floor plan. Moving a wall without moving the collider produces a camera that walks
through it; moving a room camera without the minimap rectangle produces a dot in the wrong
room.

## Do not add a feature record without an object

A `FEATURES` entry only supplies the card. The prop group must be registered in
`interactables` with `userData.feature`. In the reference build the fire pit and tech rack
are known cases where the record exists but the object is not registered.

## Save on the action, not only on the timer

`scheduleSave()` is debounced and guarded by `state.ready`. The reference build saves on
camera drag, walk, glass and light changes, but **not** on a room click alone; the room
reaches storage only when a later action schedules a save. Call `scheduleSave()` from any
new navigation action that should persist.

## Keep the loader honest

The loader percentages pace a phased async boot; they are not a measured loading bar.
Every phase yields a frame. If a step throws, `fatal()` must leave a readable message rather
than a spinner forever.

## Device budgets are part of the design

Shadows, stars, skyline counts, traffic and hologram particles drop on mobile. Keep the
counts in one table and do not add a new particle system without a mobile budget.

## Reduced motion is partial

Camera flights and CSS transitions honour the preference; ambient animation (hologram,
fire, traffic, glow) continues. If a stricter interpretation is required, gate those loops
as well and document it.

## State is local and finite

`localStorage` is the only store. The auto tour always restores off. Import has no version
migration: validate every field and fall back. A storage exception at boot must not block
the scene from rendering.

## Test the delivery, not just the scene

The release gate checks required files, links, syntax, JSON, skill-template equality,
README links and app invariants. A scene that renders is not a release: the docs, skill and
template are part of the shipped artifact.

## CDN dependency is a trade-off

Three files and Pages-root delivery were chosen over a bundled, offline build. The cost is
two script CDNs plus Google Fonts. Keep the failure message clear and do not claim offline
support.
