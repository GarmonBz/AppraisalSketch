# Changelog

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
- PolyForm Small Business License 1.0.0. Business use is permitted for companies
  under 100 people and under 1,000,000 USD prior-year revenue; larger companies
  need a separate commercial licence.
  Third-party notices in `NOTICE.md` (Phosphor Icons, MIT).
