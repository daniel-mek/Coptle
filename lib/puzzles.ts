import "server-only";
import words from "an-array-of-english-words";
import { saintPuzzles, versePuzzles, wordPuzzles } from "../content/development";
import type { Board, Difficulty, Game, Guess, Mode } from "./catalog";
import { normalize, scoreWord } from "./scoring";

const dictionary = new Set(words);
const libraries = { word: wordPuzzles, saintle: saintPuzzles, versele: versePuzzles };
const saints = Object.values(saintPuzzles).flat();

export function practiceId(date: string) {
  return String(1 - dailyIndex(date));
}

function dailyIndex(date: string) {
  return Math.floor(Date.parse(date) / 86_400_000) % 2;
}

export function buildBoard(game: Game, level: Difficulty, mode: Mode, id: string, inputs: string[]): Board {
  const puzzle = libraries[game][level][mode === "daily" ? dailyIndex(id) : Number(id.split(".")[0])];
  const attempts = game === "versele" ? 3 : 6;
  const guesses: Guess[] = [];
  let outcome: Board["outcome"] = "playing";

  if (inputs.length > attempts) throw new Error("Too many attempts.");
  for (const raw of inputs) {
    if (outcome !== "playing") throw new Error("This puzzle is finished.");
    const input = normalize(raw);
    let correct = input === normalize(puzzle.answer);
    if (puzzle.game === "word") {
      if (input.length !== puzzle.answer.length || !/^[a-z]+$/.test(input)) {
        throw new Error(`Enter a ${puzzle.answer.length}-letter word.`);
      }
      const knownAnswer = Object.values(wordPuzzles).flat().some((word) => word.answer === input);
      if (!dictionary.has(input) && !knownAnswer) throw new Error("That word is outside the development dictionary.");
      guesses.push({ input, marks: scoreWord(puzzle.answer, input) });
    } else if (puzzle.game === "saintle") {
      const saint = saints.find((entry) => [normalize(entry.answer), ...entry.aliases].includes(input));
      if (!saint) throw new Error("Choose a saint from the list.");
      correct = saint === puzzle;
      guesses.push({
        input: saint.answer,
        marks: [saint.region === puzzle.region ? "correct" : "absent", saint.vocation === puzzle.vocation ? "correct" : "absent"],
        details: [`Region: ${saint.region}`, `Vocation: ${saint.vocation}`],
      });
    } else {
      if (!input || (puzzle.options && !puzzle.options.some((option) => normalize(option) === input))) {
        throw new Error("Enter or select an answer.");
      }
      guesses.push({ input: raw.trim(), marks: [correct ? "correct" : "absent"] });
    }
    if (correct) outcome = "won";
  }

  if (outcome === "playing" && guesses.length === attempts) outcome = "lost";
  const prompt = puzzle.game === "word" ? "Find the hidden word." : puzzle.game === "saintle"
    ? "Guess a saint to learn whether their region and vocation match."
    : puzzle.prompt;

  return {
    id, attempts, guesses, outcome, prompt,
    options: puzzle.game === "saintle" ? saints.map((saint) => saint.answer).sort() : puzzle.game === "versele" ? puzzle.options : undefined,
    length: puzzle.game === "word" ? puzzle.answer.length : undefined,
    ...(outcome === "playing" ? {} : { answer: puzzle.answer, explanation: puzzle.explanation, reference: puzzle.reference }),
  };
}
