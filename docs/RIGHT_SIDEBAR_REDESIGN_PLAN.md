# Right sidebar redesign — proposal

September 5, 2026. Planning and rendering only; no changes to the running application.

## Revision 2 — Compact workbench alternative

Owner feedback: keep tabs at the top, try a different design. This alternative supersedes the three-view grouping below as the latest proposal; it has not yet been approved for implementation.

- Five directly accessible horizontal tabs: Areas, Text, Symbols, Calcs and Layers. No nested navigation step is needed to reach any existing sidebar function.
- Areas is a workbench with three zones: a slim selection summary, a searchable classification browser, and an area-setup/action section.
- Use compact category filters and readable code rows instead of either a large expanded tree or a classification dropdown buried in a properties form. Search spans categories. Implementation must expose all real categories and custom codes; the rendering uses a representative subset.
- Keep custom name close to the apply action. Collapse Labels and Area tools by default, with a short summary of active label choices; retain every existing control within them.
- Show the pending classification immediately above Apply to area, and keep Edit area separately accessible. New code and Manage library remain beside the code browser.
- Keep the palette, existing JavaScript behavior, saved-state migration and regression requirements from this plan. The rendering preserves direct Text/Symbols/Calcs/Layers exploration while changing the Areas layout substantially.
- Verify classification browsing and selection, no-selection definition, label settings, code management and repeated placement before implementation approval.

The earlier Inspect/Insert/Review proposal below is retained for comparison rather than treated as an approved direction.

## Scope and current findings

The current right sidebar remains a 312 px dock containing a 282 px panel and a 30 px vertical tab rail. Its five modes are Define, Text, Symbols, Calcs and Layers. The default Define view devotes much of its height to a code tree, then places actions, the custom area name and automatic-label settings beneath it. Renaming and recoloring have not changed that composition.

The owner previously restored the original colors because that palette is unrelated to Apex (recorded in STATUS.md). Keep those colors and existing light/dark/blue theme choices. This proposal changes the sidebar architecture, navigation, hierarchy and editing flow.

Basis: current HTML/CSS, showPanel/setSidebarOpen/restoreSidebarState and event bindings, STATUS.md, and the existing qa-original-scheme.png screenshot. A fresh runtime check remains an implementation prerequisite. Illustrative rendering data is synthetic, not a measurement from the user's drawing.

## Recommended structure

Replace the vertical mode rail with three horizontally labeled task views:

| New view | Purpose | Existing functions retained |
| --- | --- | --- |
| Inspect | Define an area or edit the current selection | Define library, custom names, apply/edit/new code, automatic labels and all area operations |
| Insert | Find something and place it on the drawing | Symbols and Text, each with its own search, selection and library management |
| Review | Understand drawing totals and organization | Calcs and Layers, each retaining its full actions and hierarchy |

The structural change is not simply reducing five tabs to three: the area library becomes an on-demand classification picker, selected-object properties occupy the primary editing surface, and library browsing is separated from document review. Existing direct tool/shortcut entry points should still open the appropriate nested view immediately, avoiding extra clicks for frequent actions.

### Inspect

- Header identifies the selected object and its area. Put name and classification first.
- Replace the permanently expanded classification tree with a searchable picker that supports the complete existing hierarchy and every custom code. Show descriptions prominently and exact codes secondarily. Include a Manage codes action for existing add/edit/import/export capabilities.
- With no selection, show an honest empty state and the area-definition workflow: choose a classification, enter an optional name, choose labels and apply through the existing define operation. Never require an existing area just to define the first one.
- With a selected area, populate its values and use a clear Apply action for the staged definition fields. Reuse existing semantics for options that already update immediately; specify that distinction before implementation rather than accidentally changing persistence/history behavior.
- Place the six automatic-label options in a compact disclosure: Code, Name, Dimensions, Calculations, Base and Factor. Preserve dimension inside/outside choices and every suffix option; suffix text is not unit conversion.
- Place Redefine, Clone, Reopen and Detect regions in a labeled Area operations disclosure. Preserve enable/disable rules and the existing meaning of Edit versus Apply versus New code.
- Selection-aware line/text/symbol property editors can be integrated after area parity is established, using existing commands. Mixed selections display mixed values instead of overwriting them with defaults.
- Do not automatically switch away from Insert or Review when a canvas selection changes. Update Inspect in the background; explicit editing actions may open it.

### Insert

- Symbols/Text segmented selector at the top. Preserve independent search/filter/scroll state for each.
- Symbols use labeled preview tiles instead of a long text list plus detached preview. Retain categories, favorites, preview, repeat placement, imported/custom symbols and the full organizer, including hiding/deletion and CAD import.
- Text keeps free typing, search, all alphabet groups and the existing editor. Clicking a library item uses the current placement behavior; do not add an unnecessary confirmation step. The concept's placement buttons illustrate state without editing the real app.
- Keep the current pinned/auto-hide-after-placement behavior. Switching modes must not clear search, selected classification, or draft input.

### Review

- Calculations show a compact total followed by the expandable breakdown and existing detail action. Preserve Expand all/Collapse all, page/code groupings and numeric formatting.
- Layers use readable rows with visibility and existing context actions. Preserve hierarchy, ordering, selection and all currently supported import/export or other operations. Do not invent unsupported layer capabilities in implementation.
- Keep total scope explicit (current page versus all pages), using the actual calculation data. The rendering's sample uses one page.

### Shared shell and small screens

- One shared header with explicit pin and collapse controls. Clicking the active task tab should retain the view, not collapse it accidentally; collapse is a dedicated action.
- Start with 350 px desktop width, adjustable from 320–400 px. The concept exposes width and density alternatives for comparison. Validate 312 px too before deciding the production default.
- Use a resizable dock on roomy viewports; save its width as a UI preference without changing drawing geometry.
- At constrained widths, use an overlay drawer capped to available width. At approximately 500 CSS px (the user's recorded high-DPI case), avoid consuming nearly the entire canvas with a permanent dock. Closing returns focus to the invoking control.
- In the actual app, keep the header and applicable primary actions accessible while long content scrolls. Provide keyboard access, clear focus, labeled icons and targets appropriate for touch. The inline rendering reflows to show the sidebar alone on small screens.

## Implementation sequence

1. **Baseline and contract map.** Capture all five current modes with representative data, existing disabled states, pinning, auto-hide and keyboard entry points. Record a save-model snapshot, totals and exports.
2. **Build the new shell.** Replace the vertical rail and create the three task views. Retain existing unique control IDs and handlers where practical; move DOM nodes rather than duplicate live controls. Change structural selectors explicitly where needed.
3. **Add a navigation adapter.** Keep calls such as showPanel('panel-symbol-library') working by translating them to Insert → Symbols. Map Define to Inspect, Text to Insert → Text, Calcs to Review → Calculations and Layers to Review → Layers. Preserve refresh calls for calcs/layers.
4. **Migrate Inspect.** Replace the large code-tree surface with the searchable classification picker and selected-area layout. Verify no-selection, selected area, unknown/custom codes and multi-selection before proceeding.
5. **Migrate Insert and Review.** Retain runtime-generated library nodes and symbol-organizer hooks. Preserve distinct state across subviews, and route all operations to existing JavaScript.
6. **State and sizing.** Migrate existing sidebar.active values (`define`, `text`, `symbols`, `calcs`, `layers`) to the new hierarchy while preserving old file reads. Retain open/pinned values. Trigger canvas resize after actual layout changes and verify pointer coordinates after resizing, collapsing and reopening.
7. **Verify and document.** Test workflows, save/load, undo/redo, calculations, exports, themes and high-DPI layouts; update the sidebar user guide and feature map. Keep unrelated ribbon, pointer, geometry, licensing and file-format work out of this change.

## Acceptance criteria

- No vertical text tab rail or permanently dominant classification tree remains.
- Area definition/editing is clear without selection and with an existing selection.
- Every existing sidebar control and action has a destination; every supported code and label suffix remains available.
- Existing shortcut/tool calls open the correct view and subview in one action.
- Classification/search/selection values survive mode switching; canceled edits leave the drawing unchanged.
- Full text alphabet filtering, custom libraries, symbols/favorites/organizer, calculation details and layer context actions remain functional.
- Old saved sidebar states restore sensibly; no document data or custom library preferences disappear.
- Correct geometry, totals, exports and undo/redo remain equivalent on baseline fixtures.
- No canvas offset or pointer error after resize or drawer transitions; no clipped/unreachable controls at narrow widths or high DPI.
- All existing themes work; the palette stays unchanged.

## Rendering boundaries and estimate

The interactive rendering demonstrates all three top-level views and both Insert/Review subviews, selection properties, label options, area-operation disclosure, sample library filtering, pin state and calculation expansion. It uses representative codes, symbols, text and suffixes; implementation must include the full real datasets. It does not connect to the geometry engine, run imports or open full management dialogs. Those actions identify their intended destination in the preview.

Indicative scope: 1 day for runtime inventory and interaction specification; 2–3 days for shell/navigation; 2–4 days for panel migration; 1–2 days for parity, responsive checks and fixes. Approximately 6–10 working days, refined after runtime inspection. This proposal supersedes the earlier broad redesign plan for the right sidebar specifically.
