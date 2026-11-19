"use client";

import { useEffect, useRef, useState } from "react";
import { games, type Board, type Difficulty, type Game, type Mode } from "../lib/catalog";

type Action = { action: "load" } | {
  action: "guess" | "restart";
  id: string;
  revision: number;
  mutation: string;
  guess?: string;
};

async function play(game: Game, level: Difficulty, mode: Mode, date: string | undefined, action: Action): Promise<Board> {
  const response = await fetch("/api/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game, level, mode, date, ...action }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}

export function Player({ game, level, mode, date }: { game: Game; level: Difficulty; mode: Mode; date?: string }) {
  const [board, setBoard] = useState<Board>();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  const requestInFlight = useRef(false);
  const guessField = useRef<HTMLInputElement>(null);
  const choiceField = useRef<HTMLSelectElement>(null);
  const loading = useRef<Promise<Board> | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loading.current ??= play(game, level, mode, date, { action: "load" });
    void loading.current.then((loaded) => {
      if (active) setBoard(loaded);
    }).catch(() => {
      if (active) setMessage("The puzzle could not load.");
    }).finally(() => {
      if (active) {
        loading.current = null;
        setBusy(false);
      }
    });
    return () => { active = false; };
  }, [game, level, mode, date, loadAttempt]);

  useEffect(() => {
    if (mode !== "daily" || !board || board.outcome === "playing") return;
    try {
      localStorage.setItem(`coptle:result:${game}:${level}:${board.date}`, board.outcome);
    } catch {
      // The current puzzle remains usable if browser storage is blocked.
    }
  }, [board, game, level, mode]);

  async function mutate(action: "guess" | "restart", guess?: string) {
    if (!board || requestInFlight.current) return;
    requestInFlight.current = true;
    setBusy(true);
    setMessage("");
    try {
      const result = await play(game, level, mode, date, {
        action, id: board.id, revision: board.guesses.length, mutation: crypto.randomUUID(), guess,
      });
      setBoard(result);
      setInput("");
      requestAnimationFrame(() => {
        if (result.outcome !== "playing") resultHeading.current?.focus();
        else (guessField.current ?? choiceField.current)?.focus();
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The puzzle could not be updated.");
    } finally {
      requestInFlight.current = false;
      setBusy(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy && input.trim()) void mutate("guess", input);
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

  if (!board) return <>
    <p role="status">{message || "Loading puzzle…"}</p>
    {!busy && <button className="button" onClick={() => {
      setBusy(true);
      setMessage("");
      setLoadAttempt((attempt) => attempt + 1);
    }}>Retry</button>}
  </>;
  return <>
    <p>{board.prompt}{board.length ? ` Enter ${board.length} letters.` : ""}</p>
    {mode === "practice" && <p className="notice">This development level has one practice puzzle and will repeat.</p>}
    {game === "word" && <p className="mark-key">✓ Correct position · • Elsewhere in the word · × Absent</p>}
    <p role="status">{board.guesses.length} of {board.attempts} guesses used</p>
    <ol className="guesses">
      {board.guesses.map((guess, index) => <li key={index}>
        {game !== "word" && <strong>{guess.input}</strong>}
        <div className={game === "word" ? "marks word-marks" : "marks"}>{guess.marks.map((mark, cell) => {
          const label = guess.details?.[cell] ?? (game === "word" ? guess.input[cell].toUpperCase() : guess.input);
          const feedback = game === "word"
            ? { correct: "correct position", present: "elsewhere in the word", absent: "absent" }[mark]
            : mark === "correct" ? "matches" : "does not match";
          return <span key={cell} className={`tile ${mark}`}>{label} <span className="sr-only">, {feedback}</span><small aria-hidden="true">{mark === "correct" ? "✓" : mark === "present" ? "•" : "×"}</small></span>;
        })}</div>
      </li>)}
    </ol>
    {board.outcome === "playing" ? <form onSubmit={submit}>
      <label htmlFor="guess">Your guess</label>
      <div className="guess-form">
        {board.options && game === "versele" ? <select id="guess" ref={choiceField} value={input} onChange={(event) => setInput(event.target.value)}>
          <option value="">Choose an answer</option>
          {board.options.map((option) => <option key={option}>{option}</option>)}
        </select> : <input id="guess" ref={guessField} autoComplete="off" spellCheck={false} autoCapitalize={game === "word" ? "characters" : "words"} maxLength={board.length ?? 120} list={game === "saintle" ? "saints" : undefined}
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
      <h2 ref={resultHeading} tabIndex={-1}>{board.outcome === "won" ? "Solved!" : "Puzzle complete"}</h2>
      <p><strong>{board.answer}</strong></p><p>{board.explanation}</p><p className="reference">{board.reference}</p>
      <button className="button" onClick={() => void share(board)}>Copy result</button>
      {mode === "practice" && <button className="button secondary" disabled={busy} onClick={() => void mutate("restart")}>Play again</button>}
    </section>}
    <p role="status">{message}</p>
  </>;
}
