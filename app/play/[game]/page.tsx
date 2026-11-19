import { notFound } from "next/navigation";
import Link from "next/link";
import { games, isDifficulty, isGame } from "../../../lib/catalog";
import { fixturesEnabled } from "../../../lib/config";
import { Player } from "../../../components/player";

export const dynamic = "force-dynamic";

export default async function Play({ params, searchParams }: {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ level?: string; mode?: string }>;
}) {
  const { game } = await params;
  if (!isGame(game) || !fixturesEnabled()) notFound();
  const query = await searchParams;
  const level = typeof query.level === "string" && isDifficulty(query.level) ? query.level : "beginner";
  const mode = query.mode === "practice" ? "practice" : "daily";

  return <section className="play">
    <Link href={`/?mode=${mode}&level=${level}`}>← All puzzles</Link>
    <p className="eyebrow play-label">{mode} / {level}</p>
    <h1>{games[game].name}</h1>
    <Player key={`${game}:${level}:${mode}`} game={game} level={level} mode={mode} />
  </section>;
}
