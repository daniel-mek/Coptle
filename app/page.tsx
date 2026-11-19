import Link from "next/link";
import { difficulties, games, isDifficulty } from "../lib/catalog";
import { fixturesEnabled } from "../lib/config";
import { dailyTimeZone } from "../lib/calendar";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ level?: string; mode?: string }> }) {
  const query = await searchParams;
  const level = typeof query.level === "string" && isDifficulty(query.level) ? query.level : "beginner";
  const mode = query.mode === "practice" ? "practice" : "daily";
  const date = new Date();
  const formatted = new Intl.DateTimeFormat("en", { dateStyle: "full", timeZone: dailyTimeZone }).format(date);
  const available = fixturesEnabled();
  return <>
    <section className="hero">
      <div><p className="eyebrow">{mode === "daily" ? formatted : "Practice puzzles"}</p>
        <h1>Play. Learn.<br />Grow in faith.</h1>
        <p className="lede">Daily puzzles about Scripture, the saints, and Coptic Orthodox tradition.</p>
      </div>
      <div className="ornament" aria-hidden="true"><span>✥</span></div>
    </section>
    <section aria-labelledby="puzzles">
      <div className="section-heading">
        <h2 id="puzzles">{mode === "daily" ? "Today’s puzzles" : "Practice"}</h2>
        <nav className="levels" aria-label="Difficulty">
          {difficulties.map((difficulty) => <Link key={difficulty} aria-current={difficulty === level ? "page" : undefined} href={`/?mode=${mode}&level=${difficulty}`}>{difficulty}</Link>)}
        </nav>
      </div>
      {!available && <p className="notice">Puzzles are awaiting content review.</p>}
      <div className="cards">
        {Object.entries(games).map(([id, game]) => <article className={`card ${id}`} key={id}>
          <div aria-hidden="true" className="game-mark">{game.mark}</div>
          <p className="eyebrow">{game.label}</p><h3>{game.name}</h3><p>{game.description}</p>
          {available && <Link className="button" href={`/play/${id}?mode=${mode}&level=${level}`} aria-label={`Play ${game.name}`}>Play <span aria-hidden="true">→</span></Link>}
        </article>)}
      </div>
      {available && <p className="notice">Development puzzles for testing. Content review is pending.</p>}
    </section>
  </>;
}
