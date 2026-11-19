import { expect, test } from "@playwright/test";
import { puzzleDate } from "../../lib/calendar";

test("guest solves The Word and restores the result after refresh", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Play The Word" }).click();
  const guess = page.getByLabel("Your guess");
  await guess.fill("xxxxx");
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.getByText("That word is outside the development dictionary.")).toBeVisible();
  await expect(page.getByText("0 of 6 guesses used")).toBeVisible();

  const index = Math.floor(Date.parse(puzzleDate()) / 86_400_000) % 2;
  await guess.fill(index === 0 ? "faith" : "grace");
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.getByRole("heading", { name: "Solved!" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Solved!" })).toBeVisible();
  await page.getByRole("link", { name: "Statistics" }).click();
  await expect(page.getByText("The Word · 1 played · 1 solved")).toBeVisible();
});

test("Saintle accepts aliases and Versele shows its reference on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const index = Math.floor(Date.parse(puzzleDate()) / 86_400_000) % 2;
  await page.goto("/play/saintle?mode=practice");
  await page.getByLabel("Your guess").fill("mary");
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.getByRole("heading", { name: "Solved!" })).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByText("0 of 6 guesses used")).toBeVisible();

  await page.goto("/play/versele");
  await page.getByLabel("Your guess").selectOption(index === 0 ? "Jonah" : "Luke");
  await page.getByRole("button", { name: "Guess" }).click();
  await expect(page.getByRole("heading", { name: "Solved!" })).toBeVisible();
  await expect(page.getByText(index === 0 ? "Jonah 1:17–2:10" : "Luke 10:25–37", { exact: true })).toBeVisible();
});

test("theme persists across navigation and sharing omits the answer", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/settings");
  await page.getByRole("radio", { name: "Dark" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Practice" }).click();
  await page.getByRole("link", { name: "Play The Word" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Your guess").fill("psalm");
  await page.getByRole("button", { name: "Guess", exact: true }).click();
  await page.getByRole("button", { name: "Copy result" }).click();
  await expect(page.getByText("Copied a spoiler-free result.")).toBeVisible();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  expect(shared).toContain("1/6");
  expect(shared).not.toMatch(/psalm/i);
});
