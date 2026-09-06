# Appraisal Sketch 1.0

A standalone, offline, single-file sketching application for residential
appraisal floor plans: exterior/interior walls, curved walls, room shapes,
area definitions with GLA/basement rollups, dimensioning, symbol and text
libraries, multi-page documents, image underlays, and PNG/SVG/DXF/PDF/XML
exports. Runs entirely in the browser from one HTML file — no install, no
server, no network access required.

## Running

Open `sketch.bundle.html` in any modern browser (Chrome, Edge, Brave, Firefox).
Everything is local: the file works from `file://` with no web server.
For suite integration, embed it in an iframe — the host communicates through
`window.__exportState`, `window.__importState`, and
`window.__exportValidationState` (see `docs/FORMAT_COMPATIBILITY.md`).

## Documentation

- `docs/INTERFACE_INVENTORY.md` — interface architecture and DOM/event map
- `docs/FORMAT_COMPATIBILITY.md` — file formats, storage keys, preserved
  compatibility literals, host contract, and verification results
- `docs/PHASE6_VERIFICATION.md` — full verification report (parity, exports,
  performance, identity audit)
- `NOTICE.md` — third-party component notices (Phosphor Icons, MIT)

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `Ctrl+K` | Command palette (search all commands) |
| `F1` | Full keyboard shortcut reference |
| `F2` | Save |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo |
| `Ctrl+X` / `Ctrl+C` / `Ctrl+V` | Cut / copy / paste |
| `Ctrl+A` | Select all |
| `Delete` | Delete selection |
| Arrow keys | Move drawing cursor (nudge) |
| `10` then arrow | Draw a 10 ft wall in the arrow direction |
| `Enter` | Commit the wall in progress |

## File formats

- Native save format: `Sketch-Web` JSON model (`.json`, `.skx` containers)
- Legacy reads retained: `.apx`, `.sketch`, legacy JSON (format decided by
  file bytes, never by extension)
- Exports: PNG, SVG, DXF (R12 ASCII), PDF (via browser print), XML
  (area breakdown, `urn:xmlns:apex:sketch:xml` namespace — preserved
  compatibility literal, see FORMAT_COMPATIBILITY.md)

## License

Copyright (c) 2026 Gerald Shugars, Jr. (NW Evaluations).

Released under the **PolyForm Small Business License 1.0.0** — personal,
research, educational, charitable, and government use are permitted, as is
business use by companies with **fewer than 100 employees and contractors and
under 1,000,000 USD (2019, inflation-adjusted) revenue in the prior tax year**.
Larger companies need a separate commercial licence. See `LICENSE` for the
full text.

Third-party components (Phosphor Icons) are MIT-licensed; see `NOTICE.md`.

## Support

thatappraiserx@gmail.com
