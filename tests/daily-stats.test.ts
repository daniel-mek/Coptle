import { expect, test } from "vitest";
import { summarizeDaily } from "../lib/daily-stats";

test("keeps yesterday's streak until today's puzzle is played", () => {
  const records = [{ date: "2026-11-17", won: true }, { date: "2026-11-18", won: true }];
  expect(summarizeDaily(records, "2026-11-19")).toEqual({ played: 2, won: 2, winRate: 100, current: 2, best: 2 });
  expect(summarizeDaily([...records, { date: "2026-11-19", won: false }], "2026-11-19"))
    .toEqual({ played: 3, won: 2, winRate: 67, current: 0, best: 2 });
});
