# Coptle implementation audit

Status is based on repository code and local verification. Development content has no human approval.

| SPEC.md scope | Current implementation and remaining work |
| --- | --- |
| 1–5. Project, audience, brand, navigation | Project documentation, original editorial theme, responsive homepage, and working Today, Practice, Statistics, Settings, and About. Pending featured challenge, completion indicators, liturgical display, and the Archive, Learn, Community, and Content Studio destinations. |
| 6–9, 11, 16. Play and education | Three difficulties and playable development editions of The Word, Saintle, and Versele. Daily date follows New York midnight. Development practice uses its own repeating inventory. Feedback, post-game references, and text sharing are implemented. Pending countdown, broader puzzle types and saint attributes, content filters, hints, forfeits, archive, native sharing, result cards, and saved learning. Connections, Chronicle, Copticle, Iconle, and Hymnle have no playable routes. |
| 10, 20–23, 28. Content and release | Private PostgreSQL schema for sources, immutable puzzle versions, review evidence, approved scheduling, and withdrawals. The application still serves development fixtures only. Pending Supabase runtime integration, full game-specific schema validation, reviewer authorization and Content Studio, reporting, audit trail, inventory tooling, and thirty days of human-reviewed puzzles per game and difficulty plus separate approved practice content. |
| 12–15. Calendar, accounts, statistics, and groups | New York puzzle date and local daily played/solved totals. Pending verified Coptic calendar, durable sessions, registered accounts, device sync, merging, full daily/practice/archive statistics, achievements, and private groups with legal and moderation review. |
| 17–19, 24–27, 30–32. Engineering and operations | Next.js, strict TypeScript, deterministic server scoring, bounded development API requests, cookie-owned fixture sessions, responsive keyboard, semantic feedback, automated checks, and Vercel setup notes. Pending durable database session/API integration, distributed rate limiting, stronger nonce-based CSP, complete privacy lifecycle, broader manual accessibility audit, performance and PWA work, operational monitoring, backup verification, and production release. |

## Next milestone

- [x] Remove client-provided guess replay, reject stale writes and duplicate guesses, keep development practice separate, and verify the three game flows.
- [x] Add the PostgreSQL content foundation and exercise it against a disposable PGlite database with mock Supabase roles. Test-only review records exist only in that database.
- [ ] Connect a least-privilege runtime to a Supabase project, complete version-pinned transaction-safe guest sessions, and verify the Supabase migration and policies there.
- [ ] Implement the authorized Content Studio review and publishing workflow before any public play release.
- [ ] Complete the missing MVP acceptance criteria in SPEC.md §31 before expanding the game catalog.

## Release state

Development sessions live on one server process and expire after two days or on restart. Browser storage retains daily aggregate results after the fixture session expires. Historical browser guess lists from the earlier client-owned protocol are no longer loaded. The PostgreSQL schema is ready for integration testing with Supabase. It is not used by the running app and has no approved production content.

## Verification record

- Lint, strict TypeScript, production build, thirteen Vitest tests (including six PostgreSQL migration and permissions checks), and six Chromium scenarios passed locally.
- Reviewed desktop (1440 px) and mobile (320 px) captures of the homepage and Word game. Both paths passed targeted axe checks and the gameplay page had no horizontal overflow.
- Confirmed the production fixture gate on the homepage, gameplay route, and API even when the fixture flag was set under Vercel Production configuration. No deployment was made.
