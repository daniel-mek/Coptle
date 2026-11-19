export const games = {
  word: { name: "The Word", label: "Word deduction", description: "Find the hidden word in six guesses.", mark: "Aa" },
  saintle: { name: "Saintle", label: "Saint identification", description: "Follow the clues to identify a saint.", mark: "✧" },
  versele: { name: "Versele", label: "Scripture clues", description: "Find the passage behind the clue.", mark: "§" },
} as const;

export const difficulties = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof difficulties)[number];
export type Game = keyof typeof games;
export type Mode = "daily" | "practice" | "archive";
export type Mark = "correct" | "present" | "absent";
export type Guess = { input: string; marks: Mark[]; details?: string[] };
export type Board = {
  id: string;
  date: string;
  prompt: string;
  attempts: number;
  options?: string[];
  length?: number;
  guesses: Guess[];
  outcome: "playing" | "won" | "lost";
  answer?: string;
  explanation?: string;
  reference?: string;
};

export function isGame(value: string): value is Game {
  return Object.hasOwn(games, value);
}

export function isDifficulty(value: string): value is Difficulty {
  return difficulties.some((level) => level === value);
}
