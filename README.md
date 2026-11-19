# Coptle

Coptle is an independent Christian daily puzzle project. The Word, Saintle, and Versele are playable with development fixtures. The product specification and roadmap live in [SPEC.md](SPEC.md) and [TASKS.md](TASKS.md).

## Local development

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Development fixtures are available automatically in the Next.js development server. Daily puzzle dates use midnight in America/New_York. Development guest progress is kept on the current server process for up to two days and restored on refresh through an HttpOnly cookie. Restarting the server clears active games. Daily result totals and appearance settings remain in this browser.

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

For an isolated Supabase project, review and apply the SQL in `supabase/migrations` using the Supabase CLI or SQL editor. The migration creates a private `coptle` schema and grants no browser or service API access. Do not add it to the API's exposed schemas. `npm test` runs the migration against a disposable PGlite database with test-only review records. The running site does not connect to this schema yet.

## Launch requirements

The development library contains a small, repeating fixture set. The server validates each submitted guess against the session's attempt history. Practice fixtures are separate from the rotating daily library. Vercel Production disables fixtures even if the preview flag is present. Durable sessions, an approved content library, a database-backed daily schedule, production practice content, accounts, and the protected review and publishing workflow are pending. See [TASKS.md](TASKS.md) for the remaining work.
