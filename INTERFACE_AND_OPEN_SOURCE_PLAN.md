# Independent interface and open-source release plan

Prepared from static inspection of `sketch.bundle.html`, September 4, 2026.

Scope clarified by the owner: this is an independently implemented HTML and JavaScript application. No underlying Apex code was used; the Apex influence is its interface. This plan accepts that clarification and focuses on interface replacement and feature preservation.

## Objective and boundaries

Give the application an independently designed identity and interface while preserving its existing HTML/JavaScript drawing, calculation, document, library, export, and integration capabilities. Prepare a maintainable open-source distribution.

A visual redesign cannot guarantee freedom from claims, but the relevant work here is creating an original interface and identity. Core replacement, code-origin investigations, and clean-room reimplementation are outside the scope. Preserve ordinary third-party license notices for included libraries, fonts, and icons.

The redesign should address the overall composition, navigation, controls, wording, artwork, and report presentation. A color swap and identifier rename alone would not accomplish the requested fresh interface.

## What was inspected

The workspace contains one approximately 10.4 MB generated HTML file. No source repository, build configuration, standalone license, dependency manifest, or test suite was present. This was a static code review, not a running UI audit, complete asset audit, or comparison with an authenticated Apex product version.

Specific findings:

| Finding | Evidence in bundle | Required treatment |
| --- | --- | --- |
| Apex support destination | Line 18577: `support@apexsoftware.com`, Apex subject line | Replace with project-owned support routing; do not leave a misleading email action. |
| Apex-named application | Lines 13362, 18776: `ApexApp` | Rename after mapping references and checking external consumers. |
| Apex-named report implementation | Line 9622: `ApexReport`; report CSS and preview consumers | Introduce an independently designed report layout and neutral module names; preserve data, scale, pagination, and integration contracts. |
| Explicitly referenced Apex workflow | Lines 2544–2545: right sidebar comment | Replace the interface organization and update the comment to describe the new design. |
| Apex XML namespace | Line 4611: `urn:xmlns:apex:sketch:xml` | Treat as a format contract; determine consumers before changing it. |
| Legacy extensions advertised | Line 2465: `.skx,.apx,.json,.sketch` | Test actual supported variants; an extension list does not prove native proprietary-format support. |
| Bundled artwork and fonts | Embedded images and Phosphor font CSS | Inventory interface assets; replace Apex-specific visual elements and retain third-party font/icon notices. |
| Standalone and embedded modes | Lines 2265–2277, 18777–18845 | Preserve both, including save/restore, subject synchronization, totals, validation, and report previews. |
| Generated add-on layers | CAD import and symbol manager sections after line 18849 | Identify the active editing/build workflow so redesign changes preserve these additions. |
| Implementation limits | Bluetooth handler at 18558; DWG conversion hint at 19316 | Record device selection versus measurement acquisition, and external conversion versus direct import. |

Do not use a blind case-insensitive replacement of “apex.” It also matches `escapeXml`, and “apex” is a legitimate geometric term used for curved walls. Rename brand-specific identifiers deliberately. Neutral geometric names such as `curvePeak` may be used where helpful, with geometry tests, but terminology changes provide no legal clearance.

## Phase 1 — Freeze behavior and inventory the interface

1. Preserve an unchanged copy of the current bundle and record its SHA-256 hash for regression comparison.
2. Identify whether this HTML file is the current editing source or whether an active generator exists elsewhere. Keep the existing delivery format; avoid imposing a framework migration or full source reorganization as a prerequisite.
3. Run the app and capture every main view, dialog, menu, context menu, library, tool state, theme, print view, and embedded layout. These captures become a private design and behavior baseline.
4. Inventory Apex-specific names, support links, UI copy, visual motifs, report styling, icons and imagery. Distinguish application branding from functional format identifiers.
5. Map HTML IDs, CSS selectors, event bindings, dynamically inserted controls, canvas sizing and host hooks before moving controls. These are the main interface-change regression risks.
6. Record included third-party fonts and icon libraries for normal open-source attribution.

**Deliverables:** unchanged baseline, screen inventory, interface replacement checklist, event/DOM dependency map, editing/build workflow.

**Exit condition:** the team knows what must change visually and which functional connections must survive. Existing JavaScript behavior is the implementation baseline.

## Phase 2 — Define and prove feature parity

Create a capability matrix with an ID, current entry point, underlying handler, prerequisites, current observed result, new location, fixture, and acceptance test. Inventory runtime-added controls, keyboard shortcuts, context menus, preference dialogs, and host hooks as well as static buttons. Mark behavior as working, partial, unavailable, or unverified.

| Capability group | Coverage required |
| --- | --- |
| Drawing and geometry | Exterior/interior walls; numeric length and angle entry; snapping; closure; vertices; curved walls; wall shapes; room shapes; dimensions; chain measurements; area measurements; wall/opening relationships. |
| Editing | Point, fence, and lasso selection; filtering by type; move; resize where implemented; rotate; flip; copy/cut/paste; clone; delete; ordering; undo/redo and history. |
| Areas and calculations | Define, redefine, clone, reopen, detect regions; codes and custom names; auto-subtraction; line/fill appearance; labels and dimension placement; factors/base settings; GLA and basement totals; breakdowns and area-code import/export. |
| Libraries | Text search, alphabetical filtering and editing; text formatting; symbol categories, search, preview, placement, favorites, organization, hiding/deletion, custom persistence, and CAD symbol import. |
| Document and pages | New/open/save/save-as/recent files; current-page semantics; add/delete/navigation; underlays; subject information, comments and extended data; saved defaults. |
| Images and geographic tools | Load/show/hide/remove; scale calibration; rotation; flips; intensity; photo editing/orientation; geographic actions and north direction; module enable/disable. |
| View and input | Pan/zoom/fit/fence zoom; minimap; grid and snap pitch; dimension visibility; HUD; canvas background; light/dark/blue themes; touch panel; fullscreen; browser-limited window actions. |
| Exchange and output | Actual supported sketch formats; layer import/export; DXF import/export; external DWG conversion workflow; PNG/SVG; PDF via browser print; page layout and previews; XML output where consumed. |
| Embedded integration | State import/export; validation revision and totals; GLA and basement null/zero behavior; subject merges; clear/reset; cached and refreshed previews; standalone startup. |
| Help and devices | Shortcut reference; project support; existing Bluetooth device-picker behavior and browser limitations. Measurement streaming is not established by the inspected handler. |

Build synthetic fixtures: blank document; rectangular and irregular areas; curved wall; shared boundaries; subtraction/hole; multiple floors; finished/unfinished basement; custom area codes; symbols attached to walls; formatted labels; calibrated image; imported CAD; large multipage document. Add edge cases for duplicate IDs, invalid files, empty data, and unavailable storage.

Capture state and output baselines before redesign. Preserve exact semantic values where deterministic; define numeric tolerances from existing precision. Exclude only documented volatile fields from comparisons. Do not adopt an existing calculation defect as a requirement: record and correct defects separately from presentation changes.

**Exit condition:** every current capability has a destination and verification method. No feature disappears because it is uncommon or inconvenient to fit into the new layout.

## Phase 3 — Design an independent workspace

Recommended direction: a restrained drafting workspace with a compact document bar, a horizontal tool shelf, a document navigator, and a selection inspector. Replace the current title-bar/ribbon/right-tab-rail composition and rewrite its copy, spacing, icon treatment, and interaction hierarchy.

### Proposed arrangement

- **Document bar:** project identity, document name, save status based on real state, file actions, save, undo/redo/history, command search, and export. Do not imply autosave unless implemented.
- **Tool shelf:** labeled Select, Draw, Measure, Annotate, and Image groups. Keep common tools directly accessible, with shape variants in explicit menus and visible active-tool feedback.
- **Left document navigator:** pages, areas, and layers with search, visibility, ordering, and an underlay selector. Allow collapse for drawing space.
- **Center canvas:** largest region, current-tool guidance, precise length/angle entry, selection handles and snapping feedback. Preserve keyboard and coordinate semantics while changing visual presentation.
- **Right inspector:** selection-dependent line, area, text, symbol, or image properties. When nothing is selected, show document settings. Keep a stable width and predictable field order to avoid disruptive movement.
- **Library drawer:** searchable text, symbols, and area presets opened from the tool shelf; supports pinning so repeated placement remains efficient.
- **Calculation drawer:** persistent summary access, expandable area breakdowns, and selection-linked detail. Keep totals accessible while drawing.
- **Footer:** compact zoom, scale/units, snapping, angle/length readout, and device status. Move document navigation out of the crowded status bar.
- **Export workspace:** independent report preview, paper/layout settings, format selection and output actions, with the existing data and print capabilities retained.

Use neutral stone/charcoal surfaces and one restrained teal accent as an initial design direction. Preserve user-selectable light, dark, and blue alternatives with a new token system; preserve independent canvas background selection. Use consistently licensed icons, legible labels, a coherent spacing scale, and tabular numerals for measurements. Create an original logo and favicon after name clearance.

Replace branded or unexplained interface wording with task descriptions: for example, “Photometrics” can become “Reference image,” and “Auto-Post” can become “Automatic labels.” Preserve every underlying option and document relocated commands. Do not rename domain codes or numeric conventions merely for stylistic consistency.

At narrow widths, turn side panels into accessible drawers and expose touch tools through a bottom sheet. Preserve tool availability rather than silently omitting advanced features. Validate keyboard navigation, focus restoration, accessible names, error feedback, contrast, touch targets, zoomed text, and a nonvisual route to inspect/edit entity properties.

**Design deliverables:** layout wireframes, tokens, component states, original icon/asset inventory, report designs, and a current-to-new command map. Prototype blank, drawing, selection, calculations, libraries, image calibration, export, and narrow-screen states. Verify frequent workflows do not acquire unnecessary extra steps.

## Phase 4 — Separate presentation from behavior

Keep HTML, CSS and vanilla JavaScript. Preserve the existing geometry, calculations, serialization, exports and integration code. Make only the structural changes needed to connect the new interface reliably. No framework migration or core rewrite is planned.

Optional follow-up source organization, if useful for maintainability; this is not a prerequisite for the interface redesign:

```text
src/core/           geometry, model, calculations, history
src/io/             serialization, migration, sketch/CAD adapters
src/render/         canvas and export rendering
src/ui/             shell, command registry, panels, dialogs, tokens
src/reports/        original report presentation
src/integrations/   host bridge and device adapter
assets/            reviewed fonts, icons and symbol definitions
tests/fixtures/    synthetic documents and expected results
docs/              usage, formats, architecture and contributing
tools/             reproducible build and release checks
```

1. Use the current editing/build workflow and retain a standalone HTML distribution. If there is no active generator, edit the HTML/CSS/JavaScript in controlled sections. Preserve offline operation where the baseline supports it.
2. Keep core operations and model semantics intact. Isolate direct UI dependencies only where moving or replacing controls requires it.
3. Introduce one command registry for menus, buttons, shortcuts and touch actions, including enabled state and history behavior. This extends the existing command-dispatch concept rather than duplicating actions.
4. Implement the new shell in a development copy or behind a temporary development switch. Keep the baseline available for comparison; remove the old skin from the final product.
5. Migrate tools and panels by capability group. Maintain selection, focus, event lifecycles and resize/coordinate transforms at each step.
6. Replace report presentation, project support, artwork and UI copy. Rename `ApexApp`, `ApexReport`, and report classes using reference-aware edits. Check host consumers before removing globals.
7. Inspect the final HTML, and regenerate it if an active build exists, to ensure no old branding returns and CAD/symbol additions remain intact.

**Exit condition:** a clean checkout runs the application using documented steps; the new interface passes parity checks with the existing core; any generated output agrees with its source.

## Phase 5 — Preserve files, preferences and integration

- Keep a documented native schema with versioning. Do not change existing file semantics just to remove names.
- Retain working legacy reads. Test extension/content mismatches and actual parser support.
- Determine whether the Apex XML namespace is consumed externally. If required, preserve that literal in a documented compatibility adapter; otherwise replace it with a project-owned identifier and migration support where needed. Changing it arbitrarily can make the file incompatible.
- Target zero Apex product branding. Keep any required format literals isolated from the interface and document their technical purpose so branding cleanup does not silently remove compatibility.
- Read existing `sketch.*` preferences, custom codes, symbol favorites, hidden/purged symbols, text libraries and recent files. Any new storage namespace needs a tested, idempotent migration and rollback that retains original data until verified.
- Preserve host hook signatures and return semantics with contract tests. Use a synthetic host harness when the actual suite is unavailable, then validate with the real host before claiming integration parity.
- Preserve export geometry, units, labels, wall thickness and image fidelity. Reports may look new, but calculation content, scale, pagination constraints and downstream consumption must still pass acceptance tests.

**Exit condition:** supported old documents and preferences migrate without silent loss; tested host contracts remain compatible; unavoidable compatibility identifiers are documented exceptions to branding cleanup.

## Phase 6 — Verify the redesign

Use tests that exercise user outcomes and calculations rather than merely asserting new CSS classes.

1. **Core:** geometry invariants, closure, shared walls, curves, subtraction, unit handling, GLA/basement rollups, and undo/redo restoration.
2. **Files:** load/save/reload semantic equality; custom data and multipage persistence; import offsets and ID remapping; invalid input behavior.
3. **UI:** representative full workflows through each entry route, including keyboard and touch; focus and shortcut behavior while typing; tool switching without accidental edits.
4. **Exports:** machine-readable SVG/DXF geometry checks; PNG and PDF visual review; paper sizes, clipping, dimension readability, multipage output, and host preview parity.
5. **Compatibility:** legacy fixtures, preference migration, standalone file opening, local serving and embedded operation wherever supported by the original app.
6. **Performance:** measure baseline startup, drawing responsiveness and memory on an agreed large fixture. Investigate regressions above an initially proposed 10% threshold rather than assuming a new framework is free.
7. **Identity:** inspect visible screens, dialogs, reports, support destinations, filenames, metadata and extracted assets; scan source and built files for brand identifiers with reviewed interoperability/notice exceptions. Do not delete third-party notices to pass a scan.
8. **Release contents:** include the new interface, appropriate third-party notices and synthetic examples; exclude private customer documents and development-only baseline captures.

**Exit condition:** all baseline working capabilities pass; partial features remain accurately described; no unresolved data-loss/calculation regressions; no Apex product branding remains in the interface or reports.

## Phase 7 — Prepare the open-source release

Select an open-source license for the independently written application and retain the applicable licenses for third-party components.

Prepare LICENSE, third-party notices, dependency/asset inventory or SBOM, README, build instructions, usage and shortcut documentation, format compatibility notes, CONTRIBUTING, SECURITY, changelog, and migration notes. Use synthetic sample sketches and original screenshots. Document browser/device limits, external DWG conversion, and PDF printing accurately.

Provide a versioned source release and standalone HTML bundle with documented build steps if applicable. Check the final public name and logo, repository metadata, support destination and demo assets. Review the finished interface for remaining Apex-specific presentation. If legal assurance is desired, a focused review of the final visual identity is a separate step; this plan does not require investigating or replacing the independently written core.

## Suggested sequence and estimates

Indicative effort for one experienced developer with periodic design review. These estimates cover an interface redesign using the existing HTML/JavaScript functionality, not code replacement. Runtime inspection and the number of dynamically generated dialogs may change them.

| Milestone | Indicative effort | Dependency |
| --- | --- | --- |
| Baseline, screen and capability inventory | 2–3 working days | Running app and editing workflow |
| Independent UI/report design and prototype | 3–5 days | Capability inventory |
| UI bindings and characterization tests | 2–4 days | DOM/event dependency map |
| New shell, panels, dialogs, assets and reports | 8–15 days | Design and command contracts |
| Migration, integration and regression validation | 5–8 days | Complete feature mapping |
| Documentation and release candidate | 1–2 days | Technical and visual acceptance |

Approximately 21–37 working days for the full redesign, parity verification and release preparation. This is a planning range, not a commitment; refine it after the runtime inventory. No core rewrite, clean-room work or source-provenance investigation is included.

## Decisions needed before implementation or release

1. Current editing workflow: this standalone HTML file or an active generator elsewhere.
2. Final name, visual direction and project support destination. Temporary neutral placeholders can be used during design.
3. Required file compatibility, external consumers, actual host suite and target browsers/devices.
4. Final open-source license preference and ordinary third-party attribution.

The interface inventory, feature mapping and independent design can proceed with the existing HTML/JavaScript implementation. The owner's clarification about independent code is settled context, not an unanswered question.

## Legal context sources

- U.S. Copyright Office, [Circular 61: Copyright Registration of Computer Programs](https://www.copyright.gov/circs/circ61.pdf): distinguishes protected expression from functional aspects and discusses screen displays.
- USPTO, [current TMEP discussion of functionality and trade dress](https://tmep.uspto.gov/RDMS/TMEP/print?href=TMEP-1200d1e835.html&version=current): functional matter and trade-dress analysis. This is general context, not an assessment of this application's legal status.
