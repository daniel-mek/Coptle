import { normalize } from "./scoring";
import { isDifficulty, isGame } from "./catalog";

export const uuidPattern = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
export const reviewStages = ["source", "theology", "gameplay"] as const;

export class StudioInputError extends Error {}

function field(form: FormData, key: string, limit: number, optional = false) {
  const raw = form.get(key);
  if (typeof raw !== "string" && !(optional && raw === null)) throw new StudioInputError("A required field is missing.");
  const value = typeof raw === "string" ? raw.trim() : "";
  if ((!optional && !value) || value.length > limit) throw new StudioInputError("Check the required fields and their length limits.");
  return value;
}

export function parseStudioAction(form: FormData) {
  const action = field(form, "intent", 20);
  if (action === "draft") {
    const puzzle = field(form, "puzzle", 36, true);
    const game = field(form, "game", 20);
    const difficulty = field(form, "difficulty", 20);
    const inventory = field(form, "inventory", 10);
    if ((puzzle && !uuidPattern.test(puzzle)) || !isGame(game) || !isDifficulty(difficulty)
      || (inventory !== "daily" && inventory !== "practice")) throw new StudioInputError("Choose a valid game, difficulty, and inventory.");

    const answer = field(form, "answer", 120);
    const aliases = field(form, "aliases", 1_600, true).split("\n").map((entry) => entry.trim()).filter(Boolean);
    if (aliases.length > 20 || aliases.some((entry) => entry.length > 120)) throw new StudioInputError("Use up to 20 short aliases.");
    const common = { answer, aliases, explanation: field(form, "explanation", 4_000) };
    const length = difficulty === "beginner" ? /^[a-z]{5}$/i
      : difficulty === "intermediate" ? /^[a-z]{6}$/i : /^[a-z]{7,9}$/i;
    if (game === "word" && !length.test(answer)) throw new StudioInputError("The Word answer length must match the difficulty.");
    const options = game === "versele"
      ? field(form, "options", 730, true).split("\n").map((entry) => entry.trim()).filter(Boolean) : [];
    if (game === "versele" && (options.length > 6 || (options.length > 0 || difficulty === "beginner")
      && (options.length < 2 || new Set(options.map(normalize)).size !== options.length
        || options.some((option) => option.length > 120) || !options.some((option) => normalize(option) === normalize(answer))))) {
      throw new StudioInputError("Provide two to six distinct Versele choices, including the answer.");
    }
    const region = game === "saintle" ? field(form, "region", 120) : "";
    const vocation = game === "saintle" ? field(form, "vocation", 120) : "";
    const candidates = game === "saintle" ? field(form, "candidates", 7400).split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const [answer, region, vocation, ...extra] = line.split("|").map((entry) => entry.trim());
      if (extra.length || !answer || !region || !vocation || [answer, region, vocation].some((entry) => entry.length > 120)) {
        throw new StudioInputError("Format each Saintle alternative as name | region | vocation.");
      }
      return { answer, region, vocation, aliases: [] };
    }) : [];
    const names = new Set([answer, ...candidates.map((entry) => entry.answer)].map(normalize));
    if (game === "saintle" && (candidates.length < 2 || candidates.length > 19 || names.size !== candidates.length + 1
      || aliases.some((alias) => candidates.some((candidate) => normalize(alias) === normalize(candidate.answer))))) {
      throw new StudioInputError("Provide two to nineteen distinct Saintle alternatives.");
    }
    const payload = game === "saintle" ? { ...common, region, vocation, candidates: [{ answer, region, vocation, aliases }, ...candidates] }
      : game === "versele" ? { ...common, prompt: field(form, "prompt", 1_000), ...(options.length ? { options } : {}) }
      : { ...common, answer: answer.toLowerCase() };
    return { action, puzzle: puzzle || null, game, difficulty, inventory, payload,
      category: field(form, "category", 100), citation: field(form, "citation", 500), license: field(form, "license", 300, true) || null } as const;
  }
  const version = field(form, "version", 36);
  if (!uuidPattern.test(version)) throw new StudioInputError("Select a valid puzzle version.");
  if (action === "review") {
    const stage = reviewStages.find((item) => item === form.get("stage"));
    const verdict = form.get("verdict");
    if (!stage || (verdict !== "approved" && verdict !== "rejected") || form.get("confirmed") !== "on") {
      throw new StudioInputError("Choose a decision and confirm you personally reviewed this version.");
    }
    return { action, stage, verdict, version } as const;
  }
  if (action === "schedule") {
    const date = field(form, "date", 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))
      || new Date(date).toISOString().slice(0, 10) !== date || date.startsWith("0000")) throw new StudioInputError("Enter a valid calendar date.");
    return { action, version, date } as const;
  }
  if (action === "approve") return { action, version } as const;
  if (action === "withdraw") return { action, version, note: field(form, "note", 1_000) } as const;
  throw new StudioInputError("Choose a valid action.");
}
