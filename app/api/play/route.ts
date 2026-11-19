import { NextRequest, NextResponse } from "next/server";
import { boardRevision, isDifficulty, isGame } from "../../../lib/catalog";
import { fixturesEnabled, reviewedPlayEnabled } from "../../../lib/config";
import { puzzleDate, recentPuzzleDates } from "../../../lib/calendar";
import { allowMutation, fetchSession, guestLifetime, newSession } from "../../../lib/fixture-sessions";
import { withFixtureGuest } from "../../../lib/fixture-store";
import { applyPuzzleMove, InvalidGuess } from "../../../lib/puzzles";

import { playReviewed, reviewedGuestCookie } from "../../../lib/reviewed-play";
import { playerError as error, playerProtocol, privateHeaders as headers, readPlayerJson, validatePlayerRequest } from "../../../lib/player-request";
import { uuidPattern } from "../../../lib/identifiers";

export async function POST(request: NextRequest) {
  const reviewed = reviewedPlayEnabled();
  const cookieName = reviewed ? reviewedGuestCookie : "coptle_fixture_guest";
  if (!reviewed && !fixturesEnabled()) return error("Puzzles are awaiting review.", 404);
  const invalidRequest = validatePlayerRequest(request);
  if (invalidRequest) return invalidRequest;
  const protocol = playerProtocol(request);
  const body = await readPlayerJson(request);
  if (body instanceof Response) return body;
  const { game, level, mode, action, id, guess, revision, mutation, date } = body;
  if (typeof game !== "string" || !isGame(game) || typeof level !== "string" || !isDifficulty(level)
    || (mode !== "daily" && mode !== "practice" && mode !== "archive") || (action !== "load" && action !== "guess" && action !== "restart" && action !== "hint" && action !== "forfeit")) {
    return error("Invalid play request.", 400);
  }
  if (action !== "load" && (typeof id !== "string" || !uuidPattern.test(id) || typeof revision !== "number"
    || !Number.isInteger(revision) || revision < 0 || revision > 8
    || typeof mutation !== "string" || !uuidPattern.test(mutation))) {
    return error("Invalid session revision.", 400);
  }
  if (action === "guess" && (typeof guess !== "string" || !guess.trim() || guess.length > 120)) {
    return error("Enter a guess of 1 to 120 characters.", 400);
  }
  if (action === "restart" && mode !== "practice") return error("Only practice puzzles can be restarted.", 403);
  const today = puzzleDate();
  if (mode === "archive" && (typeof date !== "string" || !recentPuzzleDates(today).includes(date))) {
    return error("That archive date is unavailable.", 404);
  }
  const selectedDate = mode === "archive" ? date as string : today;
  try {
    if (reviewed) {
      const result = await playReviewed({ game, level, mode, date: selectedDate, action, id, guess, revision, mutation,
        cookie: request.cookies.get(cookieName)?.value });
      if ("error" in result) return error(result.error, result.status);
      const response = NextResponse.json(result.board, { headers });
      if (result.token) response.cookies.set(cookieName, result.token, {
        httpOnly: true, sameSite: "lax", path: "/", maxAge: guestLifetime / 1000, secure: protocol === "https:",
      });
      return response;
    }
    const identity = await withFixtureGuest(request.cookies.get(cookieName)?.value, action === "load", (guest) => {
      const { key, session } = fetchSession(guest, game, level, mode, selectedDate, today);
      let board = session.board;
      if (action !== "load" && session.lastMutation !== mutation) {
        if (id !== board.id || revision !== boardRevision(board)) return error("Progress changed. Reload to continue.", 409);
        if (!allowMutation(guest)) return error("Too many attempts. Try again in a minute.", 429);
        if (board.outcome === "playing" && action === "restart") return error("Finish this practice puzzle first.", 409);
        if (board.outcome !== "playing" && action !== "restart") return error("This puzzle is finished.", 409);
        if (action === "restart") {
          const replacement = newSession(game, level, mode, session.date);
          replacement.lastMutation = mutation as string;
          guest.sessions[key] = replacement;
          board = replacement.board;
        } else {
          try {
            board = applyPuzzleMove(session.snapshot, board, action, guess);
            session.board = board;
            session.lastMutation = mutation as string;
          } catch (cause) {
            if (cause instanceof InvalidGuess) return error(cause.message, 422);
            console.error("Could not score fixture play", cause);
            return error("Could not score the guess.", 500);
          }
        }
      }
      return board;
    });
    if (!identity) return action === "load"
      ? error("Too many development guests. Try again later.", 503)
      : error("This session expired. Reload to play.", 409);
    if (identity.result instanceof Response) return identity.result;
    const response = NextResponse.json(identity.result, { headers });
    if (identity.token) response.cookies.set(cookieName, identity.token, {
      httpOnly: true, sameSite: "lax", path: "/", maxAge: guestLifetime / 1000,
      secure: protocol === "https:",
    });
    return response;
  } catch (cause) {
    console.error("Puzzle storage failed", cause instanceof Error ? cause.name : "Unknown error");
    return error("Puzzle storage is temporarily unavailable.", 503);
  }
}
