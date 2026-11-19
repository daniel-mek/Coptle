import { expect, test } from "vitest";
import { parseStudioAction } from "../lib/studio-validation";

const version = "00000000-0000-0000-0000-000000000001";

test("requires explicit personal attestation to record a theological review", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ intent: "review", version, stage: "theology", verdict: "approved" })) form.set(key, value);
  expect(() => parseStudioAction(form)).toThrow("personally reviewed");
  form.set("confirmed", "on");
  expect(parseStudioAction(form)).toEqual({ action: "review", version, stage: "theology", verdict: "approved" });
});

test("rejects dates that would roll over", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ intent: "schedule", version, date: "2026-02-30" })) form.set(key, value);
  expect(() => parseStudioAction(form)).toThrow("valid calendar date");
});
