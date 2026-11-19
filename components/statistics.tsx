"use client";

import { useEffect, useState } from "react";
import { difficulties, games, isDifficulty, isGame, type Game, type Difficulty } from "../lib/catalog";

import { puzzleDate } from "../lib/calendar";
import { dailyResultNamespace, summarizeDaily, type DailyRecord } from "../lib/daily-stats";

type Result = DailyRecord & { game: Game; level: Difficulty };

export function Statistics({ reviewed }: { reviewed: boolean }) {
  const [results, setResults] = useState<Result[]>();
  const [level, setLevel] = useState<Difficulty>("beginner");
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const records: Result[] = [];
      try {
        for (const key of Object.keys(localStorage)) {
          const [namespace, kind, game, difficulty, date] = key.split(":");
          if (namespace !== dailyResultNamespace(reviewed) || kind !== "result" || !game || !isGame(game) || !difficulty || !isDifficulty(difficulty) || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) continue;
          const result = localStorage.getItem(key);
          if (result === "won" || result === "lost") records.push({ game, level: difficulty, date, won: result === "won" });
        }
      } catch {
        return;
      }
      setResults(records);
    });
    return () => { active = false; };
  }, [reviewed]);

  return <section className="play"><h1>Statistics</h1>
    <p>Daily results on this device.</p>
    <label>Difficulty <select value={level} onChange={(event) => {
      if (isDifficulty(event.target.value)) setLevel(event.target.value);
    }}>{difficulties.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    {results && <ul>{Object.entries(games).map(([id, game]) => {
      const played = results.filter((result) => result.game === id && result.level === level);
      const summary = summarizeDaily(played, puzzleDate());
      return <li key={id}>
        <strong>{game.name} · {summary.played} played · {summary.won} solved</strong>
        {summary.winRate !== null && <p>{summary.winRate}% solved · {summary.current}-day current streak · {summary.best}-day best streak</p>}
      </li>;
    })}</ul>}
  </section>;
}
