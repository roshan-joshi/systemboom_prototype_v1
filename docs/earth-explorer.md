# SYSTEMBOOM Earth — final prototype architecture (Phase 1.7)

## Renderer ownership

| World | Renderer |
| --- | --- |
| Cosmos / Solar System / Earth-from-space | React Three Fiber (three.js) |
| Earth exploration (orbit → continent → country → city → place) | **Google Maps JS API — 3D (`Map3DElement`, `maps3d` beta channel)** |
| Geographic/place search | **Google Places API (New)** — `Place.searchByText` |
| Street View / ground | Future (E7), not implemented |

History: Phase 1.5 used CesiumJS (removed — no Ion dependency wanted);
Phase 1.6 used Leaflet + OSM (removed in 1.7 — flat-map feel broke the
continuous-Earth product goal). No Leaflet or Cesium code remains.

## API key

- Read exclusively from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (see
  `.env.example`). Never hardcoded.
- Required APIs: **Maps JavaScript API**, **Places API (New)**. No others.
- Without a key the Earth Explorer renders a clear configuration state
  (no silent fallback renderer). The Cosmos stays fully usable.

## The continuous journey

Natural zoom is the primary entry: with Earth focused, wheel/pinch
closes in; crossing ~2.0× Earth-radius fires the handoff automatically.
"Explore Earth" remains as an optional shortcut into the same state.

Handoff: the facing-hemisphere tracker (sphere intersection at view
center, calibrated to the equirectangular texture) provides lat/lon;
atmospheric haze bridges the cross-fade; `Map3DElement` opens at
~9,000 km camera range over the same coordinates (matching apparent
globe size), then `flyCameraTo` continues the descent to ~5,200 km.
Zooming out past ~13,500 km range (or "← Space", or Escape) reverses
the sequence back to the R3F Earth, then the Solar System. No reloads.

## Camera model

Current supported APIs only: `center` (lat/lng/altitude), `range`,
`tilt`, `heading`, `flyCameraTo`, `stopCameraAnimation`. Camera context
is polled and mapped onto the semantic tiers (E0–E6) for the breadcrumb
and scale chip via the curated resolver.

## Coverage & attribution

Google's photorealistic 3D coverage varies by region; where detailed 3D
is absent the map continues with satellite/terrain (HYBRID mode) — never
misrepresented. Google attribution renders natively inside
`Map3DElement` and is never obscured or imitated; SYSTEMBOOM overlays
keep clear of it.

## Cost considerations (for later phases)

Map3DElement sessions and Places (New) text search are billed SKUs.
Prototype usage is low-volume and key-restricted; production usage needs
quota review, session management, and billing alerts before launch.
