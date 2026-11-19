import { expect, test } from "vitest";
import { normalize, scoreWord } from "../lib/scoring";

test("reserves exact matches before awarding duplicate letters", () => {
  expect(scoreWord("grace", "eerie")).toEqual(["absent", "absent", "present", "absent", "correct"]);
});

test("uses each unmatched occurrence at most once", () => {
  expect(scoreWord("psalm", "allay")).toEqual(["present", "present", "absent", "absent", "absent"]);
});

test("normalizes case and spacing for free text", () => {
  expect(normalize("  Luke   15:11 ")).toBe("luke 15:11");
});
