import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, test } from "vitest";

const db = new PGlite();
const source = "00000000-0000-0000-0000-000000000001";
const daily = "00000000-0000-0000-0000-000000000002";
const version = "00000000-0000-0000-0000-000000000003";
const human = "00000000-0000-0000-0000-000000000004";
const practice = "00000000-0000-0000-0000-000000000005";
const practiceVersion = "00000000-0000-0000-0000-000000000006";

beforeAll(async () => {
  await db.exec(`create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);`);
  await db.exec(readFileSync(new URL("../supabase/migrations/202611190001_content_foundation.sql", import.meta.url), "utf8"));
  await db.query("insert into auth.users values ($1)", [human]);
  await db.query("insert into coptle.sources(id, citation) values ($1, 'SQL test source')", [source]);
  await db.query(`insert into coptle.puzzles values
    ($1, 'word', 'beginner', 'SQL test fixture', 'daily'),
    ($2, 'word', 'beginner', 'SQL test fixture', 'practice')`, [daily, practice]);
  await db.query(`insert into coptle.puzzle_versions
    (id, puzzle_id, game, difficulty, inventory, version, source_id, payload) values
    ($1, $2, 'word', 'beginner', 'daily', 1, $3, '{"answer":"example","explanation":"SQL assertion fixture","aliases":[]}' ),
    ($4, $5, 'word', 'beginner', 'practice', 1, $3, '{"answer":"example","explanation":"SQL assertion fixture","aliases":[]}' )`, [version, daily, source, practiceVersion, practice]);
}, 30_000);

afterAll(async () => { await db.close(); });

const schedule = (id: string, date = "2030-01-01", level = "beginner") => db.query(
  "insert into coptle.daily_puzzles(puzzle_date, game, difficulty, version_id) values ($1, 'word', $2, $3)",
  [date, level, id],
);
const approve = (id: string) => db.query("insert into coptle.approved_versions(version_id, publisher_id) values ($1, $2)", [id, human]);
const review = (id: string, stage: string, decision = "approved") => db.query(
  "insert into coptle.content_reviews(version_id, stage, reviewer_id, decision) values ($1, $2, $3, $4)",
  [id, stage, human, decision],
);

test("scheduling requires all reviews on the exact immutable version and hides withdrawals", async () => {
  await expect(schedule(version)).rejects.toMatchObject({ code: "23503" });
  await review(version, "source");
  await review(version, "gameplay");
  await expect(approve(version)).rejects.toMatchObject({ code: "23503" });
  await review(version, "theology");
  await approve(version);
  await expect(schedule(version, "2030-01-01", "advanced")).rejects.toMatchObject({ code: "23503" });
  await schedule(version);
  await expect(schedule(version, "2030-01-02")).rejects.toMatchObject({ code: "23505" });
  expect((await db.query("select version_id from coptle.available_daily_puzzles")).rows).toEqual([{ version_id: version }]);
  await expect(db.query("update coptle.puzzle_versions set payload = '{\"changed\":true}' where id = $1", [version])).rejects.toThrow("Create a new version");
  await db.query("insert into coptle.withdrawn_versions(version_id, reason) values ($1, 'SQL test withdrawal')", [version]);
  expect((await db.query("select version_id from coptle.available_daily_puzzles")).rows).toEqual([]);
  await expect(schedule(version, "2030-03-01")).rejects.toMatchObject({ code: "23514" });
});

test("missing review blocks approval and practice inventory cannot be scheduled", async () => {
  await review(practiceVersion, "source");
  await review(practiceVersion, "gameplay");
  await expect(approve(practiceVersion)).rejects.toMatchObject({ code: "23503" });
  await review(practiceVersion, "theology");
  await approve(practiceVersion);
  await expect(schedule(practiceVersion, "2030-02-01")).rejects.toMatchObject({ code: "23503" });
  expect((await db.query("select version_id from coptle.available_practice_puzzles")).rows).toEqual([{ version_id: practiceVersion }]);
});

test.each(["anon", "authenticated", "service_role"])("%s cannot read answers or write reviews", async (role) => {
  await db.exec(`set role ${role}`);
  try {
    await expect(db.query("select payload from coptle.available_daily_puzzles")).rejects.toMatchObject({ code: "42501" });
    await expect(review(version, "theology", "rejected")).rejects.toMatchObject({ code: "42501" });
  } finally {
    await db.exec("reset role");
  }
});

test("a newer version needs its own review and blocks scheduling an outdated version", async () => {
  const replacement = "00000000-0000-0000-0000-000000000007";
  const old = "00000000-0000-0000-0000-000000000008";
  const puzzle = "00000000-0000-0000-0000-000000000009";
  await db.query("insert into coptle.puzzles values ($1, 'word', 'beginner', 'SQL test fixture', 'daily')", [puzzle]);
  const createVersion = (id: string, number: number) => db.query(`insert into coptle.puzzle_versions
    (id, puzzle_id, game, difficulty, inventory, version, source_id, payload) values
    ($1, $2, 'word', 'beginner', 'daily', $3, $4, '{"answer":"example","explanation":"SQL assertion fixture","aliases":[]}')`,
  [id, puzzle, number, source]);
  await createVersion(old, 1);
  for (const stage of ["source", "theology", "gameplay"]) await review(old, stage);
  await approve(old);
  await createVersion(replacement, 2);
  await expect(schedule(old, "2030-04-01")).rejects.toMatchObject({ code: "23514" });
  await review(replacement, "source");
  await review(replacement, "gameplay");
  await review(replacement, "theology", "rejected");
  await expect(approve(replacement)).rejects.toMatchObject({ code: "23503" });
  await expect(schedule(replacement, "2030-04-01")).rejects.toMatchObject({ code: "23503" });
});
