import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, test } from "vitest";

const db = new PGlite();
const contents = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const today = "(now() at time zone 'America/New_York')::date";

beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key);");
  for (const migration of ["content_foundation", "editorial_workflow", "studio", "reviewed_play"].entries()) {
    const [index, name] = migration;
    await db.exec(contents(`../supabase/migrations/20261119000${index + 1}_${name}.sql`));
  }
}, 30_000);
afterAll(async () => { await db.close(); });

test("reviewed inventory gates play, limits archive dates, and keeps current answers out of practice", async () => {
  expect((await db.query("select * from coptle.play_ready()")).rows).toEqual([]);
  await db.exec(contents("./sql/reviewed-play-fixture.sql"));
  expect((await db.query("select * from coptle.play_ready()")).rows).toEqual([{ game: "word", difficulty: "beginner" }]);
  await db.exec("create role reviewed_test in role coptle_play; set role reviewed_test");
  try {
    await expect(db.query("select * from coptle.puzzle_versions")).rejects.toMatchObject({ code: "42501" });
    expect((await db.query(`select * from coptle.play_pick('word','beginner','daily',${today}+1)`)).rows).toEqual([]);
    const result = await db.query<{ answer: string }>(`select payload->>'answer' as answer from coptle.play_pick('word','beginner','daily',${today})`);
    expect(result.rows).toEqual([{ answer: "stone" }]);
    const practice = await db.query<{ answer: string }>(`select payload->>'answer' as answer from coptle.play_pick('word','beginner','practice',${today})`);
    expect(["light", "plant"]).toContain(practice.rows[0].answer);
    expect((await db.query("select game from coptle.play_archive('beginner')")).rows).toEqual([{ game: "word" }]);
  } finally { await db.exec("reset role"); }
  await db.exec(`insert into coptle.withdrawn_versions(version_id, reason)
    select version_id, 'Synthetic withdrawal' from coptle.daily_puzzles where puzzle_date = ${today} + 29`);
  expect((await db.query("select * from coptle.play_ready()")).rows).toEqual([]);
});
