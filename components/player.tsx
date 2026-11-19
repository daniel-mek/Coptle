"use client";

import { useEffect, useState } from "react";
import { games, type Board, type Difficulty, type Game, type Mode } from "../lib/catalog";

async function play(game: Game, level: Difficulty, mode: Mode, guesses: string[], id?: string): Promise<Board> {
  const response = await fetch("/api/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game, level, mode, id, guesses }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}

export function Player({ game, level, mode }: { game: Game; level: Difficulty; mode: Mode }) {
  const [board, setBoard] = useState<Board>();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  const key = `coptle:progress:${game}:${level}:${mode}`;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const fresh = await play(game, level, mode, []);
        const saved = JSON.parse(localStorage.getItem(key) ?? "null") as { id: string; guesses: string[] } | null;
        let restored = fresh;
        if (saved && (mode === "practice" || saved.id === fresh.id)) {
          restored = await play(game, level, mode, saved.guesses, saved.id).catch(() => fresh);
        }
        if (active) setBoard(restored);
      } catch {
        if (active) setMessage("The puzzle could not load. Reload the page to try again.");
      } finally {
        if (active) setBusy(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [game, level, mode, key]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!board || busy || !input.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const guesses = [...board.guesses.map((guess) => guess.input), input];
      const result = await play(game, level, mode, guesses, board.id);
      setBoard(result);
      setInput("");
      try {
        localStorage.setItem(key, JSON.stringify({ id: result.id, guesses }));
        if (mode === "daily" && result.outcome !== "playing") {
          localStorage.setItem(`coptle:result:${game}:${level}:${result.id}`, result.outcome);
        }
      } catch {
        setMessage("Progress could not be saved on this device.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The guess could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  async function restart() {
    setBusy(true);
    setMessage("");
    try {
      setBoard(await play(game, level, mode, []));
      localStorage.removeItem(key);
    } catch {
      setMessage("Practice could not restart. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function share(result: Board) {
    const symbols = { correct: "🟩", present: "🟨", absent: "⬜" };
    const rows = result.guesses.map((guess) => guess.marks.map((mark) => symbols[mark]).join("")).join("\n");
    try {
      await navigator.clipboard.writeText(`Coptle · ${games[game].name} · ${level} · ${result.outcome === "won" ? result.guesses.length : "–"}/${result.attempts}\n${rows}`);
      setMessage("Copied a spoiler-free result.");
    } catch {
      setMessage("Clipboard access is unavailable.");
    }
  }

  if (!board) return <p role="status">{message || "Loading puzzle…"}</p>;
  return <>
    <p>{board.prompt}</p>
    <p role="status">{board.guesses.length} of {board.attempts} guesses used</p>
    <ol className="guesses">
      {board.guesses.map((guess, index) => <li key={index}>
        {game !== "word" && <strong>{guess.input}</strong>}
        <div className="marks">{guess.marks.map((mark, cell) => {
          const label = guess.details?.[cell] ?? (game === "word" ? guess.input[cell].toUpperCase() : guess.input);
          return <span key={cell} className={`tile ${mark}`} aria-label={`${label}: ${mark}`}>{label} <small aria-hidden="true">{mark === "correct" ? "✓" : mark === "present" ? "•" : "×"}</small></span>;
        })}</div>
      </li>)}
    </ol>
    {board.outcome === "playing" ? <form onSubmit={submit}>
      <label htmlFor="guess">Your guess</label>
      <div className="guess-form">
        {board.options && game === "versele" ? <select id="guess" value={input} onChange={(event) => setInput(event.target.value)}>
          <option value="">Choose an answer</option>
          {board.options.map((option) => <option key={option}>{option}</option>)}
        </select> : <input id="guess" autoComplete="off" maxLength={board.length ?? 120} list={game === "saintle" ? "saints" : undefined}
          value={input} onChange={(event) => setInput(event.target.value)} />}
        {game === "saintle" && <datalist id="saints">{board.options?.map((option) => <option key={option} value={option} />)}</datalist>}
        <button className="button" disabled={busy || !input.trim()}>Guess</button>
      </div>
      {game === "word" && <div className="keyboard" aria-label="On-screen keyboard">
        {["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"].map((row) => <div key={row} className="keys">
          {[...row].map((letter) => {
            const marks = board.guesses.flatMap((guess) => guess.marks.filter((_, index) => guess.input[index].toUpperCase() === letter));
            const mark = (["correct", "present", "absent"] as const).find((candidate) => marks.includes(candidate));
            return <button key={letter} type="button" className={mark} aria-label={mark ? `${letter}: ${mark}` : letter}
              disabled={busy} onClick={() => setInput((current) => (current + letter).slice(0, board.length))}>{letter}</button>;
          })}
        </div>)}
        <button type="button" disabled={busy} onClick={() => setInput((current) => current.slice(0, -1))}>Delete</button>
      </div>}
    </form> : <section className="result">
      <h2>{board.outcome === "won" ? "Solved!" : "Puzzle complete"}</h2>
      <p><strong>{board.answer}</strong></p><p>{board.explanation}</p><p className="reference">{board.reference}</p>
      <button className="button" onClick={() => void share(board)}>Copy result</button>
      {mode === "practice" && <button className="button secondary" disabled={busy} onClick={() => void restart()}>Play again</button>}
    </section>}
    <p role="status">{message}</p>
  </>;
}
