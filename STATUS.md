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
| 24 | Phase 7: LICENSE (PolyForm Noncommercial 1.0.0 — no commercial use), README, CONTRIBUTING, SECURITY, CHANGELOG, NOTICE update; identity applied (Appraisal Sketch 1.0, thatappraiserx@gmail.com); runtime re-verified; commit 8823cfe, tag v1.0.0 | DONE 2026-09-05 |

## RELEASE: v1.0.0 tagged 2026-09-05. All plan phases complete.
## POST-RELEASE: color scheme reverted to original (owner: palette predates and is unrelated to Apex).
Rebuilt from pristine baseline replaying all non-color edits (renames, copy, logo, modules, docs); original stylesheet byte-identical except the single .apex-report-page class rename; all 100 original icon colors back; teal fully removed; new features (palette/nav/chip/pill) recolored to original #007acc accent. Verified: runtime sweep + vision QA (docs/qa-original-scheme.png); commit 2dbde4e.

## POST-RELEASE: wall-solids master switch
Added `wallSolids` option (default **false**, disabled) gating ALL geometric wall-solid rendering. Edits: defaultOptions, options-dialog Wall Solids fieldset (new "Enable wall solids" checkbox + updated hint), booleans collector, both gate functions (`SketchApp.wallSolidsEnabled` L14420 and export-side `wallSolidsEnabled(options)` L9662 → now `Boolean(options.wallSolids) && thickness>0 && WallSolids`), applyOptions normalization. Covers canvas, report/print SVG (renderSketchSvg + bounds), DXF export, face snapping, ortho edges, measureTo offset ring. Thickness>0 alone no longer enables solids.
Verified headless CDP (rect 20×15): boot clean; default off (gate false, getWallSolids null, 0 canvas fills, 0 report solid paths, DXF 4 LINE/0 POLYLINE); dialog checkbox toggle → on (4 solids, 4 canvas fills, +4 report paths, DXF 4 POLYLINE/0 LINE) → off again (all revert); save-model carries flag both ways. Visual QA of dialog: checkbox aligned/unchecked, no new defects (white number inputs + blue OK = pre-existing original-scheme styling). docs/qa-wall-solids-toggle.png. Note: skill verifier "tool buttons" probe (expects 16 .tool-btn) fails on BOTH pre- and post-edit bundles — pre-existing stale probe, not this change.

## POST-RELEASE: drawing pointer replaced from owner-supplied Pointer.png
Owner dropped `D:\AIProjects\Sketch\Pointer.png` (729×729 black crosshair-with-arcs on white). Converted to transparent master (alpha = inverted luminance ×1.06, art flattened over white first), downscaled LANCZOS to 128/64/32, and spliced into the bundle's `__CURSOR_DATA__` (line ~6291) replacing ALL 7 entries: cursor.png + cursor-{32,64,128}.png (inverted-light artwork for dark canvas, matching the original sprites' convention) + cursor-{32,64,128}-light.png (exact RGB inversion for light canvas). Hotspot stays center (size/2, size/2) via existing code. LESSON: payload values MUST be full `data:image/png;base64,…` URLs — bare base64 makes __cursorUrl return a relative path → ERR_FILE_NOT_FOUND + broken cursor. Data URLs mean no byte-identity across saves (PIL optimize flag differs); compare pixels, not bytes.
Verified headless CDP: boot clean (0 exceptions/resource errors), all 7 keys resolve to data URLs, live sprites pixel-identical to generated references, cursor resolves at 128/64/32 × dark/light with correct hotspot offsets, getDrawingCursorImage loads 128px and 32px; skill verifier ALL PASS. Visual: 32px sprite on dark = crisp 1px continuous strokes, perfectly centered (docs reference Temp preview; see commit).

## POST-RELEASE: status-bar page indicator glyph-stacking fix
Owner screenshot: "1 of 1" between page chevrons rendered as overlapping stacked glyphs. Root cause: `#page-display` is a flex item with default `white-space: normal` + `flex-shrink: 1`; when the status bar runs out of room (owner runs 200% DPI scaling → ~500 CSS px viewport), it collapses to ~15px wide and wraps into a 3-line stack. Fix in new appended style layer before `</head>`: `#page-display { white-space: nowrap; flex: 0 0 auto; min-width: max-content; }` + `.page-indicator/.status-right { flex: 0 0 auto; nowrap }` + `.status-bar { overflow-x: auto; scrollbar-width: thin }` (bar previously just clipped its right side off-screen at narrow viewports — pre-existing; scroll keeps every control reachable).
Verified headless CDP: at 500 CSS px (DPI-scaled case) display stays 15px single-line and is reachable via bar scroll; at 1600 no overflow, indicator visible, single line. Page add/delete (confirm dialog stubbed — deletePage awaits a modal, don't call it bare in headless) still updates "2 of 2"→"1 of 1" and rebuilds the underlay dropdown. Boot clean both widths; skill verifier ALL PASS. NOTE: Edge headless intermittently ignores --window-size on repeat launches — force viewport with Emulation.setDeviceMetricsOverride instead.

## POST-RELEASE: Activate/Deactivate Module buttons removed from Help ribbon
Owner request: remove the two puzzle-piece "Activate Module"/"Deactivate Module" ribbon buttons from tab-help. Removed the two `data-command` buttons plus their now-empty ribbon-group and the orphaned ribbon-divider before it (Help tab now = single Keyboard Shortcuts group). Command registry entries (`activate-module`/`deactivate-module` → setPhotometricsModule) deliberately KEPT — `ui.executeCommand` routing still works (verified), only the UI entry points are gone.
Verified headless CDP: boot clean, 0 module buttons in DOM, shortcuts button intact, both commands still routable via executeCommand, help tab activates; visual = Help ribbon shows only Keyboard Shortcuts, no stray groups/dividers; skill verifier ALL PASS.

## POST-RELEASE: drawing pointer revised (2nd revision of Pointer.png)
Owner replaced `D:\AIProjects\Sketch Test\Pointer.png` (729×729, bolder strokes w/ flat caps) and asked for re-swap. Same pipeline as first swap: white→transparent master (alpha = inverted luminance ×1.06), LANCZOS 128/64/32, full `data:` URLs, byte-safe splice of `__CURSOR_DATA__` statement. All 7 sprites replaced; hotspot center unchanged.
Verified headless CDP: boot clean, all 7 keys resolve, live sprites pixel-identical to references, cursor resolves 128/64/32 × dark/light with correct hotspots, on-canvas images load; 32px-on-dark visual = crisp continuous 2px strokes, centered; skill verifier ALL PASS.

## POST-RELEASE: drawing pointer 3rd revision (Pointer2.png)
Owner dropped `Pointer2.png` (729×729, lighter 1px-weight art vs v2's bold). Same pipeline → all 7 `__CURSOR_DATA__` sprites replaced. Verified: boot clean, sprites pixel-identical to references, resolves at all sizes/themes with correct hotspots, on-canvas loads, 32px-on-dark crisp/centered/continuous; skill verifier ALL PASS.

## POST-RELEASE: right sidebar redesign — Revision 2 compact workbench (DONE: runtime-verified, committed)
Owner approved Revision 2 of docs/RIGHT_SIDEBAR_REDESIGN_PLAN.md (five top tabs kept; Areas rebuilt as three-zone workbench). Edits to sketch.bundle.html are additive + moved-DOM only; no ids, data-sidebar-target values, state keys (sidebar.active = define|text|symbols|calcs|layers) or handlers changed. Tab strip moved to dock TOP (flex-direction column; tabs horizontal 30px strip, active = --bg-active, click-active-tab still collapses) + dedicated #sidebar-collapse chevron and collapsed-rail #sidebar-expand. Panel headers (with old per-panel pin buttons) hidden by CSS — pin state/key untouched. Define panel = 3 zones: Selection summary (#area-selection-body: empty state or live name+sf rows, multi-select total; Edit btn in zone head), Classification browser (search + .area-tree + New-code btn), Setup (name input, #area-pending-code pending readout DIRECTLY above Apply, then collapsed Labels disclosure [all 6 autopost checkboxes + suffix select] and Area tools disclosure [Redefine/Clone/Reopen/Detect]). New layers: CSS before </head>, JS before </body> (pending + selection-summary refresh via MutationObserver on btn-apply-area disabled + tree childList + app.render hook; rebinds after restoreSidebarState). Verified: new scripts/verify-sidebar-redesign.py 33/33 PASS (structure, 5-tab exclusive switching via real clicks, state.sidebar.active tracking, collapse/expand incl. rail + state.open, search 'living'→4 hits, GLA1 select→pending, placeShapeAt 20x15 rect→apply→poly.type=GLA1→pending resets, disclosures intact, light+blue themes, __exportState/__importState round-trip w/ sidebar {define,open,pinned}, 0 console exceptions); skill verify-sketch-bundle.py ALL PASS. Visual QA (docs/qa-sidebar-redesign-full/-light/-collapsed/-500.png): dark/light/collapsed/narrow(500 CSS px, owner DPI case) all clean — 5 tabs fit at 500px (dock 282px = 61% width; collapse chevron is the escape hatch; overlay-drawer from plan §shared-shell is a possible follow-up). Harness lessons: Edge needs --remote-allow-origins=* for CDP ws; attach to the file: target explicitly (Edge opens edge://sync-confirmation-dialog first); URL-encode spaces (%20) in the launched file:// URL or it lands on chrome-error://chromewebdata; script WS must be repo root, not scripts/.

## Notes / decisions
- Never blind-replace "apex": escapeXml + geometric apex (curveApex etc.) + `urn:xmlns:apex:sketch:xml` (format contract) + `.apx/.skx` accept lists all stay. Justification in docs/INTERFACE_INVENTORY.md §2.
- Keep every id / data-command / data-target / data-sidebar-* intact; JS couplings listed in inventory §4.
- Composition remodel (document bar/tool shelf/navigator/inspector re-architecture) = next milestone; this pass delivers identity, tokens, chrome restyle, copy, renames.
