import "server-only";
import { createHash } from "node:crypto";
import postgres from "postgres";
import { boardRevision, type Board, type Difficulty, type Game, type Mode, type PlayMutation } from "./catalog";
import { guestLifetime } from "./fixture-sessions";
import { reviewedPlayEnabled } from "./config";
import { applyPuzzleMove, initialBoard, InvalidGuess, type FixtureSnapshot } from "./puzzles";

let database: ReturnType<typeof postgres> | undefined;
function connection() {
  const url = process.env.COPTLE_PLAY_DATABASE_URL;
  if (!url) throw new Error("COPTLE_PLAY_DATABASE_URL is required for reviewed play");
  return database ??= postgres(url, { max: 3, prepare: false, connect_timeout: 5, idle_timeout: 20 });
}

async function readAvailability<T>(work: () => Promise<T>, fallback: T) {
  if (!reviewedPlayEnabled()) return fallback;
  try { return await work(); }
  catch {
    console.error("Reviewed puzzle availability could not be loaded");
    return fallback;
  }
}

export function readyGames(level: Difficulty) {
  return readAvailability(async () => {
    const rows = await connection()<{ game: Game }[]>`select game from coptle.play_ready() where difficulty = ${level}`;
    return rows.map(({ game }) => game);
  }, []);
}

export function archiveGames(level: Difficulty) {
  return readAvailability<{ game: Game; date: string }[]>(() => connection()<{ game: Game; date: string }[]>`
    select game, puzzle_date::text as date from coptle.play_archive(${level})
  `, []);
}

type Row = { version_id: string; payload: Record<string, unknown>; citation: string };
function text(value: unknown, limit: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > limit) throw new Error("Invalid reviewed puzzle field");
  return value.trim();
}

function list(value: unknown, max: number): string[] {
  if (!Array.isArray(value) || value.length > max) throw new Error("Invalid reviewed puzzle list");
  return value.map((item) => text(item, 120));
}

function snapshot(game: Game, { payload, citation }: Row): FixtureSnapshot {
  const answer = text(payload.answer, 120);
  const source = { explanation: text(payload.explanation, 4000), reference: text(citation, 500) };
  const aliases = list(payload.aliases, 20);
  if (game === "word") return { puzzle: { ...source, game, answer: answer.toLowerCase() } };
  if (game === "versele") return { aliases, puzzle: {
    ...source, game, answer, prompt: text(payload.prompt, 1000),
    options: payload.options === undefined ? undefined : list(payload.options, 6),
  } };
  if (!Array.isArray(payload.candidates) || payload.candidates.length > 20) throw new Error("Invalid saint candidates");
  const candidates = payload.candidates.map((candidate: unknown) => {
    if (!candidate || typeof candidate !== "object") throw new Error("Invalid saint candidate");
    const item = candidate as Record<string, unknown>;
    return { ...source, game, answer: text(item.answer, 120), region: text(item.region, 120),
      vocation: text(item.vocation, 120), aliases: list(item.aliases ?? [], 20) };
  });
  return { puzzle: { ...source, game, answer, aliases, region: text(payload.region, 120), vocation: text(payload.vocation, 120) },
    saintDirectory: candidates.map((candidate) => candidate.answer.toLowerCase() === answer.toLowerCase()
      ? { ...candidate, aliases: [...candidate.aliases, ...aliases] } : candidate) };
}

type Request = {
  game: Game; level: Difficulty; mode: Mode; date: string; action: "load" | PlayMutation;
  cookie?: string; id?: unknown; mutation?: unknown; revision?: unknown; guess?: unknown;
};
type Reply = { board: Board; token?: string } | { error: string; status: number };
const unavailable = { error: "That reviewed puzzle is unavailable.", status: 404 };
const stale = { error: "Progress changed. Reload to continue.", status: 409 };
const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function playReviewed(input: Request): Promise<Reply> {
  const { game, level, mode, date, action } = input;
  return connection().begin(async (sql) => {
    await sql`select set_config('statement_timeout', '5000', true)`;
    const slot = mode === "practice" ? "practice" : date;
    let key = input.cookie && uuid.test(input.cookie) ? hash(input.cookie) : null;
    const [guest] = key ? await sql`select * from coptle.play_guests
      where token_hash = ${key} and expires_at > now() for update` : [];
    if (!guest && action !== "load") return stale;
    const [session] = guest && key ? await sql<{ board: Board; version_id: string; last_mutation: string | null }[]>`
      select board, version_id, last_mutation from coptle.play_sessions
      where token_hash = ${key} and game = ${game} and difficulty = ${level} and mode = ${mode} and slot = ${slot}
    ` : [];
    if (!session && action !== "load") return stale;
    const [puzzle] = await sql<Row[]>`
      select * from coptle.play_pick(${game}, ${level}, ${mode}, ${date}::date, ${session ? key : null}::text, null)
    `;
    if (!puzzle) return unavailable;
    if (session && (action === "load" || input.mutation === session.last_mutation)) return { board: session.board };
    if (session && (input.id !== session.board.id || input.revision !== boardRevision(session.board))) return stale;
    if (session && key) {
      const updated = await sql`update coptle.play_guests set
        window_started = case when window_started <= now() - interval '1 minute' then now() else window_started end,
        mutations = case when window_started <= now() - interval '1 minute' then 1 else mutations + 1 end
        where token_hash = ${key} and (window_started <= now() - interval '1 minute' or mutations < 60)
        returning token_hash`;
      if (!updated.length) return { error: "Too many attempts. Try again in a minute.", status: 429 };
    }
    let board: Board;
    let version = puzzle.version_id;
    if (session && action !== "load" && action !== "restart") {
      if (session.board.outcome !== "playing") return { error: "This puzzle is finished.", status: 409 };
      try { board = applyPuzzleMove(snapshot(game, puzzle), session.board, action, input.guess); }
      catch (cause) {
        if (cause instanceof InvalidGuess) return { error: cause.message, status: 422 };
        throw cause;
      }
    } else if (session && action === "restart") {
      if (session.board.outcome === "playing") return { error: "Finish this practice puzzle first.", status: 409 };
      const [next] = await sql<Row[]>`select * from coptle.play_pick(${game}, ${level}, 'practice', ${date}::date, null, ${version}::uuid)`;
      if (!next) return unavailable;
      version = next.version_id;
      board = initialBoard(snapshot(game, next), date);
    } else {
      board = initialBoard(snapshot(game, puzzle), date);
    }
    let token: string | undefined;
    if (!guest || !key) {
      token = crypto.randomUUID();
      key = hash(token);
      await sql`insert into coptle.play_guests (token_hash, expires_at)
        values (${key}, ${new Date(Date.now() + guestLifetime)})`;
    }
    const mutation = typeof input.mutation === "string" ? input.mutation : null;
    await sql`insert into coptle.play_sessions (token_hash, game, difficulty, mode, slot, version_id, board, last_mutation)
      values (${key}, ${game}, ${level}, ${mode}, ${slot}, ${version}, ${sql.json(JSON.parse(JSON.stringify(board)))}, ${mutation})
      on conflict (token_hash, game, difficulty, mode, slot) do update set
        version_id = excluded.version_id, board = excluded.board, last_mutation = excluded.last_mutation`;
    return { board, token };
  });
}
