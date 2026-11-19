# Coptle implementation audit

Status is based on repository code and local verification. Development content has no human approval.

| SPEC.md scope | Current implementation and remaining work |
| --- | --- |
| 1–5. Project, audience, brand, navigation | Project documentation, centered Coptle branding, a responsive pastel tile grid, and working Home, Practice, Statistics, Archive, guest Profile, Settings, About, and staff Content Studio. Pending featured challenge and liturgical display, and the Learn and Community destinations. |
| 6–9, 11, 16. Play and education | Three difficulties and playable development editions of The Word, Saintle, and Versele. Daily date follows New York midnight. Development practice uses its own repeating inventory. Feedback, one saved hint per puzzle, confirmed forfeits, a New York midnight countdown, daily completion badges, post-game references, text sharing, and a seven-day archive with independent progress are implemented. Pending broader puzzle types and saint attributes, content filters, native sharing, result cards, and saved learning. Connections, Chronicle, Copticle, Iconle, and Hymnle have no playable routes. |
| 10, 20–23, 28. Content and release | Private PostgreSQL schema for sources, immutable puzzle versions, review evidence, approved scheduling, and withdrawals. Implemented opt-in reviewed daily, practice, and seven-day archive delivery with a per-game, per-difficulty rolling 30-day gate. The Content Studio at /studio uses Supabase Auth and individually assigned database capabilities for drafts, revisions, reviews, approval, scheduling, withdrawal, a launch inventory dashboard, and transactional JSON draft import. Pending hosted integration verification, broader game-specific schema coverage, content reporting, audit trail, and thirty days of human-reviewed puzzles per game and difficulty plus separate approved practice content. |
| 12–15. Calendar, accounts, statistics, and groups | New York puzzle date and local daily played/solved totals, win rates, and current and best streaks. Pending verified Coptic calendar,  registered accounts, device sync, merging, full daily/practice/archive statistics, achievements, and private groups with legal and moderation review. |
| 17–19, 24–27, 30–32. Engineering and operations | Next.js, strict TypeScript, deterministic server scoring, bounded development API requests, cookie-owned fixture sessions, responsive keyboard, semantic feedback, automated checks, and Vercel setup notes. Pending hosted operation and traffic verification, distributed rate limiting, stronger nonce-based CSP, complete privacy lifecycle, broader manual accessibility audit, performance and PWA work, operational monitoring, backup verification, and production release. |

## Next milestone

- [x] Remove client-provided guess replay, reject stale writes and duplicate guesses, keep development practice separate, and verify the three game flows.
- [x] Add the PostgreSQL content foundation and exercise it against a disposable PGlite database with mock Supabase roles. Test-only review records exist only in that database.
- [x] Persist development sessions in SQLite or through a restricted PostgreSQL role. Transactions guard against stale writes and the session keeps its own puzzle snapshot.
- [x] Implement the database-side editorial workflow using individually authorized logins and immutable review attribution.
- [x] Build reviewed schedule and practice delivery, a seven-day archive, and transaction-safe PostgreSQL sessions pinned to immutable version IDs.
- [ ] Provision a hosted Supabase development project, apply migrations, and verify the deployed reviewed-play path with staff and reviewed inventory.
- [x] Implement the authorized Content Studio for drafting, revision, review, approval, scheduling, and withdrawal.
- [x] Show staff a rolling 30-day launch inventory, including eligible practice counts and date-level gaps.
- [x] Add bulk JSON draft import with row validation, transactional saves, and safe retries.
- [ ] Verify Studio sign-in against the hosted Supabase project and implement content reports.
- [x] Add persisted hints and forfeits, daily reset countdown, completion badges, and local streaks.
- [ ] Complete the missing MVP acceptance criteria in SPEC.md §31 before expanding the game catalog.

## Release state

Development guests use durable local SQLite storage or a dedicated, optional PostgreSQL store. Cookies and sessions expire after 30 days. Browser storage retains local daily aggregate results. Existing fixtures remain separate from editorial puzzles. Reviewed play is off by default. Hosted verification and genuine human-approved inventory remain release requirements.

## Verification record

- Lint, strict TypeScript, the production build, and 15 Vitest checks passed. Editorial tests used disposable databases and fictional, test-only identities.
- Seven Chromium scenarios passed on both SQLite and PostgreSQL 17. Inspected the redesigned homepage at 1440 px and 320 px. The homepage and Word game passed targeted axe checks.
- Verified SQLite progress across a server restart, concurrent stale-write rejection, and the Vercel Production fixture gate. No hosted Supabase integration was exercised and no deployment was made.
- Content Studio phase: lint, type checking, production build, 18 Vitest checks, and seven gameplay browser scenarios passed. A separate Chromium walkthrough exercised staff sign-in, unauthorized-account rejection, drafting, each review, scheduling, withdrawal, and sign-out against disposable PostgreSQL 17 and a test authentication service. Inspected the Studio at 390 px and 1440 px. No production or theological records were created.
- Reviewed-delivery phase: lint, type checking, production build, 19 Vitest checks, and seven gameplay browser scenarios passed. A separate production-mode Chromium walkthrough used disposable PostgreSQL 17 to verify response redaction, concurrent writes, version pinning after schedule replacement, new-guest delivery, practice, archive, withdrawal, and the rolling inventory gate. Test-only synthetic data stayed in disposable databases.
- Gameplay polish phase: lint, type checking, the production build, 23 Vitest checks, and nine Chromium scenarios passed. Also exercised saved hints, stale-write rejection, idempotent retries, and forfeits on reviewed PostgreSQL. Verified the unconfigured Studio message with no hosted credentials.
- Launch inventory phase: lint, strict TypeScript, production build, 23 Vitest checks, and nine browser scenarios passed. A separate staff browser test on disposable PostgreSQL verified authorized access, mobile layout, and a withdrawal reducing launch coverage from 30 to 29 days.
- Bulk draft phase: lint, strict TypeScript, production build, 27 Vitest checks, and nine gameplay browser scenarios passed. A separate Studio browser test on disposable PostgreSQL verified role-based access, row feedback, atomic saves, and repeat submissions. Imported test records remained drafts.
