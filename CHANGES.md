# How this fork differs from the Layercake site

This is an unofficial fork of
[osmus/layercake.openstreetmap.us](https://github.com/osmus/layercake.openstreetmap.us),
not the OpenStreetMap US Layercake. For the official extracts and explorer, see
[openstreetmap.us/our-work/layercake](https://openstreetmap.us/our-work/layercake/).

Forked from upstream `main` at
[`3edbe33`](https://github.com/osmus/layercake.openstreetmap.us/commit/3edbe331d40a90139c2dcef25ea03932fa499863)
("Add wetlands layer to docs and explore UI"). Full diff of this branch against
that commit:
[`3edbe33...osm-lol`](https://github.com/mvexel/layercake.openstreetmap.us/compare/3edbe331d40a90139c2dcef25ea03932fa499863...osm-lol).

Only the explorer (`explore/`) is changed and deployed, at
[layercake.osm.lol/explore/](https://layercake.osm.lol/explore/), reading the
daily Utah build from
[the Layercake fork](https://github.com/mvexel/layercake/blob/osm.lol/CHANGES.md).
The Jekyll docs site is not deployed; its links point to the official site.

## Explorer features

- **OR between filters.** Each filter after the first has an and/or connector.
  OR binds tighter than AND, so `a or b and c` means `(a or b) and c`:
  alternatives for one condition sit next to each other. Each run of OR-joined
  filters compiles to one parenthesized term (`explore/src/query/filters.ts`).
  Branch [`or-filters`](https://github.com/mvexel/layercake.openstreetmap.us/tree/or-filters)
  holds this and the next item.
- **Grouping spelled out.** When filters mix and and or, a line under the filter
  bar shows them as one expression with parentheses, notes that this differs
  from SQL, where AND binds first, and that a filter never matches rows missing
  its value, linking to DuckDB's docs on logical operators and NULL.
- **Data bounds on the map.** When `metadata.json` has `bounds`, the map shades
  everything outside them, opens fitted to them unless the URL names a
  position, and allows zooming out one level and panning until their edge
  reaches the middle of the screen (`explore/src/map/MapView.ts`). Without
  `bounds`, as on data.openstreetmap.us, nothing changes.
- **Unofficial notice.** On unofficial builds a yellow bar above the header says
  this is not the OpenStreetMap US Layercake and links to the official page.

## Build-time settings

All default to the official deployment's behavior (`explore/src/site.ts`,
`explore/src/catalog.ts`, `explore/src/map/MapView.ts`):

| Variable | Purpose |
| --- | --- |
| `VITE_LAYERCAKE_DATA_URL` | Base URL of the Layercake files |
| `VITE_LAYERCAKE_MAP_VIEW` | Initial map view, `lng,lat,zoom` |
| `VITE_LAYERCAKE_SITE_URL` | Origin for the Docs and layer links |
| `VITE_LAYERCAKE_REPO_URL` | Target of the GitHub link |
| `VITE_LAYERCAKE_UNOFFICIAL` | `true` shows the unofficial notice |
| `VITE_LAYERCAKE_UNOFFICIAL_DETAIL` | Extra sentence in that notice |

## Deployment

- `Dockerfile` builds the explorer into a Caddy image serving `/explore/`
  (`deploy/Caddyfile`).
- `deploy/compose.yaml` runs it as the Komodo stack `layercake-explorer`,
  built against `https://layercake.osm.lol/utah` with the GitHub link pointing
  at [mvexel/layercake](https://github.com/mvexel/layercake).
- `CHANGES.md` (this file).
