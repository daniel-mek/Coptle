import { isDifficulty, isGame } from "../../../lib/catalog";
import { fixturesEnabled } from "../../../lib/config";
import { puzzleDate } from "../../../lib/calendar";
import { buildBoard, practiceId } from "../../../lib/puzzles";

export async function POST(request: Request) {
  if (!fixturesEnabled()) return Response.json({ error: "Puzzles are awaiting review." }, { status: 404 });
  const raw = await request.text();
  if (raw.length > 2048) return Response.json({ error: "Request is too large." }, { status: 413 });
  try {
    const { game, level, mode, id, guesses } = JSON.parse(raw);
    if (typeof game !== "string" || !isGame(game) || typeof level !== "string" || !isDifficulty(level)
      || (mode !== "daily" && mode !== "practice") || !Array.isArray(guesses)
      || guesses.length > 6 || !guesses.every((guess) => typeof guess === "string" && guess.length <= 120)) {
      return Response.json({ error: "Invalid play request." }, { status: 400 });
    }
    const today = puzzleDate();
    const prefix = practiceId(today);
    const practice = typeof id === "string" && /^[01]\.[a-f0-9-]{36}$/.test(id) && id.startsWith(prefix + ".")
      ? id : `${prefix}.${crypto.randomUUID()}`;
    const active = mode === "daily" ? today : practice;
    if (guesses.length && id !== active) return Response.json({ error: "A new puzzle is available. Reload to continue." }, { status: 409 });
    return Response.json(buildBoard(game, level, mode, active, guesses), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 });
  }
}
