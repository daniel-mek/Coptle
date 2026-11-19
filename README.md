# Coptle

Coptle is an independent Christian daily puzzle project. The Word, Saintle, and Versele are playable with development fixtures. The product specification and roadmap live in [SPEC.md](SPEC.md) and [TASKS.md](TASKS.md).

## Local development

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Development fixtures are available automatically in the Next.js development server. Daily puzzle dates use midnight in America/New_York. Development guest progress is retained for 30 days through an HttpOnly cookie. Local SQLite storage lives at `.coptle/fixtures.sqlite` and survives a server restart. Daily result totals and appearance settings are stored in this browser. The development archive offers the previous seven days with separate progress.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

To use system Chromium for Playwright, set `CHROMIUM_PATH` to its executable. Browser tests start a local production build with development fixtures enabled.

## Vercel and a future domain

When hosting is authorized, import this GitHub repository in Vercel with the Next.js preset, repository root as the project root, and Node.js 24. Use separate development, preview, and production environments. The production build keeps the development puzzles disabled by default. Set `COPTLE_DEV_FIXTURES=1` only for local testing or an access-protected preview.

Once you own a domain, add it in the Vercel project's Domains settings and enter the DNS records Vercel supplies at your registrar. Verify DNS and HTTPS before directing players to the domain. No production hostname is required by the current application.

## PostgreSQL content foundation

For an isolated Supabase project, review and apply the SQL in `supabase/migrations` using the Supabase CLI or SQL editor. The migration creates a private `coptle` schema and grants no browser or service API access. Do not add it to the API's exposed schemas. `npm test` runs the migration against a disposable PGlite database with test-only review records. The public application still serves gated development fixtures.

### Shared development sessions

In a dedicated Supabase development project, apply the content migrations followed by `supabase/development/fixture_guests.sql`. Provision an individual database login with membership in `coptle_fixture_app` and use its TLS connection string as the server-only `COPTLE_FIXTURE_DATABASE_URL`. For a hosted preview, use a transaction-pooler connection and Vercel Deployment Protection. Do not use the database owner, public API key, or service-role key as application credentials. Have the database owner prune expired rows by running `delete from coptle.fixture_guests where expires_ms <= extract(epoch from now()) * 1000` on a schedule. Keep this fixture storage separate from production.

### Content Studio

The staff web interface is at `/studio`. Apply the migrations in `supabase/migrations` in order to an isolated Supabase development project.

1. Create or invite staff in Supabase Auth and configure email/password sign-in. Limit account provisioning to staff and disable public sign-ups for this development project. Staff use a confirmed email and password.
2. Provision a dedicated PostgreSQL login that inherits only `coptle_studio`. Use a TLS connection, a strong credential, and the transaction pooler where applicable. Never give this login to a person or browser.
3. In the SQL editor, grant individual capabilities by inserting each verified staff UUID and permission into `coptle.studio_permissions`. Available values are `draft`, `source`, `theology`, `gameplay`, and `publish`. Only qualified staff should receive theological review permission.
4. Set `COPTLE_SUPABASE_URL`, `COPTLE_SUPABASE_PUBLISHABLE_KEY`, and `COPTLE_STUDIO_DATABASE_URL` in the isolated environment. The database URL is a server-only secret. Use access protection for hosted previews.

The Studio revalidates the staff access token with Supabase Auth on each protected request. Sessions use an HttpOnly cookie and require sign-in again after expiry. Removing a person's database permission takes effect on their next request. Drafts and revisions require a fresh review of their own. The public game routes are independent of the Studio.

### SQL editorial workflow

An administrator provisions individual database logins with membership in `coptle_editorial` and maps each login to the verified staff member’s Supabase user ID in `coptle.editorial_permissions`. Assign only the permissions that person performs. Use individual database credentials so every review is attributed to the connected person.

- Draft authors use `coptle.editorial_draft` to create an immutable version. The payload includes an answer, explanation, and accepted aliases. Pass the existing puzzle ID to create a revision.
- Staff use `coptle.editorial_versions()` to look up the version, source, and review history. Qualified reviewers use `coptle.editorial_review` for their assigned source, theology, or gameplay review.
- Publishers use `coptle.editorial_approve`, then `coptle.editorial_schedule` for daily content. Use `coptle.editorial_withdraw` to remove a version from available inventory.
- The public runtime connection remains pending. No development puzzle is seeded into editorial inventory.

## Launch requirements

The development library contains a small, repeating fixture set. The server validates each submitted guess against the session's attempt history. Practice fixtures are separate from the rotating daily library. Vercel Production disables fixtures even if the preview flag is present. Production guest sessions linked to editorial version IDs, the live schedule, a genuinely reviewed content library, production practice, registered accounts, and Content Studio reporting and audit tooling are pending. See [TASKS.md](TASKS.md) for the remaining work.
