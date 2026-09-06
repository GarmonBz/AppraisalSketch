# Changelog

## 1.1.0 — 2026-09-05

### Areas panel
- Area classification is now a colour-swatch palette instead of an expandable
  code tree. Each type shows the colour it paints on the canvas, its code and a
  live count of the areas using it; group sections collapse.
- Assign by dragging a swatch onto an outline, or click a swatch to arm it and
  click outlines in turn. Dragging the red **Undefined** swatch clears a
  classification.
- Right-click a type for a menu: assign to the selection, assign by clicking,
  select the areas using it, edit, create, or delete the type. Delete is new —
  it warns, reassigns affected areas to unclassified, and refuses to remove
  `UND` itself.
- Right-click an area — in the Calcs list or on the drawing — to edit its
  definition. **Edit Definition…** now leads the canvas context menu over an
  area.
- The tab is for defining only; the duplicated area list and living-area total
  were removed in favour of Calcs, which already reported both.
- The code library and area tools now share one **Edit areas…** sheet of two
  flat sections (Area operations, Label defaults). The code tree, its search,
  the pending readout and the Apply button are retired — arming a swatch now
  sets the classification state they used to own, so Define First and Redefine
  keep working.

### Fixes
- GBA1–GBA10 shared six identical greens; replaced with a perceptually even
  ten-step ramp.
- The sidebar pin preference was live and saved but had no reachable control, so
  a file saved with it off hid the dock on every placement with no way back.
- The area list grew unbounded, pushing the living-area total off-screen once a
  sketch had more than eight areas.
- The collapse and expand chevrons on the dock used an icon weight this build
  does not ship, so they rendered as invisible zero-width buttons.
- `package.json` declared `ISC`, which never matched the LICENSE file.

### License
- Relicensed to **PolyForm Small Business License 1.0.0**, replacing PolyForm
  Noncommercial 1.0.0. This loosens the terms: business use is now permitted for
  companies with fewer than 100 employees and contractors and under
  1,000,000 USD (2019, inflation-adjusted) prior-year revenue. Larger companies
  need a separate commercial licence.
- Note: v1.0.0 remains available under Noncommercial terms to anyone who
  obtained it; relicensing forward does not retract that grant.

## 1.0.0 — 2026-09-05

First independent release of Appraisal Sketch.

### Interface (new identity)
- Independent visual identity: charcoal/stone surfaces with a single teal
  accent, light/dark/blue theme token system, coherent spacing and focus
  states, tabular numerals for measurements.
- Original logo and favicon (inline SVG; the prior C2PA-signed PNG asset was
  removed).
- Relabeled for clarity: "Photometrics" → "Reference Image",
  "Auto-Post" → "Automatic labels".
- Support routing: thatappraiserx@gmail.com.

### New interface capabilities
- Command palette (`Ctrl+K` or the toolbar magnifier): search-and-run across
  42 commands, routed through the existing command registry.
- Pages navigator (left rail): page switching, per-page underlay ghosting,
  page deletion — synchronized with the status-bar page controls.
- Persistent totals chip in the status bar: live GLA and area count,
  click-through to the calculation panel.
- Grouped tool shelf with separators for faster tool targeting.

### Renames (behavior-neutral)
- `ApexApp` → `SketchApp`, `ApexReport` → `SketchReport`,
  `.apex-report-page` → `.report-page`. No external consumer referenced the
  old names (verified against the suite host source).

### Preserved (verified identical to the pre-remodel baseline)
- Save model, XML export (including the `urn:xmlns:apex:sketch:xml`
  compatibility namespace), SVG/DXF export geometry, validation projection,
  preference storage, legacy file reads, and host integration hooks.
  Evidence: `docs/PHASE6_VERIFICATION.md`, `docs/FORMAT_COMPATIBILITY.md`.

### Performance
- No regressions vs. the pre-remodel baseline on the standard fixture;
  full render improved ~45% (3.1 ms → 1.7 ms).

### License
- PolyForm Noncommercial License 1.0.0. Commercial use is not permitted.
  Third-party notices in `NOTICE.md` (Phosphor Icons, MIT).
