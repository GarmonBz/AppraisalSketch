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
| 7 | Renames: ApexApp→SketchApp, ApexReport→SketchReport, .apex-report-page→.report-page, mailto, comments | DONE 2026-09-05 |
| 8 | Logo/favicon replacement (C2PA PNG out, original inline SVG in; −94 KB) | DONE 2026-09-05 |
| 9 | New skin layer (tokens: stone/charcoal + teal #14B8A6; chrome restyle; native-control theming) | DONE 2026-09-05 |
| 10 | Copy: Photometrics→Reference Image, Auto-Post→Automatic labels (UI strings only) | DONE 2026-09-05 |
| 11 | NOTICE.md third-party notices (Phosphor MIT; original mark) | DONE 2026-09-05 |
| 12 | Runtime verification (headless CDP): clean boot, 0 exceptions, SketchApp live, 76 data-command btns, tab/panel/theme switching, report render emits .report-page, host hooks __exportState/__importState/__exportValidationState round-trip OK, screenshots in docs/qa-*.png | DONE 2026-09-05 |
| 13 | Visual pass (vision QA on screenshots): 3 native-control defects found → fixed (dark selects, teal accent-color, no blue outlines) → re-verified clean | DONE 2026-09-05 |
| 14 | Git commit 1b6f12b | DONE 2026-09-05 |
| 15 | M2: tool shelf grouping (5 groups + separators), save-state pill in doc bar, Ctrl+K command palette (42 commands routed through existing executeCommand registry) | DONE 2026-09-05 |
| 16 | M2 runtime verify: boot clean, palette open/filter/run/Esc/Ctrl+K pass, pill updates on rename; top-bar crop verified alignment; commits 56e890f | DONE 2026-09-05 |
| 17 | M3: left pages navigator (page switch rows, underlay ghosting per row, hover delete routed through deletePage(), mirrored underlay select), toggle in tool shelf, hooked into updatePageDisplay | DONE 2026-09-05 |
| 18 | M3 verify: boot clean w/ rows at load (deferred render), add/switch/ghost/un-ghost/close pass, canvas resize clean, visual crop verified; commit 3890ee3 | DONE 2026-09-05 |
| 19 | M4: persistent totals chip in status bar (live GLA + area count, refreshed by updateCalcsPanel on every recalc path, click opens Calcs panel) | DONE 2026-09-05 |
| 20 | M4 verify: end-to-end draw+define test (20x15 rect, GLA1 -> chip "GLA 300.0 sf | 1 area", summary matches), boot clean, status-bar crop verified; commit 6317904. NOTE: valid GLA codes are GLA1..GLA4 (per-floor), bare 'GLA' is not a code | DONE 2026-09-05 |
| 21 | Phase 5: compatibility doc (docs/FORMAT_COMPATIBILITY.md) + namespace site comment | DONE 2026-09-05 |
| 22 | Phase 5 verify: baseline-vs-remodel parity harness — saveModel 0 diffs, XML 0 diffs (ns preserved both sides), validation identical, prefs round-trip pass, legacy load pass; commit 21e3481 | DONE 2026-09-05 |
| 23 | Phase 6: SVG/DXF export parity (geometry+entity streams identical baseline↔remodel), undo/redo restore, corrupt/empty/wrong-shape file handling, perf baseline (no regressions; render −45%), final identity scan (0 brand hits, allowlist documented) → docs/PHASE6_VERIFICATION.md; commit 8da7560 | DONE 2026-09-05 |
| 24 | Phase 7: license, README, release packaging (owner decisions: name, support destination) | PENDING |

## Notes / decisions
- Never blind-replace "apex": escapeXml + geometric apex (curveApex etc.) + `urn:xmlns:apex:sketch:xml` (format contract) + `.apx/.skx` accept lists all stay. Justification in docs/INTERFACE_INVENTORY.md §2.
- Keep every id / data-command / data-target / data-sidebar-* intact; JS couplings listed in inventory §4.
- Composition remodel (document bar/tool shelf/navigator/inspector re-architecture) = next milestone; this pass delivers identity, tokens, chrome restyle, copy, renames.
