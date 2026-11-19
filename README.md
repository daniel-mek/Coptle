# Coptle

Coptle is an independent Christian daily puzzle project. The Word, Saintle, and Versele are playable with development fixtures. The product specification and roadmap live in [SPEC.md](SPEC.md) and [TASKS.md](TASKS.md).

## Local development

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Development fixtures are available automatically in the Next.js development server. Daily puzzle dates use midnight in America/New_York. Guest progress, results, and appearance settings are stored in the browser.

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

## Launch requirements

The development library contains a small, repeating fixture set. Server-side scoring replays guesses sent by the browser. Browser storage is suitable for testing guest play on one device. Durable sessions, an approved content library, a database-backed daily schedule, production practice content, accounts, and the protected review and publishing workflow are pending. See [TASKS.md](TASKS.md) for the remaining work.
