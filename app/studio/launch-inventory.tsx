import { difficulties, games, type Difficulty, type Game } from "../../lib/catalog";

export type InventoryRow = {
  game: Game;
  difficulty: Difficulty;
  window_start: string;
  window_end: string;
  daily_ready: number;
  practice_ready: number;
  gaps: { date: string; reason: "missing" | "withdrawn" | "format" }[];
};

const labels = {
  missing: "No puzzle scheduled",
  withdrawn: "Puzzle withdrawn",
  format: "Puzzle format needs revision",
};

const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });
const label = (date: string) => formatter.format(new Date(date));

export function LaunchInventory({ rows }: { rows: InventoryRow[] }) {
  const first = rows[0];
  if (!first) return null;
  const ready = rows.filter((row) => row.gaps.length === 0 && row.practice_ready > 0).length;
  return <section aria-labelledby="launch-inventory">
    <h2 id="launch-inventory">Launch inventory</h2>
    <p><time dateTime={first.window_start}>{label(first.window_start)}</time> to{" "}
      <time dateTime={first.window_end}>{label(first.window_end)}</time> · New York puzzle dates</p>
    <p>{ready} of {rows.length} game and difficulty combinations meet the inventory requirement.</p>
    {Object.entries(games).map(([id, game]) => <div className="studio-inventory" key={id}>
      <h3>{game.name}</h3>
      {difficulties.map((difficulty) => {
        const row = rows.find((entry) => entry.game === id && entry.difficulty === difficulty);
        if (!row) return null;
        const total = row.daily_ready + row.gaps.length;
        return <details key={difficulty} className="studio-card">
          <summary><strong className="studio-difficulty">{difficulty}</strong> · {row.daily_ready}/{total} daily ·{" "}
            {row.practice_ready} eligible practice</summary>
          {!row.gaps.length && row.practice_ready > 0 ? <p>Inventory complete.</p> : <>
            {!row.practice_ready && <p>Add an approved practice puzzle with an answer separate from upcoming daily puzzles.</p>}
            {row.gaps.length > 0 && <ul>{row.gaps.map(({ date, reason }) => <li key={date}>
              <time dateTime={date}>{label(date)}</time> · {labels[reason]}
            </li>)}</ul>}
          </>}
        </details>;
      })}
    </div>)}
  </section>;
}
