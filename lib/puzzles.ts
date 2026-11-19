import "server-only";
import words from "an-array-of-english-words";
import { practicePuzzles, saintPuzzles, versePuzzles, wordPuzzles, type Puzzle } from "../content/development";
import type { Board, Difficulty, Game, Guess, Mode, PlayMutation } from "./catalog";
import { normalize, scoreWord } from "./scoring";

const dictionary = new Set(words);
const libraries = { word: wordPuzzles, saintle: saintPuzzles, versele: versePuzzles };
const saints = [
  ...Object.values(saintPuzzles).flat(),
  ...Object.values(practicePuzzles).map(({ saintle }) => saintle).filter((puzzle) => puzzle.game === "saintle"),
];
const knownWords = new Set([...Object.values(wordPuzzles).flat().map(({ answer }) => answer),
  ...Object.values(practicePuzzles).map(({ word }) => word.answer)]);

export type FixtureSnapshot = { puzzle: Puzzle; saintDirectory?: typeof saints; aliases?: string[] };
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

export function scoreFixtureGuess({ puzzle, saintDirectory, aliases }: FixtureSnapshot, board: Board, raw: string): Board {
  if (board.outcome !== "playing") throw new InvalidGuess("This puzzle is finished.");
  const input = normalize(raw);
  let correct = input === normalize(puzzle.answer) || Boolean(aliases?.some((alias) => normalize(alias) === input));
  let guess: Guess;
  if (puzzle.game === "word") {
    if (input.length !== puzzle.answer.length || !/^[a-z]+$/.test(input)) {
      throw new InvalidGuess(`Enter a ${puzzle.answer.length}-letter word.`);
    }
    if (!dictionary.has(input) && !knownWords.has(input) && !correct) {
      throw new InvalidGuess("That word is outside the puzzle dictionary.");
    }
    guess = { input, marks: scoreWord(puzzle.answer, input) };
  } else if (puzzle.game === "saintle") {
    const saint = saintDirectory?.find((entry) => [normalize(entry.answer), ...entry.aliases.map(normalize)].includes(input));
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

export function applyPuzzleMove(snapshot: FixtureSnapshot, board: Board, action: Exclude<PlayMutation, "restart">, guess: unknown): Board {
  const { puzzle } = snapshot;
  if (action === "guess") return scoreFixtureGuess(snapshot, board, guess as string);
  if (action === "forfeit") return {
    ...board, outcome: "lost", forfeited: true,
    answer: puzzle.answer, explanation: puzzle.explanation, reference: puzzle.reference,
  };
  if (board.hint) throw new InvalidGuess("You've already used the hint for this puzzle.");
  if (puzzle.game === "word") {
    const vowels = puzzle.answer.match(/[aeiou]/gi)?.length ?? 0;
    return { ...board, hint: `The answer contains ${vowels} vowel ${vowels === 1 ? "letter" : "letters"} (A, E, I, O, U).` };
  }
  if (puzzle.game === "saintle") return { ...board, hint: `Region: ${puzzle.region}` };
  const incorrect = puzzle.options?.length && puzzle.options.length > 2
    ? puzzle.options.find((option) => normalize(option) !== normalize(puzzle.answer)
      && !snapshot.aliases?.some((alias) => normalize(alias) === normalize(option))) : undefined;
  if (incorrect) return { ...board, hint: `You can rule out “${incorrect}.”` };
  const words = puzzle.answer.trim().split(/\s+/).length;
  return { ...board, hint: `The expected answer is ${words} ${words === 1 ? "word" : "words"} long.` };
}
