import type { Mark } from "./catalog";

export function scoreWord(answer: string, guess: string): Mark[] {
  const score: Mark[] = Array.from(answer, () => "absent");
  const remaining = new Map<string, number>();

  for (const [index, letter] of [...answer].entries()) {
    if (letter === guess[index]) score[index] = "correct";
    else remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
  }

  for (const [index, letter] of [...guess].entries()) {
    const count = remaining.get(letter) ?? 0;
    if (score[index] !== "correct" && count > 0) {
      score[index] = "present";
      remaining.set(letter, count - 1);
    }
  }

  return score;
}

export function normalize(input: string) {
  return input.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}
