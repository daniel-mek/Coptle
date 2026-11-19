import "server-only";
import type { Board, Difficulty, Game, Mode } from "./catalog";
import { fixtureFor, initialBoard, type FixtureSnapshot } from "./puzzles";
import { recentPuzzleDates } from "./calendar";

type Session = { board: Board; date: string; snapshot: FixtureSnapshot; lastMutation?: string };
export type Guest = { sessions: Record<string, Session>; expires: number; mutations: number; window: number };

export const guestLifetime = 30 * 24 * 60 * 60 * 1000;

export function newGuest(now: number): Guest {
  return { sessions: {}, expires: now + guestLifetime, mutations: 0, window: now };
}

export function allowMutation(guest: Guest) {
  const now = Date.now();
  if (now - guest.window >= 60_000) {
    guest.window = now;
    guest.mutations = 0;
  }
  if (guest.mutations >= 60) return false;
  guest.mutations++;
  return true;
}

export function fetchSession(guest: Guest, game: Game, level: Difficulty, mode: Mode, date: string, today: string) {
  if (mode === "archive") {
    const recent = new Set(recentPuzzleDates(today));
    for (const key of Object.keys(guest.sessions)) {
      if (key.startsWith("archive:") && !recent.has(key.slice(-10))) delete guest.sessions[key];
    }
  }
  const key = mode === "archive" ? `${mode}:${game}:${level}:${date}` : `${mode}:${game}:${level}`;
  let session = guest.sessions[key];
  if (!session?.snapshot || (mode === "daily" && session.date !== date)) {
    session = newSession(game, level, mode, date);
    guest.sessions[key] = session;
  }
  return { key, session };
}

export function newSession(game: Game, level: Difficulty, mode: Mode, date: string): Session {
  const snapshot = fixtureFor(game, level, mode, date);
  return { board: initialBoard(snapshot, date), date, snapshot };
}
