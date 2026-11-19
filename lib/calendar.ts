export const dailyTimeZone = "America/New_York";

const dateParts = new Intl.DateTimeFormat("en", {
  timeZone: dailyTimeZone, year: "numeric", month: "2-digit", day: "2-digit",
});

export function puzzleDate(now: Date = new Date()) {
  const parts = Object.fromEntries(dateParts.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
