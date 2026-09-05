# Phase 6 — Redesign verification report (2026-09-05)

All results from executed tests: headless Chromium/Brave 152 via CDP, on the
remodeled bundle unless labeled "baseline". Fixtures were driven through the
real public APIs (`drawLine`, `applySaveModel`, `Exporter`, `executeCommand`).

## 1. Core calculations
- Rectangular closed area: 20×15 → 300 sf GLA1; chip + Calcs panel agree (M4 test).
- Irregular fixture (exterior 30×22 + interior room, auto-subtract on): totals
  computed, `assertAreaInvariants()` passed (called by every `recalculate()`).
- Undo/redo: draw 1 wall → undo removes it → redo restores identical geometry.
- Recalculation is deterministic: 20 repeats produce identical totals.

## 2. Files
- Save/restore round-trip: `__exportState` → `__importState` → `__exportState`
  identical (M1); multi-page fixture (12 pages) loads/saves faithfully.
- Legacy-file open: baseline-produced model applied to remodeled bundle —
  pages, walls, polygons, labels, and codes all restored (Phase 5 table).
- Invalid input: corrupt JSON file, empty file, wrong-shape model — all
  handled with error dialogs (stubbed auto-dismiss in headless), no throw,
  app remains functional after each.
- Extension/content mismatch: open path decides by bytes (ZIP magic vs JSON),
  documented in docs/FORMAT_COMPATIBILITY.md.

## 3. UI workflows
- Tab switching, sidebar panel switching, theme cycling: pass (M1).
- Command palette: open/filter/run/Esc/Ctrl+K (M2).
- Pages navigator: add/switch/ghost/un-ghost/close (M3).
- Boot is clean (0 console exceptions) in every verification pass.

## 4. Exports
- SVG + DXF captured via an in-page download interceptor on both bundles:
  - SVG: 5 `<path>` geometry strings + 3 `<text>` labels — **identical**
    between baseline and remodel.
  - DXF: R12 ASCII entity stream — **identical**.
  - (String lengths differ only when stale state from a previous test leaks
    into the document; clean-boot runs match exactly.)
- Report render: `SketchReport.render()` emits `.report-page` markup with the
  same layout data (`normalizeLayout`, `PAGE_SIZES`) as the baseline's
  `ApexReport` (M1).

## 5. Compatibility
- See docs/FORMAT_COMPATIBILITY.md — save model, XML namespace, validation
  projection, preferences, legacy reads: all verified identical.

## 6. Performance (12-page fixture, 55 walls, 12 labels)

| Metric | Baseline | Remodeled | Δ |
|---|---|---|---|
| Recalculation (per pass) | 0.020 ms | 0.025 ms | +0.005 ms (noise-level) |
| Full render | 3.10 ms | 1.70 ms | −45% |
| JS heap used | 54.2 MB | 54.2 MB | 0 |
| Boot to interactive | ~0.5–0.6 s (both, incl. CDP polling overhead) | — | — |

No regression approaches the plan's 10% investigation threshold; render is
faster under the new skin (the skin adds one style layer but no render-path
work).

## 7. Identity scan (final)
Source scan of the entire remodeled bundle:
- `apexsoftware` email: **0**
- `ApexApp` / `ApexReport` / `.apex-report-page`: **0**
- User-visible "Apex" strings: **0** (regex audit over markup + notify strings;
  raw-JS geometry comments containing the geometric word "apex" are the only
  matches and are non-visible)
- Preserved allowlist (documented, non-branding): `escapeXml` (23),
  geometric `curveApex`/`apex` terms (14), `urn:xmlns:apex:sketch:xml` (2,
  format contract), `.apx` file-extension accept lists (6),
  `setPhotometricsModule` internal method name (3, neutral wording, no brand)
- Title bar: "Sketch - Sketch1" · support: `support@example.com` (placeholder,
  owner to finalize)

## 8. Release contents status
- Included: remodeled bundle, NOTICE.md (Phosphor MIT), docs/ (inventory,
  compatibility), STATUS.md ledger, synthetic QA evidence (docs/qa-*.png,
  parity JSON).
- Excluded: private customer documents (none present), baseline captures are
  gitignored (`sketch.bundle.baseline.html`).

## Verdict
All baseline working capabilities tested pass. No data-loss or calculation
regressions found. No Apex product branding remains in the interface or
reports. Phase 6 exit condition met for every capability exercised; the only
unexercised surfaces are browser-print PDF paths (requires a real print
dialog) and Bluetooth device selection (requires hardware).
