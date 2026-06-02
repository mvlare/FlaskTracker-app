# Sampling Map — OpenStreetMap / Leaflet

## What it does
A map modal on the sampling sheet that plots each `box_content_lines` row that has coordinates, using `flask.name` as a label. Opened via the **"View sampling locations on map"** button below the sampling table (only visible when at least one line has coordinates).

## Key files
- `src/lib/components/sampling/SamplingMapModal.svelte` — modal component
- `src/routes/sampling/[headerId]/+page.svelte` — hosts the button and mounts the modal

## Data source
No new server endpoint. The `load` function in `+page.server.ts` already returns `sampledLat`, `sampledLon` (parsed `doublePrecision`) and `flask.name` for every line. The modal receives `data.lines` directly as a prop.

Relevant schema columns on `box_content_lines`:
- `sampledLat` / `sampledLon` — parsed decimal degrees (`doublePrecision`, nullable)
- `sampledLatRaw` / `sampledLonRaw` — original string as entered by user

## Map behaviour
- Markers: sky-blue `circleMarker` with a permanent label tooltip (flask name)
- Hover: opens a popup with all sampling fields except comments (date/time UTC, raw lat/lon, pressures, local times, wind, ship speed)
- Fit: `fitBounds` with `padding: [20, 20]` for multiple points; single point zooms to level 10
- Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (OSM standard)

## Vercel / bandwidth impact
- Map tiles are fetched **directly from OpenStreetMap servers** — zero Vercel bandwidth
- Leaflet JS (~40 KB gzipped) is **dynamically imported** (`await import('leaflet')` inside `onMount`) — only downloaded when the map is opened for the first time, then cached by the browser
- Leaflet CSS (~4 KB gzipped) is bundled with the sampling page via a static `import` in the modal component — downloaded once on first visit, then cached
- Safe to run on Vercel free (Hobby) plan indefinitely

## Dependency
```
leaflet          (runtime)
@types/leaflet   (dev)
```

## Important: icon name conflict
The lucide-svelte icon `Map` conflicts with the native JS `Map` constructor. It must be aliased on import:
```ts
import { Map as MapIcon } from 'lucide-svelte';
```
The sampling page uses `new Map(...)` twice (sort index and flask index), so this alias is required.
