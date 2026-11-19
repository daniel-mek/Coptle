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
