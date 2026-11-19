import "server-only";
import words from "an-array-of-english-words";
import { practicePuzzles, saintPuzzles, versePuzzles, wordPuzzles, type Puzzle } from "../content/development";
import type { Board, Difficulty, Game, Guess, Mode } from "./catalog";
import { normalize, scoreWord } from "./scoring";

const dictionary = new Set(words);
const libraries = { word: wordPuzzles, saintle: saintPuzzles, versele: versePuzzles };
const saints = [
  ...Object.values(saintPuzzles).flat(),
  ...Object.values(practicePuzzles).map(({ saintle }) => saintle).filter((puzzle) => puzzle.game === "saintle"),
];
const knownWords = new Set([...Object.values(wordPuzzles).flat().map(({ answer }) => answer),
  ...Object.values(practicePuzzles).map(({ word }) => word.answer)]);

export type FixtureSnapshot = { puzzle: Puzzle; saintDirectory?: typeof saints };
export class InvalidGuess extends Error {}

export function fixtureFor(game: Game, level: Difficulty, mode: Mode, date: string): FixtureSnapshot {
  const index = Math.floor(Date.parse(date) / 86_400_000) % 2;
  const puzzle = mode === "practice" ? practicePuzzles[level][game] : libraries[game][level][index];
  return puzzle.game === "saintle" ? { puzzle, saintDirectory: saints } : { puzzle };
}

export function initialBoard({ puzzle, saintDirectory }: FixtureSnapshot, date: string): Board {
  return {
    id: crypto.randomUUID(),
    date,
    attempts: puzzle.game === "versele" ? 3 : 6,
    guesses: [],
    outcome: "playing",
    prompt: puzzle.game === "word" ? "Find the hidden word." : puzzle.game === "saintle"
      ? "Guess a saint to learn whether their region and vocation match."
      : puzzle.prompt,
    options: puzzle.game === "saintle" ? saintDirectory?.map((saint) => saint.answer).sort()
      : puzzle.game === "versele" ? puzzle.options : undefined,
    length: puzzle.game === "word" ? puzzle.answer.length : undefined,
  };
}

export function scoreFixtureGuess({ puzzle, saintDirectory }: FixtureSnapshot, board: Board, raw: string): Board {
  if (board.outcome !== "playing") throw new InvalidGuess("This puzzle is finished.");
  const input = normalize(raw);
  let correct = input === normalize(puzzle.answer);
  let guess: Guess;
  if (puzzle.game === "word") {
    if (input.length !== puzzle.answer.length || !/^[a-z]+$/.test(input)) {
      throw new InvalidGuess(`Enter a ${puzzle.answer.length}-letter word.`);
    }
    if (!dictionary.has(input) && !knownWords.has(input) && !correct) {
      throw new InvalidGuess("That word is outside the development dictionary.");
    }
    guess = { input, marks: scoreWord(puzzle.answer, input) };
  } else if (puzzle.game === "saintle") {
    const saint = saintDirectory?.find((entry) => [normalize(entry.answer), ...entry.aliases].includes(input));
    if (!saint) throw new InvalidGuess("Choose a saint from the list.");
    correct = normalize(saint.answer) === normalize(puzzle.answer);
    guess = {
      input: saint.answer,
      marks: [saint.region === puzzle.region ? "correct" : "absent", saint.vocation === puzzle.vocation ? "correct" : "absent"],
      details: [`Region: ${saint.region}`, `Vocation: ${saint.vocation}`],
    };
  } else {
    if (!input || (puzzle.options && !puzzle.options.some((option) => normalize(option) === input))) {
      throw new InvalidGuess("Enter or select an answer.");
    }
    guess = { input: raw.trim(), marks: [correct ? "correct" : "absent"] };
  }

  if (board.guesses.some((previous) => normalize(previous.input) === normalize(guess.input))) {
    throw new InvalidGuess("You already tried that answer.");
  }
  const guesses = [...board.guesses, guess];
  const outcome = correct ? "won" : guesses.length === board.attempts ? "lost" : "playing";
  return {
    ...board, guesses, outcome,
    ...(outcome === "playing" ? {} : { answer: puzzle.answer, explanation: puzzle.explanation, reference: puzzle.reference }),
  };
}
