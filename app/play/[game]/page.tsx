import { notFound } from "next/navigation";
import Link from "next/link";
import { games, isDifficulty, isGame } from "../../../lib/catalog";
import { fixturesEnabled, reviewedPlayEnabled } from "../../../lib/config";
import { recentPuzzleDates } from "../../../lib/calendar";
import { archiveGames, readyGames } from "../../../lib/reviewed-play";
import { Player } from "../../../components/player";

export const dynamic = "force-dynamic";

export default async function Play({ params, searchParams }: {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ level?: string; mode?: string; date?: string }>;
}) {
  const { game } = await params;
  if (!isGame(game)) notFound();
  const query = await searchParams;
  const level = typeof query.level === "string" && isDifficulty(query.level) ? query.level : "beginner";
  const mode = query.mode === "practice" || query.mode === "archive" ? query.mode : "daily";
  const date = mode === "archive" ? query.date : undefined;
  if (mode === "archive" && (!date || !recentPuzzleDates().includes(date))) notFound();

  const demo = !reviewedPlayEnabled() && fixturesEnabled();
  if (!demo) {
    const available = mode === "archive" ? (await archiveGames(level)).some((row) => row.game === game && row.date === date)
      : (await readyGames(level)).includes(game);
    if (!available) notFound();
  }

  return <section className="play">
    <Link href={mode === "archive" ? `/archive?level=${level}` : `/?mode=${mode}&level=${level}`}>← {mode === "archive" ? "Archive" : "All puzzles"}</Link>
    <p className="eyebrow play-label">{mode} / {level}</p>
    <h1>{games[game].name}</h1>
    <Player key={`${game}:${level}:${mode}:${date}`} game={game} level={level} mode={mode} date={date} demo={demo} />
  </section>;
}
