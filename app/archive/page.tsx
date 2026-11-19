import Link from "next/link";
import { recentPuzzleDates } from "../../lib/calendar";
import { difficulties, games, isDifficulty } from "../../lib/catalog";
import { fixturesEnabled } from "../../lib/config";

export const dynamic = "force-dynamic";
const dateLabel = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" });

export default async function Archive({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level: selected } = await searchParams;
  const level = selected && isDifficulty(selected) ? selected : "beginner";
  return <section className="play">
    <h1>Archive</h1>
    {fixturesEnabled() ? <>
      <p>Play the last seven days of development puzzles. Archive play keeps its own progress.</p>
      <nav className="levels" aria-label="Archive difficulty">
        {difficulties.map((difficulty) => <Link key={difficulty} href={`/archive?level=${difficulty}`} aria-current={level === difficulty ? "page" : undefined}>{difficulty}</Link>)}
      </nav>
      <ol className="archive-list">
        {recentPuzzleDates().map((date) => <li key={date}>
          <time dateTime={date}>{dateLabel.format(new Date(date))}</time>
          <nav aria-label={`Puzzles for ${dateLabel.format(new Date(date))}`}>
            {Object.entries(games).map(([id, game]) => <Link key={id} href={`/play/${id}?mode=archive&level=${level}&date=${date}`}>{game.name}</Link>)}
          </nav>
        </li>)}
      </ol>
    </> : <p>The archive will open when reviewed puzzles are available.</p>}
  </section>;
}
