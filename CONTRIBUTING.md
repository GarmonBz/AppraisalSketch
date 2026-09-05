# Contributing to Appraisal Sketch

Thank you for considering contributing. This project is licensed under the
PolyForm Noncommercial License 1.0.0 — by contributing, you agree your
contributions are licensed under the same terms.

## How the codebase is organized

The deliverable is a single generated artifact, `sketch.bundle.html`. It is
edited in controlled sections, using layered `<style>`/`<script>` blocks for
additive features (see the `INTERFACE SKIN LAYER`, command palette, and pages
navigator blocks as examples). The baseline artifact is preserved at
`sketch.bundle.baseline.html` and is gitignored — never edit it.

Key documentation:

- `docs/INTERFACE_INVENTORY.md` — DOM structure and JS↔DOM couplings.
  Read §4 before moving any control: ids like `tab-*`, `panel-*`, and
  attributes like `data-command` / `data-target` / `data-sidebar-*` are
  load-bearing.
- `docs/FORMAT_COMPATIBILITY.md` — format literals that must never change
  (`urn:xmlns:apex:sketch:xml`, `Sketch-Web` model version, legacy reads).

## Ground rules

1. **Never blind-replace the word "apex".** It matches `escapeXml`, the
   geometric `curveApex`/`apex` term, and the XML namespace contract.
2. **Never change serialization, calculation, or export code** to fix a
   presentation problem. Presentation and behavior are deliberately separated.
3. **Canvas drawing colors** (`this.colors`, `this.measureColors`) are
   content, not chrome — do not restyle them.
4. Every user-facing feature must keep its existing entry point working:
   ribbon button, keyboard shortcut, command palette, and (where applicable)
   touch panel.
5. Verify with the headless CDP harness pattern used in the Phase 6 report:
   boot the bundle, drive real APIs, diff outputs against
   `sketch.bundle.baseline.html`.

## Submitting changes

- Keep one logical change per commit; describe what was verified and how.
- Include before/after evidence for interface changes (screenshots in `docs/`
  are the established pattern).
- New third-party assets require a `NOTICE.md` entry with license text.
