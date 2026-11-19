import { expect, test } from "vitest";
import { puzzleDate } from "../lib/calendar";

test.each([
  ["2026-03-08T04:59:59Z", "2026-03-07"],
  ["2026-03-08T05:00:00Z", "2026-03-08"],
  ["2026-11-01T03:59:59Z", "2026-10-31"],
  ["2026-11-01T04:00:00Z", "2026-11-01"],
])("uses the local New York date at %s", (instant, expected) => {
  expect(puzzleDate(new Date(instant))).toBe(expected);
});

test("archive dates cross daylight savings and month boundaries as calendar days", async () => {
  const { recentPuzzleDates } = await import("../lib/calendar");
  expect(recentPuzzleDates("2026-11-02")).toEqual([
    "2026-11-01", "2026-10-31", "2026-10-30", "2026-10-29", "2026-10-28", "2026-10-27", "2026-10-26",
  ]);
});
