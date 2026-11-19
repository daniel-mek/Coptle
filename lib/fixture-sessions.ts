import "server-only";
import type { Board, Difficulty, Game, Mode } from "./catalog";
import { buildBoard } from "./puzzles";

type Session = { board: Board; date: string; lastMutation?: string };
type Guest = { sessions: Map<string, Session>; expires: number; mutations: number; window: number };

const lifetime = 2 * 24 * 60 * 60 * 1000;
const guests = new Map<string, Guest>();
const maxGuests = 2_000;

export function fetchGuest(cookie: string | undefined, create: boolean) {
  const now = Date.now();
  const known = cookie && guests.get(cookie);
  if (known && known.expires > now) return { guest: known };
  if (!create) return null;
  if (guests.size >= maxGuests) {
    for (const [key, guest] of guests) if (guest.expires <= now) guests.delete(key);
    if (guests.size >= maxGuests) return null;
  }
  const token = crypto.randomUUID();
  const guest: Guest = { sessions: new Map(), expires: now + lifetime, mutations: 0, window: now };
  guests.set(token, guest);
  return { guest, token };
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

export function fetchSession(guest: Guest, game: Game, level: Difficulty, mode: Mode, date: string) {
  const key = `${game}:${level}:${mode}`;
  let session = guest.sessions.get(key);
  if (!session || (mode === "daily" && session.date !== date)) {
    session = newSession(game, level, mode, date);
    guest.sessions.set(key, session);
  }
  return { key, session };
}

export function newSession(game: Game, level: Difficulty, mode: Mode, date: string): Session {
  return { board: buildBoard(game, level, mode, crypto.randomUUID(), date, []), date };
}
