import { BookOpen, Grid2X2, Hourglass, Languages, Puzzle, UserRound } from "lucide-react";
import Link from "next/link";
import { difficulties, games, isDifficulty } from "../lib/catalog";
import { fixturesEnabled } from "../lib/config";
import { dailyTimeZone } from "../lib/calendar";

export const dynamic = "force-dynamic";

const tiles = [
  { id: "word", Icon: Grid2X2, name: games.word.name, playable: true },
  { id: "saintle", Icon: UserRound, name: games.saintle.name, playable: true },
  { id: "versele", Icon: BookOpen, name: games.versele.name, playable: true },
  { id: "connections", Icon: Puzzle, name: "Connections", playable: false },
  { id: "chronicle", Icon: Hourglass, name: "Chronicle", playable: false },
  { id: "copticle", Icon: Languages, name: "Copticle", playable: false },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ level?: string; mode?: string }> }) {
  const query = await searchParams;
  const level = typeof query.level === "string" && isDifficulty(query.level) ? query.level : "beginner";
  const mode = query.mode === "practice" ? "practice" : "daily";
  const formatted = new Intl.DateTimeFormat("en", { dateStyle: "full", timeZone: dailyTimeZone }).format(new Date());
  const available = fixturesEnabled();
  return <>
    <section className="hero">
      <p className="eyebrow">{mode === "daily" ? formatted : "Practice puzzles"}</p>
      <h1>{mode === "daily" ? "A little wisdom every day." : "Make time to practice."}</h1>
      <p className="lede">Play. Learn. Grow in faith.</p>
    </section>
    <section aria-labelledby="puzzles">
      <div className="section-heading">
        <h2 id="puzzles">{mode === "daily" ? "Today’s puzzles" : "Practice"}</h2>
        <nav className="levels" aria-label="Difficulty">
          {difficulties.map((difficulty) => <Link key={difficulty} aria-current={difficulty === level ? "page" : undefined} href={`/?mode=${mode}&level=${difficulty}`}>{difficulty}</Link>)}
        </nav>
      </div>
      <div className="cards">
        {tiles.map(({ id, name, Icon, playable }) => {
          const status = playable ? available ? mode === "daily" ? "Daily puzzle" : "Practice puzzle" : "Awaiting review" : "Coming later";
          const content = <><Icon aria-hidden="true" /><div><h3>{name}</h3><p>{status}</p></div></>;
          return playable && available
            ? <Link className={`card ${id}`} href={`/play/${id}?mode=${mode}&level=${level}`} aria-label={`Play ${name}`} key={id}>{content}</Link>
            : <article className={`card ${id}`} key={id}>{content}</article>;
        })}
      </div>
      <p className="notice">{available ? "Development puzzles. Content review is pending." : "Puzzles are awaiting content review."}</p>
    </section>
  </>;
}
