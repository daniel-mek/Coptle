import Link from "next/link";
import { recentPuzzleDates } from "../../lib/calendar";
import { difficulties, games, isDifficulty, type Game } from "../../lib/catalog";
import { fixturesEnabled, reviewedPlayEnabled } from "../../lib/config";

import { archiveGames } from "../../lib/reviewed-play";

export const dynamic = "force-dynamic";
const dateLabel = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" });

export default async function Archive({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level: selected } = await searchParams;
  const level = selected && isDifficulty(selected) ? selected : "beginner";
  const demo = !reviewedPlayEnabled() && fixturesEnabled();
  const rows = demo ? recentPuzzleDates().flatMap((date) => (Object.keys(games) as Game[]).map((game) => ({ date, game })))
    : await archiveGames(level);
  const dates = [...new Set(rows.map(({ date }) => date))];
  return <section className="play">
    <h1>Archive</h1>
    <>
      <p>{demo ? "Play the last seven days of development puzzles." : "Play recent reviewed puzzles."} Archive play keeps its own progress.</p>
      <nav className="levels" aria-label="Archive difficulty">
        {difficulties.map((difficulty) => <Link key={difficulty} href={`/archive?level=${difficulty}`} aria-current={level === difficulty ? "page" : undefined}>{difficulty}</Link>)}
      </nav>
      {dates.length > 0 ? <ol className="archive-list">
        {dates.map((date) => <li key={date}>
          <time dateTime={date}>{dateLabel.format(new Date(date))}</time>
          <nav aria-label={`Puzzles for ${dateLabel.format(new Date(date))}`}>
            {rows.filter((row) => row.date === date).map(({ game }) => <Link key={game} href={`/play/${game}?mode=archive&level=${level}&date=${date}`}>{games[game].name}</Link>)}
          </nav>
        </li>)}
      </ol> : <p>No archive puzzles are available at this difficulty.</p>}
    </>
  </section>;
}
