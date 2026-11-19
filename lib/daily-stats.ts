const dayMs = 86_400_000;
export type DailyRecord = { date: string; won: boolean };

export function summarizeDaily(records: DailyRecord[], today: string) {
  const wins = records.filter(({ won }) => won).map(({ date }) => Date.parse(date)).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous: number | undefined;
  for (const date of wins) {
    run = previous !== undefined && date - previous === dayMs ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  const todayMs = Date.parse(today);
  const playedToday = records.some((record) => record.date === today);
  const current = previous === todayMs || (!playedToday && previous === todayMs - dayMs) ? run : 0;
  return {
    played: records.length, won: wins.length,
    winRate: records.length ? Math.round(wins.length / records.length * 100) : null,
    current, best,
  };
}
