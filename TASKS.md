# Coptle implementation audit

Status is based on repository code and local verification. Development content has no human approval.

| SPEC.md scope | Current implementation and remaining work |
| --- | --- |
| 1–5. Project, audience, brand, navigation | Project documentation, centered Coptle branding, a responsive pastel tile grid, and working Home, Practice, Statistics, Archive, guest Profile, Settings, and About. Pending featured challenge, completion indicators, liturgical display, and the Learn, Community, and Content Studio destinations. |
| 6–9, 11, 16. Play and education | Three difficulties and playable development editions of The Word, Saintle, and Versele. Daily date follows New York midnight. Development practice uses its own repeating inventory. Feedback, post-game references, text sharing, and a playable seven-day development archive with independent progress are implemented. Pending countdown, broader puzzle types and saint attributes, content filters, hints, forfeits, a reviewed-content archive, native sharing, result cards, and saved learning. Connections, Chronicle, Copticle, Iconle, and Hymnle have no playable routes. |
| 10, 20–23, 28. Content and release | Private PostgreSQL schema for sources, immutable puzzle versions, review evidence, approved scheduling, and withdrawals. The application still serves development fixtures only. Individual editorial login capabilities enforce who can draft, review, approve, schedule, and withdraw. Pending production runtime integration, full game-specific schema validation, and the Content Studio web UI, reporting, audit trail, inventory tooling, and thirty days of human-reviewed puzzles per game and difficulty plus separate approved practice content. |
| 12–15. Calendar, accounts, statistics, and groups | New York puzzle date and local daily played/solved totals. Pending verified Coptic calendar, production version-ID-linked sessions, registered accounts, device sync, merging, full daily/practice/archive statistics, achievements, and private groups with legal and moderation review. |
| 17–19, 24–27, 30–32. Engineering and operations | Next.js, strict TypeScript, deterministic server scoring, bounded development API requests, cookie-owned fixture sessions, responsive keyboard, semantic feedback, automated checks, and Vercel setup notes. Pending public schedule/API integration, distributed rate limiting, stronger nonce-based CSP, complete privacy lifecycle, broader manual accessibility audit, performance and PWA work, operational monitoring, backup verification, and production release. |

## Next milestone

- [x] Remove client-provided guess replay, reject stale writes and duplicate guesses, keep development practice separate, and verify the three game flows.
- [x] Add the PostgreSQL content foundation and exercise it against a disposable PGlite database with mock Supabase roles. Test-only review records exist only in that database.
- [x] Persist development sessions in SQLite or through a restricted PostgreSQL role. Transactions guard against stale writes and the session keeps its own puzzle snapshot.
- [x] Implement the database-side editorial workflow using individually authorized logins and immutable review attribution.
- [ ] Provision and verify a hosted Supabase development project. Connect the approved content schedule and pin production sessions to immutable version IDs.
- [ ] Implement the authorized Content Studio review and publishing workflow before any public play release.
- [ ] Complete the missing MVP acceptance criteria in SPEC.md §31 before expanding the game catalog.

## Release state

Development guests use durable local SQLite storage or a dedicated, optional PostgreSQL store. Cookies and sessions expire after 30 days. Browser storage retains local daily aggregate results. Existing fixtures remain separate from editorial puzzles. Public play awaits qualified human reviews, approved inventory, and a production runtime.

## Verification record

- Lint, strict TypeScript, the production build, and 15 Vitest checks passed. Editorial tests used disposable databases and fictional, test-only identities.
- Seven Chromium scenarios passed on both SQLite and PostgreSQL 17. Inspected the redesigned homepage at 1440 px and 320 px. The homepage and Word game passed targeted axe checks.
- Verified SQLite progress across a server restart, concurrent stale-write rejection, and the Vercel Production fixture gate. No hosted Supabase integration was exercised and no deployment was made.
