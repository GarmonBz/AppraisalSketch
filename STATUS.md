# STATUS — Interface remodel (D:\AIProjects\Sketch Test)

Plan: INTERFACE_AND_OPEN_SOURCE_PLAN.md (Phases 1–7).
Target: sketch.bundle.html (single generated HTML, ~10.4 MB). Git repo initialized (baseline commit a508b7a).

## Ledger

| # | Item | Status |
|---|------|--------|
| 1 | Phase 1.1 baseline + SHA-256 320dcf2b… | DONE 2026-09-05 |
| 2 | Phase 1.2 editing workflow = controlled-section edits of the bundle (no generator); layered-style pattern | DONE 2026-09-05 |
| 3 | Phase 1.4 Apex-name inventory → docs/INTERFACE_INVENTORY.md | DONE 2026-09-05 |
| 4 | Phase 1.5 DOM/JS dependency map → docs/INTERFACE_INVENTORY.md §4 | DONE 2026-09-05 |
| 5 | Phase 1.6 third-party inventory (Phosphor woff2 embedded, NO license notice found; C2PA favicon) | DONE 2026-09-05 |
| 6 | Host-contract check: AW3 shell.html uses only __exportState/__importState/__exportValidationState — ApexApp/ApexReport/.apex-report-page renames safe | DONE 2026-09-05 |
| 7 | Renames: ApexApp→SketchApp, ApexReport→SketchReport, .apex-report-page→.report-page, mailto, comments | IN PROGRESS |
| 8 | Logo/favicon replacement (C2PA PNG out, original inline SVG in) | PENDING |
| 9 | New skin layer (tokens: stone/charcoal + teal; restyle chrome) | PENDING |
| 10 | Copy: Photometrics→Reference Image, Auto-Post→Automatic labels | PENDING |
| 11 | NOTICE.md third-party notices | PENDING |
| 12 | Browser runtime verification (boot, console, screenshots) | PENDING |

## Notes / decisions
- Never blind-replace "apex": escapeXml + geometric apex (curveApex etc.) + `urn:xmlns:apex:sketch:xml` (format contract) + `.apx/.skx` accept lists all stay. Justification in docs/INTERFACE_INVENTORY.md §2.
- Keep every id / data-command / data-target / data-sidebar-* intact; JS couplings listed in inventory §4.
- Composition remodel (document bar/tool shelf/navigator/inspector re-architecture) = next milestone; this pass delivers identity, tokens, chrome restyle, copy, renames.
