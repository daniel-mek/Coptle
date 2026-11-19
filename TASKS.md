# Roadmap

1. Establish the Next.js foundation, brand, and deterministic game engine.
2. Verify the three MVP games with private development fixtures, then implement the durable Supabase schedule, session storage, archive, and production content library.
3. Implement the protected Content Studio, role and review policies, reporting, and audit logs before publishing puzzles.
4. Expand gameplay, learning library, and liturgical calendar.
5. Add accounts, cross-device progress, and private church groups.
6. Add licensed icon and hymn puzzles with accessible alternatives.
7. Audit security, accessibility, and performance. Verify the approved inventory and deploy to Vercel after authorization.

The repository starts from an empty workspace. See SPEC.md for acceptance criteria and the required content inventory.

## Verified initial implementation

- [x] Responsive Next.js home and game screens, three difficulty levels, and light/dark/system settings.
- [x] The Word, Saintle, and Versele development games with server-side scoring, New York puzzle dates, same-device restore, daily totals, and spoiler-free sharing.
- [x] Development fixture gate for both the play page and the scoring endpoint.
- [x] ESLint, strict TypeScript, seven unit tests, a Next.js production build, and two Chromium tests covering all three games.
- [ ] Foundation still needs Supabase configuration, verified migrations, and a production scheduling service.
- [ ] MVP still needs durable sessions, independent approved practice inventory, archive, fuller statistics, and the remaining SPEC.md acceptance criteria.
