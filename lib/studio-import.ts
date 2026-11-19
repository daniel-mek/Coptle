import { parseStudioAction, StudioInputError } from "./studio-validation";

export const draftBatchLimit = 25;
export const draftBatchBytes = 200_000;
const textFields = new Set(["game", "difficulty", "category", "inventory", "citation", "license", "answer", "explanation", "prompt", "region", "vocation"]);
const listFields = new Set(["aliases", "options", "candidates"]);

export type ImportFeedback = { errors?: string[]; count?: number; repeated?: boolean };

function parseRow(row: unknown) {
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new StudioInputError("Expected a puzzle object.");
  const form = new FormData();
  form.set("intent", "draft");
  for (const [key, value] of Object.entries(row)) {
    if (textFields.has(key) && typeof value === "string") form.set(key, value);
    else if (listFields.has(key) && Array.isArray(value) && value.every((item) => typeof item === "string" && !/[\r\n]/.test(item))) {
      form.set(key, value.join("\n"));
    } else if (textFields.has(key) || listFields.has(key)) {
      throw new StudioInputError(`Check the value type for ${key}.`);
    } else {
      throw new StudioInputError("Unrecognized field. Use the draft fields shown in the template.");
    }
  }
  const result = parseStudioAction(form);
  if (result.action !== "draft") throw new StudioInputError("Expected a draft.");
  const { game, difficulty, category, inventory, citation, license, payload } = result;
  return { game, difficulty, category, inventory, citation, license, payload };
}

export function parseDraftBatch(input: unknown) {
  if (typeof input !== "string" || new TextEncoder().encode(input).byteLength > draftBatchBytes) {
    return { errors: ["Enter a JSON batch no larger than 200 KB."] } as const;
  }
  let batch: unknown;
  try { batch = JSON.parse(input); }
  catch { return { errors: ["The batch is not valid JSON."] } as const; }

  if (!Array.isArray(batch) || batch.length < 1 || batch.length > draftBatchLimit) {
    return { errors: [`Enter a JSON array with 1 to ${draftBatchLimit} drafts.`] } as const;
  }
  const errors: string[] = [];
  const drafts = batch.flatMap((row, index) => {
    try { return [parseRow(row)]; }
    catch (error) {
      if (!(error instanceof StudioInputError)) throw error;
      errors.push(`Row ${index + 1}. ${error.message}`);
      return [];
    }
  });
  return errors.length ? { errors } : { drafts };
}
