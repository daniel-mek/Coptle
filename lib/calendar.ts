export const dailyTimeZone = "America/New_York";

const dateParts = new Intl.DateTimeFormat("en", {
  timeZone: dailyTimeZone, year: "numeric", month: "2-digit", day: "2-digit",
});

export function puzzleDate(now: Date = new Date()) {
  const parts = Object.fromEntries(dateParts.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function recentPuzzleDates(today = puzzleDate()) {
  const day = Date.parse(today + "T00:00:00Z");
  return Array.from({ length: 7 }, (_, index) =>
    new Date(day - (index + 1) * 86_400_000).toISOString().slice(0, 10),
  );
}

export function nextPuzzleReset(now: Date = new Date()): number {
  const date = puzzleDate(now);
  let low = now.getTime();
  let high = low + 26 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = low + Math.floor((high - low) / 2);
    if (puzzleDate(new Date(middle)) === date) low = middle;
    else high = middle;
  }
  return high;
}
