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
    if (game === "word" && !/^[a-z]+$/i.test(answer)) throw new StudioInputError("Word answers must contain letters only.");
    const payload = game === "saintle" ? { ...common, region: field(form, "region", 120), vocation: field(form, "vocation", 120) }
      : game === "versele" ? { ...common, prompt: field(form, "prompt", 1_000) } : { ...common, answer: answer.toLowerCase() };
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
