# COPTLE — Full Product and Software Engineering Specification

## 1. Project Instructions

Act as a senior full-stack software engineer, UI/UX designer, product architect, database engineer, and quality assurance engineer.

Design and build a production-ready web application called **Coptle**, a collection of daily Christian puzzle games inspired by the daily gaming experience of NYT Games, Wordle, Connections, and other deduction-based games.

Do not simply create a static website or visual prototype. Build a fully functional, maintainable, scalable application with working game mechanics, persistent data, backend services, authentication, and administrative content management.

Treat this specification as the source of truth throughout development.

Before implementation:

- Inspect the existing repository and installed dependencies.
- Establish an implementation plan.
- Identify architectural dependencies.
- Create a `SPEC.md` containing this specification.
- Create an `AGENTS.md` containing persistent development instructions.
- Create a `TASKS.md` tracking implementation progress.
- Create a `README.md` containing setup and deployment instructions.
- Break development into testable milestones.
- Preserve existing functioning code when applicable.

Make reasonable engineering decisions independently. Do not repeatedly ask for clarification unless a decision materially affects the product, security, theological integrity, or architecture.

## 2. Product Overview

**Product name:** Coptle

**Tagline:** Play. Learn. Grow in faith.

Coptle is a completely free online Christian gaming platform designed primarily for Coptic Orthodox youth while remaining welcoming and accessible to Christians from other backgrounds.

Its purpose is to make learning about Christianity, Scripture, theology, saints, Church history, Coptic language, and liturgical traditions engaging through interactive puzzles.

The platform is a ministry project, not a commercial enterprise.

Core principles:

- Completely free forever.
- No advertisements.
- No subscriptions.
- No microtransactions.
- No paid hints.
- No mandatory registration to play.
- No artificial gameplay restrictions.
- No manipulative engagement mechanics.
- Education through enjoyable gameplay.
- Faithfulness to Coptic Orthodox Christianity.
- Respect toward Christians of other denominations.

The platform should feel like a professionally designed gaming publication, not a conventional church website or Sunday school quiz application.

## 3. Target Audience

Primary audience:

- Coptic Orthodox teenagers.
- Coptic Orthodox college students.
- Coptic Orthodox young adults.
- Church youth ministries.

Secondary audience:

- Christians from other denominations.
- Sunday school students.
- Adults interested in Christianity.
- Individuals learning about the Coptic Orthodox Church.
- Individuals interested in Scripture and Church history.

Design for varying levels of religious knowledge.

Do not assume that all users grew up attending church or are familiar with Orthodox terminology.

## 4. Branding and Visual Identity

Create an original visual identity combining contemporary editorial minimalism with subtle Coptic Christian heritage.

The design should feel premium, timeless, intentional, and youthful.

Use NYT Games as inspiration for simplicity, game discoverability, and usability, but do not copy its branding, graphics, layouts, code, or proprietary assets.

### Color Palette

- Parchment: #F5F1E8
- Forest Green: #243D32
- Burgundy: #732F3A
- Muted Gold: #B59B62
- Ink: #20231F
- White: #FFFFFF

Gameplay colors:

- Correct: #548464
- Partial match: #B49B50
- Incorrect: #81847E

Create accessible alternatives for dark mode and colorblind users.

### Typography

- Headlines: Fraunces or a comparable editorial serif.
- Body: Inter.
- Gameplay: DM Sans.
- Coptic script: Noto Sans Coptic or another suitable Unicode-compatible font.

Self-host fonts where licensing permits.

### Logo

Create an original Coptle wordmark accompanied by a tasteful Coptic-style cross.

The cross should be recognizable, minimal, and respectful.

Do not suggest that the platform is officially endorsed by the Coptic Orthodox Church or any diocese unless such endorsement has been obtained.

### Design Rules

- Use generous whitespace.
- Establish clear typographic hierarchy.
- Incorporate subtle manuscript-inspired geometric elements.
- Provide distinct visual identities for individual games.
- Use restrained animations.
- Avoid excessive gradients.
- Avoid excessive rounded cards.
- Avoid unnecessary shadows.
- Avoid generic SaaS dashboard aesthetics.
- Avoid stereotypical AI-generated designs.
- Avoid childish religious illustrations.
- Avoid overcrowding.
- Support light, dark, and system themes.
- Respect reduced-motion preferences.
- Prioritize mobile usability.

The application should have its own recognizable visual identity.

## 5. Application Navigation

Create the following primary navigation destinations:

- Today
- Practice
- Archive
- Learn
- Statistics
- Community
- Settings
- About

Administrators should have access to a separate protected Content Studio.

The homepage must include:

- Coptle branding.
- Current date.
- Daily puzzle collection.
- Featured daily challenge.
- Game completion indicators.
- Current liturgical season when applicable.
- Difficulty selector.
- Practice mode access.
- Optional reviewed verse of the day.
- Navigation to previous puzzles.
- Access to statistics and settings.

Keep gameplay accessible within one or two interactions from the homepage.

## 6. Global Difficulty System

Implement three difficulty levels across all games where applicable.

### Beginner

Designed for younger players, newcomers, and individuals with limited Christian knowledge.

Features:

- Familiar biblical characters.
- Common Christian terminology.
- Well-known saints.
- Recognizable biblical passages.
- More straightforward clues.
- Generous optional hints.

### Intermediate

Designed for active church youth and regular churchgoers.

Features:

- Less familiar biblical passages.
- Coptic Orthodox traditions.
- Liturgical terminology.
- Church history.
- More challenging saint identification.
- Moderately complex deductions.

### Advanced

Designed for experienced learners.

Features:

- Patristic terminology.
- Orthodox theology.
- Apologetics.
- Lesser-known saints.
- Early Church history.
- Advanced biblical knowledge.
- Coptic language and hymnology.
- More complex deductions.

Difficulty should primarily reflect the knowledge and reasoning required, not simply reduce the number of attempts.

Each difficulty must have independently tracked daily puzzles, statistics, and streaks.

Users may change difficulty outside active gameplay.

## 7. Content Preferences

Support the following content preferences:

- Coptic Orthodox — default.
- General Christianity.
- Scripture.
- Coptic Heritage.
- Theology.
- Church History.
- Mixed.

Content preferences should initially filter practice puzzles and educational collections.

Do not fragment the daily puzzle experience unnecessarily. All users playing the same daily game and difficulty should receive the same challenge.

General Christianity mode should prioritize broadly shared Christian knowledge while remaining consistent with the Coptic Orthodox theological foundation of the platform.

## 8. Gameplay Modes

### Daily Challenges

Each released game should have one new daily puzzle per difficulty.

Requirements:

- Identical daily puzzles for all players within the same game and difficulty.
- Daily reset at midnight America/New_York.
- Correct handling of daylight saving time.
- Server-authoritative puzzle dates.
- Countdown until the next daily puzzle.
- Persistent incomplete sessions.
- No restarting completed daily puzzles to improve statistics.
- Independent progress for each game.
- Spoiler-free result sharing.
- Server-side answer validation.

### Unlimited Practice

Allow users to play as many practice puzzles as they want.

Requirements:

- Difficulty selection.
- Content category selection.
- Random approved puzzles.
- Avoid recently encountered puzzles when the library permits.
- Optional hints.
- Separate practice statistics.
- Immediate access to additional puzzles.
- No lives, energy limits, or artificial waiting periods.
- No exposure of future scheduled daily answers.

When the practice library is exhausted, clearly explain that puzzles will repeat. Do not generate unreviewed theological content to fill the library.

### Puzzle Archive

Allow users to browse previous daily puzzles.

Requirements:

- Calendar-based navigation.
- Game filtering.
- Difficulty filtering.
- Completion indicators.
- Access to missed puzzles.
- Access to previously completed puzzles.
- Archived gameplay must not retroactively repair daily streaks.

## 9. Game Catalog

Build games as modular components using a shared game engine.

### Game 1: The Word

A Christian-themed word deduction game.

Objective: Guess a hidden Christian-related word within six attempts.

Difficulty:

- Beginner: five-letter words.
- Intermediate: six-letter words.
- Advanced: seven-to-nine-letter words.

Example answers:

- FAITH
- GRACE
- PSALM
- PRAYER
- GOSPEL
- EXODUS
- THEOSIS
- DORMITION

Gameplay requirements:

- Green tiles indicate correct letters in correct positions.
- Yellow tiles indicate correct letters in incorrect positions.
- Gray tiles indicate absent letters.
- Handle repeated letters accurately using a two-pass scoring algorithm.
- Accept valid general dictionary words as guesses.
- Restrict answers to the approved Christian answer library.
- Support biblical proper nouns where applicable.
- Support physical and virtual keyboards.
- Provide keyboard feedback.
- Prevent invalid guesses from consuming attempts.
- Animate submitted guesses.
- Save progress after each valid submission.
- Reveal a reviewed definition and explanation after completion.
- Provide relevant biblical or theological references.
- Support accessible, non-color feedback indicators.

### Game 2: Saintle

A saint identification and deduction game.

Objective: Identify the hidden saint within six guesses.

Users search for saints by name and submit guesses. Each guess receives feedback based on attributes.

Possible attributes:

- Geographic region.
- Historical period.
- Gender.
- Primary vocation.
- Clerical office.
- Monastic status.
- Martyrdom.
- Feast day.
- Historical significance.

Feedback should communicate exact, partial, incorrect, earlier, or later matches where appropriate.

Support alternative names, titles, transliterations, and spelling variations.

Example beginner saints:

- St. Mark the Evangelist.
- St. Mary.
- St. George.
- St. Anthony the Great.

Example intermediate saints:

- St. Athanasius the Apostolic.
- St. Mina.
- St. Moses the Strong.

Example advanced saints:

- St. Samuel the Confessor.
- St. Shenoute the Archimandrite.
- Lesser-known verified saints from the Coptic Synaxarium.

Every saint must be verified as appropriate for inclusion according to recognized Coptic Orthodox sources.

After completion, display:

- Saint's name.
- Approved icon when available.
- Short biography.
- Feast day where verified.
- Historical significance.
- Source references.
- Recommended reading.

Do not fabricate historical details for missing attributes. Represent unknown information explicitly.

### Game 3: Versele

A Scripture-based puzzle game.

Supported puzzle types:

- Complete a missing word.
- Complete a passage.
- Identify the biblical book.
- Identify the chapter.
- Identify the verse reference.
- Identify the speaker.
- Identify the biblical context.

Beginner:

- Familiar verses.
- Multiple-choice answers.
- Generous context.

Intermediate:

- Less familiar verses.
- Limited multiple choice.
- Book and chapter identification.

Advanced:

- Free-text answers.
- Precise reference identification.
- Challenging biblical passages.

Use the NKJV as the preferred translation only where licensing allows.

Do not scrape, reproduce, or redistribute copyrighted Bible translations without permission. If licensing cannot be established, use an appropriately licensed translation, clearly labeled, or use Scripture references and original reviewed clues.

Never invent Scripture quotations.

### Game 4: Connections

A Christian-themed category deduction game.

Objective: Arrange sixteen terms into four groups of four.

Requirements:

- Randomized initial tile arrangement.
- Four unique groups.
- Maximum of four incorrect submissions.
- Four selectable tiles per submission.
- Deselect and shuffle controls.
- Correct group reveal.
- One-away feedback when applicable.
- Final solution reveal.
- Explanation of each category.
- Accessible selection states.

Potential categories:

- Books of the Bible.
- Apostles.
- Prophets.
- Biblical locations.
- Desert Fathers.
- Liturgical objects.
- Sacraments.
- Church councils.
- Coptic vocabulary.
- Christian virtues.
- Biblical symbolism.

Every puzzle must be reviewed for alternate valid full solutions and unnecessary ambiguity.

### Game 5: Chronicle

A chronological ordering game.

Objective: Arrange biblical or Church historical events from earliest to latest.

Requirements:

- Drag-and-drop functionality.
- Accessible keyboard and button-based reordering.
- Configurable number of events.
- Increasing difficulty.
- Feedback after submissions.
- Historical explanations after completion.

Potential subjects:

- Old Testament narratives.
- Life of Christ.
- Acts of the Apostles.
- Early Christianity.
- Ecumenical councils recognized by the Coptic Orthodox Church.
- Desert Fathers.
- Coptic Church history.

Do not invent precise dates for disputed historical events.

Where appropriate, ask players to arrange events according to biblical narrative order rather than speculative dates.

### Game 6: Copticle

A Coptic language learning game.

Use Bohairic Coptic as the initial dialect.

Supported puzzle types:

- Alphabet identification.
- Vocabulary translation.
- Word recognition.
- Liturgical phrase translation.
- Word matching.
- Basic grammar.
- Pronunciation recognition when approved audio is available.

Support Unicode Coptic characters and appropriate normalization.

Distinguish dialects and pronunciation traditions when relevant.

Do not present uncertain translations as established facts.

### Game 7: Iconle

A sacred icon identification game.

Objective: Identify a biblical scene or saint from progressively revealed portions of an approved icon.

Requirements:

- Progressive visual reveals.
- Searchable valid answers.
- Optional textual clues.
- Full icon reveal after completion.
- Educational explanation of the icon's subject.

Use original, public-domain, or properly licensed icons.

Treat icons respectfully.

Do not distort sacred imagery, caricature saints, or incorporate irreverent animations.

Provide an accessible text-based alternative for visually impaired users.

### Game 8: Hymnle

A Coptic hymn identification game.

Objective: Identify a hymn from increasingly long audio excerpts.

Users may identify:

- Hymn name.
- Liturgical occasion.
- Church season.
- Associated service.

Requirements:

- Progressive audio reveals.
- Playback controls.
- No autoplay.
- Searchable answer selection.
- Support for recognized hymn variants.
- Proper audio attribution.
- Licensed or explicitly permitted recordings.

### Future Games

Design the architecture to support:

- Testament: identify a biblical book.
- Disciple: biblical character deduction.
- Pilgrim: biblical geography.
- Who Said It?: verified quotation identification.
- Parable: identify biblical parables.
- Catechism: Orthodox doctrinal knowledge.
- Scramble: Christian word unscrambling.
- Christian mini-crosswords.
- Liturgical matching.
- Church history trivia.

Do not include placeholder games that appear playable but have no implemented functionality.

## 10. Theological Integrity

This section is non-negotiable.

Coptle must maintain the theological foundation of the Coptic Orthodox Church, which belongs to the Oriental Orthodox communion.

The application must not publish heretical teachings as Christian or Orthodox doctrine.

### Doctrinal Foundation

All doctrinal content must be consistent with:

- One God in three distinct Persons: the Father, the Son, and the Holy Spirit.
- The full divinity and full humanity of Jesus Christ.
- The eternal Son of God, who became incarnate for our salvation.
- Orthodox Miaphysite Christology as articulated by St. Cyril of Alexandria.
- The unity of Christ without mingling, confusion, alteration, or separation.
- The Nicene-Constantinopolitan Creed as received by the Coptic Orthodox Church.
- The first three Ecumenical Councils: Nicaea, Constantinople, and Ephesus.
- The authority of Holy Scripture and apostolic tradition.
- The seven sacraments.
- The Virgin Mary as Theotokos.
- The veneration and intercession of saints.
- The distinction between worship due to God alone and veneration of saints.
- The bodily Resurrection of Jesus Christ.
- Salvation, repentance, grace, and eternal life according to Orthodox teaching.

Do not confuse Miaphysitism with Eutychian Monophysitism.

Do not reduce complex theological teachings to inaccurate analogies.

Do not characterize other Christian denominations using misleading oversimplifications.

### Prohibited Content

Do not publish:

- Fabricated Scripture.
- Invented saint biographies.
- Fabricated patristic quotations.
- Unverified theological claims.
- Heresy presented as orthodox teaching.
- Superstition presented as Christianity.
- Denominational hostility.
- Speculation presented as doctrine.
- Incorrect sacramental teachings.
- Unsupported miracle accounts presented as historical certainty.
- Claims that gameplay measures holiness, salvation, or spiritual maturity.

### Approved Source Categories

Prioritize:

- Holy Scripture.
- The Creed as received by the Coptic Orthodox Church.
- Received teachings of the first three Ecumenical Councils.
- Coptic Synaxarium.
- Agpeya.
- Coptic Orthodox liturgical texts.
- Recognized Coptic Orthodox Church Fathers.
- St. Athanasius the Apostolic.
- St. Cyril of Alexandria.
- St. Anthony the Great.
- Reviewed writings of the Desert Fathers.
- Official Coptic Orthodox Church publications.
- Reviewed writings of Pope Shenouda III.
- Reliable historical scholarship where appropriate.

Unofficial blogs, social media posts, and anonymous quotations are not sufficient authoritative sources.

### Mandatory Content Review

Every puzzle must include:

- Correct answer.
- Accepted alternative answers.
- Explanation.
- Difficulty.
- Content category.
- Source reference.
- Source verification status.
- Theological review status.
- Gameplay review status.
- Version number.
- Reviewer identification.
- Approval date.

Content progresses through:

1. Draft.
2. Source verification.
3. Theological review.
4. Gameplay review.
5. Final approval.
6. Scheduled publication.
7. Published.

Content cannot be published unless all required reviews have been completed.

Any substantive modification invalidates prior approval.

AI-generated content must never be automatically published.

The application should support qualified human theological reviewers designated by the ministry.

Do not simulate human theological approval or mark generated content as approved.

Development fixtures must be explicitly labeled as demo content and must not enter the production puzzle library automatically.

## 11. Educational Experience

Every completed puzzle, regardless of whether the player wins or loses, should unlock an educational explanation.

The post-game screen should include:

- Correct answer.
- Performance summary.
- Concise educational explanation.
- Verified source references.
- Relevant Scripture passages or references.
- Additional reading recommendations.
- Related puzzles.
- Save-to-library functionality.
- Spoiler-free sharing.
- Return-to-home or play-next options.

Keep explanations accessible and appropriately concise.

Allow users to expand more detailed historical or theological information when available.

Create a personal learning library where users can revisit discovered saints, biblical passages, terminology, historical events, and Coptic vocabulary.

## 12. Liturgical Calendar

Integrate the Coptic Orthodox liturgical calendar.

Support seasonal puzzle collections related to:

- Nayrouz.
- Feasts of the Cross.
- Nativity Fast.
- Feast of the Nativity.
- Theophany.
- Jonah's Fast.
- Great Lent.
- Holy Week.
- Feast of the Resurrection.
- Holy Fifty Days.
- Pentecost.
- Apostles' Fast.
- St. Mary's Fast.
- Feast of the Assumption of St. Mary's body.

Use a verified Coptic Orthodox calendar source.

Do not rely on unverified date calculations generated by AI.

Support year-specific calendar exceptions and administrative overrides.

Display feast and fast dates correctly.

Allow seasonal accents and themed puzzles without compromising the overall visual identity.

During Holy Week and other solemn occasions, avoid inappropriate celebratory animations.

## 13. User Accounts

Guest users must be able to:

- Play all released games.
- Complete daily challenges.
- Access unlimited practice.
- View local statistics.
- Share results.
- Access educational explanations.
- Browse the archive.

Optional registered accounts should provide:

- Cross-device synchronization.
- Cloud-backed statistics.
- Saved learning materials.
- Private church groups.
- Profile customization.
- Backup and recovery.

Support email magic links and Google authentication where appropriately configured.

Implement secure anonymous guest sessions.

Allow guest progress to merge into registered accounts without double-counting completed puzzles.

Do not require an account to access educational or religious content.

## 14. Statistics and Progression

Implement:

- Total games played.
- Total completed puzzles.
- Wins.
- Win percentage.
- Current winning streak.
- Longest winning streak.
- Participation history.
- Guess distributions.
- Daily completion rates.
- Practice performance.
- Difficulty-specific statistics.
- Game-specific statistics.
- Historical performance.

Track daily, practice, and archive results separately.

Calculate statistics consistently on the server.

Use achievements such as:

- First Fruits: complete the first puzzle.
- Daily Bread: complete a seven-day participation streak.
- Scripture Scholar: complete fifty Scripture puzzles.
- Church Historian: complete fifty history puzzles.
- Desert Explorer: complete twenty-five saint puzzles.
- Coptic Linguist: complete fifty language puzzles.

Achievements measure gameplay and learning, not holiness or spiritual standing.

Do not implement punitive or manipulative streak mechanics.

## 15. Church Communities

Implement private church communities during the community development milestone.

Examples:

- Parish youth groups.
- Sunday school classes.
- College fellowships.
- Bible studies.
- Retreat groups.
- Friend groups.

Features:

- Invite-only membership.
- Join codes.
- Private leaderboards.
- Weekly challenges.
- Custom collections of approved puzzles.
- Group participation statistics.
- Group administration.
- Optional display names.
- Reporting and moderation.

Church leaders should be able to organize themed competitions around retreats, biblical subjects, and liturgical seasons.

Custom group collections may use only approved puzzles.

Do not include public direct messaging, public profiles for minors, unrestricted user-generated content, or public personal information.

Implement age-appropriate safeguards before enabling social features.

## 16. Sharing

Generate spoiler-free results for every applicable game.

Example:

✙ Coptle #128

The Word — Intermediate — 4/6

⬛🟨⬛⬛🟩⬛

🟩⬛🟨⬛🟩⬛

🟩🟩⬛🟩🟩🟩

🟩🟩🟩🟩🟩🟩

Play. Learn. Grow in faith.

Users should be able to:

- Copy text results.
- Use native mobile sharing.
- Share links.
- Generate accessible result cards.
- Download result cards.

Never expose the correct answer in shareable content.

## 17. Technical Stack

Use a modern, maintainable TypeScript architecture.

Preferred technologies:

- Next.js App Router.
- React.
- TypeScript with strict mode.
- Tailwind CSS.
- shadcn/ui primitives where useful.
- Motion for restrained animations.
- PostgreSQL.
- Supabase database.
- Supabase Auth.
- Supabase Storage.
- Zod.
- Vitest.
- Playwright.
- GitHub Actions.
- Vercel.
- Progressive Web App support.

Select mutually compatible stable dependency versions and verify them against official documentation before implementation.

Avoid unnecessary dependencies.

Do not introduce paid AI services as runtime requirements.

Daily gameplay should operate deterministically without requiring an LLM.

## 18. Repository Architecture

Organize the repository into modular directories resembling:

    coptle/
      app/
        games/
        practice/
        archive/
        learn/
        stats/
        community/
        settings/
        about/
        admin/
        api/
      components/
        games/
        layout/
        shared/
        ui/
      lib/
        game-engine/
        scoring/
        validation/
        calendar/
        auth/
        database/
        supabase/
      content/
        schemas/
        seed/
        sources/
      hooks/
      types/
      public/
        icons/
        assets/
        fonts/
      supabase/
        migrations/
      tests/
      SPEC.md
      AGENTS.md
      TASKS.md
      README.md
      .env.example

Adapt this structure to the actual framework requirements.

Keep business logic independent of presentation components.

Do not create unnecessarily large monolithic components.

## 19. Shared Game Engine

Create a modular game engine supporting configurable game types.

Common capabilities:

- Game registration.
- Puzzle loading.
- Session initialization.
- Guess validation.
- Guess scoring.
- Attempt tracking.
- Hint tracking.
- Puzzle completion.
- Forfeiting.
- Progress restoration.
- Statistics updates.
- Educational content retrieval.
- Result serialization.
- Daily puzzle scheduling.

Use discriminated TypeScript unions for game-specific puzzle formats.

Each game should implement its own validation and scoring logic through a common interface.

Suggested operations:

- startSession
- validateGuess
- submitGuess
- getFeedback
- requestHint
- checkCompletion
- completeSession
- serializeResult

Keep game results deterministic and testable.

## 20. Database Architecture

Implement database migrations for:

- profiles
- games
- puzzles
- puzzle_versions
- daily_puzzles
- game_sessions
- attempts
- user_statistics
- saints
- scripture_references
- coptic_vocabulary
- historical_events
- sources
- content_reviews
- content_reports
- achievements
- user_achievements
- groups
- group_members
- group_challenges
- calendar_events
- saved_learning

Use UUIDs, foreign keys, indexes, constraints, and appropriate timestamps.

Require each daily puzzle to reference an approved puzzle version.

Enforce uniqueness across puzzle date, game, and difficulty.

Ensure session records reference the exact puzzle version originally played.

Store source citations and media licensing information.

Use transactions and idempotency protections to avoid duplicate attempts and duplicate statistics updates.

Implement database row-level security.

Never trust client-provided user IDs, roles, scores, completion statuses, or answers.

## 21. API Architecture

Implement appropriately structured API routes or server-side services for:

- GET /api/games
- GET /api/daily
- POST /api/session
- GET /api/session/:id
- POST /api/session/:id/guess
- POST /api/session/:id/hint
- POST /api/session/:id/forfeit
- GET /api/archive
- GET /api/stats
- GET /api/learn/:id
- POST /api/report
- POST /api/admin/puzzles
- POST /api/admin/reviews
- POST /api/admin/schedule

Practice session creation should use an appropriate POST endpoint.

All endpoints must implement:

- Input validation.
- Authentication where applicable.
- Authorization.
- Rate limiting.
- Standardized errors.
- Secure guest session verification.
- Appropriate cache controls.
- Server-side scoring.
- Protection against duplicate submissions.

Do not send daily or practice answers to the frontend before completion.

Do not leak answers through page source, React Server Component payloads, static assets, hydration data, client-side JavaScript bundles, or unrestricted database queries.

## 22. Administrative Content Studio

Build a protected administrative interface for managing all game content.

Features:

- Dashboard.
- Puzzle creation.
- Puzzle editing.
- Game-specific content forms.
- Bulk JSON or CSV importing.
- Schema validation.
- Source management.
- Reviewer assignment.
- Theological approval.
- Gameplay approval.
- Difficulty classification.
- Puzzle previews.
- Scheduling calendar.
- Puzzle publication.
- Content reports.
- Duplicate detection.
- Revision history.
- Audit logs.
- Emergency content withdrawal.
- Content inventory by game and difficulty.

Administrative roles:

- Super administrator.
- Content creator.
- Source reviewer.
- Theological reviewer.
- Gameplay reviewer.
- Publisher.
- Community leader.

Enforce permissions on the backend and through database policies.

A content creator must not be able to bypass theological approval.

The publication system must reject unapproved or outdated puzzle versions.

Include an emergency withdrawal mechanism for inaccurate or inappropriate content.

## 23. Content Reporting

Allow players to report:

- Incorrect answers.
- Theological inaccuracies.
- Incorrect biblical references.
- Historical inaccuracies.
- Ambiguous puzzles.
- Translation errors.
- Incorrect feast dates.
- Technical problems.
- Inappropriate content.

Reports should be attached to a specific puzzle version.

Administrators should be able to investigate, respond internally, correct content, and withdraw affected puzzles.

Do not publicly display unmoderated reports.

## 24. Privacy and Security

Because the platform targets youth, privacy must be a foundational requirement.

Implement:

- Minimal personal data collection.
- Secure authentication.
- Secure guest sessions.
- Database row-level security.
- Server-side authorization.
- Rate limiting.
- Input sanitization.
- Secure HTTP headers.
- Content Security Policy.
- CSRF protection where applicable.
- XSS prevention.
- Secure cookie configuration.
- Protection against credential exposure.
- Account deletion.
- Data deletion and export functionality.
- Least-privilege administrative access.

Do not collect unnecessary sensitive information.

Do not implement behavioral advertising or invasive tracking.

Do not knowingly collect personal information from children below applicable consent thresholds without appropriate legal safeguards.

Before launching registered accounts or youth community functionality, identify applicable COPPA, GDPR, and other privacy requirements for human legal review.

Never commit secrets or service-role keys to the repository.

Provide a documented `.env.example`.

## 25. Accessibility

Target WCAG 2.2 AA.

Implement:

- Keyboard navigation.
- Visible focus indicators.
- Semantic HTML.
- Screen reader compatibility.
- Accessible forms.
- Alternative text.
- Colorblind-friendly feedback.
- Sufficient contrast.
- Reduced-motion support.
- Responsive text sizing.
- Accessible game announcements.
- Accessible alternatives to drag-and-drop.
- Accessible alternatives to image-dependent gameplay.
- Text support for appropriate audio-dependent gameplay.
- Touch-friendly controls.

Gameplay must not rely exclusively on color, sound, or visual animations.

## 26. Performance

Prioritize fast gameplay and mobile responsiveness.

Requirements:

- Optimize images and fonts.
- Lazy-load nonessential assets.
- Load game-specific code only when needed.
- Minimize JavaScript bundle size.
- Avoid unnecessary client-side rendering.
- Use appropriate caching.
- Avoid caching private user data publicly.
- Handle slow connections gracefully.
- Provide meaningful loading and error states.
- Restore interrupted game sessions.
- Target Lighthouse performance scores of 90 or higher under a documented test environment.

Implement Progressive Web App support.

Do not cache unreleased answers or sensitive data in service workers.

Offline functionality may preserve the application shell and permitted local progress, but must not compromise server-side answer security.

## 27. Testing Requirements

Write tests alongside implementation.

### Unit Tests

Cover:

- Word scoring.
- Duplicate-letter handling.
- Game validation.
- Saint attribute comparison.
- Scripture answer normalization.
- Connections grouping.
- Chronological ordering.
- Hint tracking.
- Puzzle completion.
- Statistics calculations.
- Streak calculations.
- Date and timezone handling.
- Content approval rules.

### Integration Tests

Cover:

- Session initialization.
- Guess submission.
- Session restoration.
- Puzzle completion.
- Statistics persistence.
- Guest-to-account merging.
- Puzzle scheduling.
- Administrative permissions.
- Publication approval enforcement.
- Future answer protection.

### End-to-End Tests

Cover:

- Guest gameplay.
- Daily puzzle completion.
- Unlimited practice.
- Difficulty selection.
- Mobile navigation.
- Theme switching.
- Result sharing.
- Account authentication.
- Administrative content review.
- Puzzle reporting.
- Accessibility fundamentals.

Include regression tests for discovered bugs.

Do not claim tests pass unless they have actually been executed successfully.

## 28. Content Inventory and Launch Readiness

Create structured templates for importing content.

Maintain separate development and production content libraries.

Do not generate hundreds of theological questions and automatically approve them.

The public launch should require at least thirty days of approved daily puzzles for each released game and difficulty.

For the initial three games, this means:

- 90 approved Word puzzles.
- 90 approved Saintle puzzles.
- 90 approved Versele puzzles.
- Additional approved practice content.

Practice content must be sufficient to provide variety and must exclude future daily answers.

The administrative dashboard should display inventory shortages and upcoming scheduling gaps.

Where sufficient approved content is unavailable, disable the affected game or difficulty rather than publishing unreviewed content.

## 29. Development Roadmap

Implement the application incrementally.

### Milestone 1: Foundation

- Repository initialization.
- Architecture documentation.
- Design system.
- Coptle branding.
- Responsive homepage.
- Navigation.
- Theme system.
- Supabase configuration.
- Database migrations.
- Shared game engine.

### Milestone 2: Functional MVP

- The Word.
- Saintle.
- Versele.
- Three difficulty levels.
- Daily challenge scheduling.
- Unlimited practice.
- Guest sessions.
- Persistent progress.
- Basic statistics.
- Post-game explanations.
- Result sharing.

### Milestone 3: Content Management

- Administrative Content Studio.
- Content creation.
- Source verification.
- Theological review.
- Gameplay review.
- Puzzle publication.
- Bulk import.
- Content reporting.
- Audit logs.

Complete this milestone before any public content launch.

### Milestone 4: Expanded Gameplay

- Connections.
- Chronicle.
- Copticle.
- Puzzle archive.
- Learning library.
- Liturgical calendar.
- Achievements.

### Milestone 5: Accounts and Community

- Registered accounts.
- Cross-device synchronization.
- Guest account migration.
- Private church groups.
- Group challenges.
- Optional leaderboards.
- Age-appropriate privacy and moderation safeguards.

### Milestone 6: Multimedia Games

- Iconle.
- Hymnle.
- Media management.
- Licensing verification.
- Accessible alternative gameplay.

### Milestone 7: Production Hardening

- Security review.
- Accessibility audit.
- Performance optimization.
- Automated testing.
- Deployment configuration.
- Error monitoring.
- Documentation.
- Content inventory validation.
- Production readiness review.

## 30. Production Deployment

Prepare the application for deployment using Vercel and Supabase.

Provide:

- Environment variable instructions.
- Local development setup.
- Database migration instructions.
- Development seed instructions.
- Authentication configuration.
- Deployment instructions.
- Custom domain configuration.
- Production database setup.
- Backup and restoration guidance.
- CI/CD workflows.
- Operational documentation.

Use separate development, preview, and production environments.

Do not deploy publicly without explicit authorization.

Do not assume that any external service is configured until verified.

The project should be designed to minimize ongoing infrastructure costs while acknowledging that hosting and database services may eventually incur costs.

## 31. MVP Acceptance Criteria

The MVP is considered technically complete when:

- The homepage has a cohesive, original Coptle visual identity.
- The Word, Saintle, and Versele function end to end.
- All three difficulty levels operate correctly.
- Daily puzzles reset consistently.
- Unlimited practice functions correctly.
- Guests can play without registration.
- Sessions persist after refreshing the page.
- Guess validation occurs server-side.
- Statistics accurately reflect completed games.
- Result sharing does not reveal answers.
- Mobile gameplay functions correctly.
- Dark mode and accessibility settings function.
- Educational explanations are available after completion.
- Administrators can create and review puzzles.
- Unapproved content cannot be published.
- Database policies prevent unauthorized access.
- Tests execute successfully.
- Build and type checking execute successfully.
- Deployment documentation is complete.

Technical completion does not constitute theological approval or public launch readiness.

## 32. Engineering Rules

Throughout development:

- Do not take shortcuts that create security vulnerabilities.
- Do not hardcode production credentials.
- Do not use placeholder functionality to represent completed features.
- Do not fabricate backend responses.
- Do not invent approved theological sources.
- Do not automatically publish generated content.
- Do not introduce unnecessary architectural complexity.
- Do not sacrifice usability for decorative elements.
- Do not copy proprietary gaming assets.
- Do not remove working functionality without justification.
- Do not leave critical TODOs in completed features.
- Do not claim completion without verification.

After every implementation milestone:

1. Review the implementation.
2. Run linting.
3. Run TypeScript checks.
4. Run applicable tests.
5. Run the production build.
6. Inspect the user interface.
7. Fix regressions.
8. Update TASKS.md.
9. Document architectural decisions.
10. Identify remaining blockers.

If credentials, permissions, licensed assets, qualified reviewers, or external services are unavailable, implement the appropriate interfaces and clearly document the blocker instead of pretending the integration is working.

## 33. Final Development Directive

Build Coptle as a genuinely enjoyable, beautifully designed Christian daily gaming platform.

Prioritize gameplay quality, theological integrity, accessibility, privacy, maintainability, and educational value.

The platform should be distinctly Coptic Orthodox while remaining welcoming to anyone interested in learning about Christianity.

Begin by inspecting the repository and establishing the architecture. Then proceed with implementation, starting with Milestone 1 and continuing into the functional MVP.

Do not stop at a landing page, design proposal, or implementation plan. Build the actual application, verify its functionality, and maintain detailed documentation of progress and remaining requirements.

The ultimate goal is to create a free digital ministry that helps Christian youth learn something meaningful about their faith every day.