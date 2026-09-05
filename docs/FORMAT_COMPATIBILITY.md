# Format & storage compatibility notes (Phase 5)

Status after the 2026-09 interface remodel. Everything here was verified by
executed tests unless marked otherwise.

## Verification results (2026-09-05, headless CDP, executed)

| Test | Method | Result |
|---|---|---|
| Save-model parity | Same fixture drawn through baseline and remodeled bundles; `buildSaveModel()` diffed field-by-field | **0 differences** (excluding volatile `savedAt`) |
| XML export parity | `AreaBreakdown.toXml()` from both bundles diffed line-by-line | **0 differences**; `urn:xmlns:apex:sketch:xml` present in both |
| Validation projection | `__exportValidationState()` both bundles | identical `{totalGLA: 660, revision: 3}` |
| Preference round-trip | Seeded `sketch.areaCodes`, `sketch.textLibraryLabels`, `sketch.interfaceTheme`; reload | keys read back; custom code `QA1` visible to app; theme applied |
| Legacy-file open | Baseline-produced save model applied to remodeled bundle via `applySaveModel()` | pages/lines/polys/labels/code all restored faithfully |
| Host contract | `__exportState` → `__importState` → `__exportState` round-trip | pass (see Phase 1 / M1 ledger) |


## Deliberately preserved format literals

| Literal | Where | Why it stays |
|---|---|---|
| `urn:xmlns:apex:sketch:xml` | `AreaBreakdown.toXml()` (XML export root element) | Serialized-format contract. Downstream consumers key on this namespace; renaming it would silently break every XML export consumer. Isolated in `toXml()` with a COMPATIBILITY LITERAL comment at the site. |
| `.apx`, `.skx`, `.json`, `.sketch` | file-input `accept` lists (open + import) | Legacy read compatibility. The open path decides format by file bytes (ZIP magic → container; otherwise legacy JSON), never by extension, so renamed files still open. |
| `version: 'Sketch-Web'`, `areaModelVersion: 1` | `buildSaveModel()` | Save-model versioning. Existing files and suite workfiles must keep loading; the remodel introduced no model changes. |

## Storage namespaces (unchanged)

All preferences remain under the `sketch.*` localStorage namespace, same keys,
same semantics — no migration needed because the remodel changed no storage:

| Key | Content |
|---|---|
| `sketch.areaCodes` | custom area codes |
| `sketch.defaultSubjectComments` | default subject comments |
| `sketch.defaultOptions` | saved default options |
| `sketch.hiddenSymbols` / `sketch.purgedSymbols` / `sketch.purgedCategories` | symbol manager state |
| `sketch.symbolFavorites` | favorite symbols |
| `sketch.textLibraryLabels` | text library |
| `sketch.recentFiles` | recent files (model cache, not raw bytes) |
| `sketch.interfaceTheme` | light/dark/blue interface theme |

## Host integration contract (AW3 suite)

Verified unchanged. The suite (`shell.html`) communicates with the sketch frame
exclusively through:

- `window.__exportState()` — full drawing model for workfile save
- `window.__importState(model)` — workfile restore
- `window.__exportValidationState()` — `{totalGLA, revision}` completeness projection
- `suite:sketchpreview` / `suite:sketchrecalculated` CustomEvents — preview + GLA push
- `window.app.buildSaveModel()` / preview consumers via the above hooks only

The `ApexApp`→`SketchApp` and `ApexReport`→`SketchReport` renames are invisible
to the host: grep of the suite source shows zero references to the old global
names, and the CDP round-trip test (`__exportState` → `__importState` →
`__exportState`) passed on the remodeled bundle.

## Save/restore semantics preserved

- `buildSaveModel()` keys unchanged: `version, areaModelVersion, fileName,
  nextId, areaCodes, layers, activeLayerId, pages, subjectInfo,
  subjectInfoAutoFilled, extendedData, settings, savedAt`
- `applySaveModel()` still accepts the same models, including legacy
  `areaModelVersion < 1` migration via `migratePageIds`
- Recent-files cache stores the parsed model (not raw container bytes) — unchanged

## What changed for file consumers: nothing

The remodel touched presentation (CSS, chrome markup, two renamed JS globals,
an SVG logo) and added UI modules (command palette, pages navigator, totals
chip). Serialization, calculation, export (PNG/SVG/DXF/PDF/XML), and storage
code paths are byte-identical apart from the documented renames that no
external consumer references.
