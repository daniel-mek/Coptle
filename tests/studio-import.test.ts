import { expect, test } from "vitest";
import { parseDraftBatch } from "../lib/studio-import";

const draft = { game: "word", difficulty: "beginner", category: "Test", inventory: "daily", citation: "Test source",
  answer: "STONE", explanation: "Test explanation" };

test("imports the same validated payload as the draft form", () => {
  const result = parseDraftBatch(JSON.stringify([draft, { ...draft, game: "versele", prompt: "Test prompt", options: ["STONE", "SLATE"] }]));
  expect(result.drafts).toMatchObject([
    { game: "word", payload: { answer: "stone", aliases: [] } },
    { game: "versele", payload: { answer: "STONE", options: ["STONE", "SLATE"] } },
  ]);
});

test("rejects the entire batch with row-specific diagnostics", () => {
  const result = parseDraftBatch(JSON.stringify([draft, { ...draft, answer: "BAD" }, { ...draft, approved: true }]));
  expect(result.drafts).toBeUndefined();
  expect(result.errors).toEqual([
    "Row 2. The Word answer length must match the difficulty.",
    "Row 3. Unrecognized field. Use the draft fields shown in the template.",
  ]);
});

test("enforces byte and row limits", () => {
  expect(parseDraftBatch("é".repeat(100_001)).errors).toContain("Enter a JSON batch no larger than 200 KB.");
  expect(parseDraftBatch(JSON.stringify(Array.from({ length: 26 }, () => draft))).errors).toContain("Enter a JSON array with 1 to 25 drafts.");
});
