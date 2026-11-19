import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const viewport of [{ width: 1440, height: 900 }, { width: 320, height: 740 }]) {
  test(`responsive layout and accessibility at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const browserErrors: string[] = [];
    page.on("pageerror", (error) => browserErrors.push(error.message));
    page.on("console", (entry) => {
      if (entry.type() === "error") browserErrors.push(`${entry.location().url} ${entry.text()}`);
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Today’s puzzles" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    await page.getByRole("link", { name: "Advanced" }).click();
    await page.getByRole("link", { name: "Play The Word" }).click();
    const input = page.getByLabel("Your guess");
    await input.fill(await input.getAttribute("maxlength") === "9" ? "something" : "elephant");
    await page.getByRole("button", { name: "Guess", exact: true }).click();
    await expect(page.getByText("1 of 6 guesses used")).toBeVisible();
    const tileRows = await page.locator(".word-marks .tile").evaluateAll((tiles) => (
      new Set(tiles.map((tile) => tile.getBoundingClientRect().top)).size
    ));
    expect(tileRows).toBe(1);
    await page.screenshot({ path: testInfo.outputPath("game.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
    expect(browserErrors).toEqual([]);
  });
}

test("rejects cross-origin, oversized and stale writes while keeping valid attempts", async ({ request }) => {
  const play = (data: object, headers?: Record<string, string>) => request.post("/api/play", { data, headers });
  const puzzle = { game: "word", level: "beginner", mode: "daily" };
  const load = () => play({ ...puzzle, action: "load" });
  expect((await play({ ...puzzle, action: "load" }, { Origin: "https://cross-origin.invalid" })).status()).toBe(403);
  expect((await play({ padding: "a".repeat(2048) })).status()).toBe(413);
  const response = await load();
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["set-cookie"]).toContain("HttpOnly");
  const board = await response.json();
  expect(board.answer).toBeUndefined();

  const submission = { ...puzzle, action: "guess", id: board.id, revision: 0, guess: "train", mutation: crypto.randomUUID() };
  expect((await play({ ...submission, mutation: "-".repeat(36) })).status()).toBe(400);
  const first = await play(submission);
  expect(first.status()).toBe(200);
  expect((await first.json()).guesses).toHaveLength(1);
  expect((await (await play(submission)).json()).guesses).toHaveLength(1);
  expect((await play({ ...submission, guess: "crane", mutation: crypto.randomUUID() })).status()).toBe(409);
  expect((await play({ ...submission, revision: 1, mutation: crypto.randomUUID() })).status()).toBe(422);
  expect((await play({ ...submission, action: "restart", revision: 1, mutation: crypto.randomUUID() })).status()).toBe(403);
  expect((await (await load()).json()).guesses).toHaveLength(1);
});
