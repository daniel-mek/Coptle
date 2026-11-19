import { NextRequest, NextResponse } from "next/server";
import { reviewedPlayEnabled } from "../../../lib/config";
import { uuidPattern } from "../../../lib/identifiers";
import { playerError, privateHeaders, readPlayerJson, validatePlayerRequest } from "../../../lib/player-request";
import { reportCategories } from "../../../lib/report-categories";
import { reviewedGuestCookie, submitReviewedReport } from "../../../lib/reviewed-play";

export async function POST(request: NextRequest) {
  if (!reviewedPlayEnabled()) return playerError("Reporting is available for reviewed puzzles.", 404);
  const invalid = validatePlayerRequest(request);
  if (invalid) return invalid;
  const body = await readPlayerJson(request, 8192);
  if (body instanceof Response) return body;
  const { boardId, category, details } = body;
  if (typeof boardId !== "string" || !uuidPattern.test(boardId) || typeof category !== "string"
    || !Object.hasOwn(reportCategories, category) || typeof details !== "string" || details.length > 1000
    || details.includes("\0")) return playerError("Choose a category and use at most 1,000 characters.", 400);
  try {
    const result = await submitReviewedReport(request.cookies.get(reviewedGuestCookie)?.value, boardId, category, details);
    if (result === "limited") return playerError("You have reached the daily reporting limit.", 429);
    if (result === "unavailable") return playerError("Open the puzzle in this browser before reporting it.", 404);
    return NextResponse.json({ repeated: result === "duplicate" }, { headers: privateHeaders });
  } catch {
    return playerError("The report could not be saved. Try again.", 503);
  }
}
