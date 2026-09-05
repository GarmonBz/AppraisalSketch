# Security Policy

## Supported version

Appraisal Sketch 1.0 (the `sketch.bundle.html` artifact at the current
`main` commit).

## Reporting a vulnerability

Email **thatappraiserx@gmail.com** with:

- A description of the issue and its impact
- Steps to reproduce (a minimal `sketch.bundle.html` + fixture file is ideal)
- Any known workarounds

Please do not open a public issue for exploitable defects. You can expect an
acknowledgment within 7 days. This is a personal-maintained project; there is
no paid response SLA.

## Scope notes

The application is a fully client-side, offline HTML file:

- It makes no network requests and collects no telemetry.
- It reads files only from explicit user action (Open/Import dialogs).
- Persistence uses browser `localStorage` under the `sketch.*` namespace
  (see `docs/FORMAT_COMPATIBILITY.md`).

Issues that require a malicious document to trigger code execution would be
in scope; CSS/UX bugs are not security issues.

## Embedded third-party components

- Phosphor Icons (woff2 subsets) — MIT; see `NOTICE.md`.
- No other third-party code, fonts, CDNs, or telemetry are embedded.
