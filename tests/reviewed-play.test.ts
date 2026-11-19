import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, test } from "vitest";

const db = new PGlite();
const contents = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const today = "(now() at time zone 'America/New_York')::date";

beforeAll(async () => {
  await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key);");
  for (const migration of ["content_foundation", "editorial_workflow", "studio", "reviewed_play", "launch_inventory"].entries()) {
    const [index, name] = migration;
    await db.exec(contents(`../supabase/migrations/20261119000${index + 1}_${name}.sql`));
  }
}, 30_000);
afterAll(async () => { await db.close(); });

test("reviewed inventory gates play, limits archive dates, and keeps current answers out of practice", async () => {
  expect((await db.query("select * from coptle.play_ready()")).rows).toEqual([]);
  const empty = await db.query("select daily_ready, practice_ready, jsonb_array_length(gaps) as missing from coptle.launch_inventory()");
  expect(empty.rows).toHaveLength(9);
  expect(empty.rows).toEqual(Array.from({ length: 9 }, () => ({ daily_ready: 0, practice_ready: 0, missing: 30 })));
  await db.exec(contents("./sql/reviewed-play-fixture.sql"));
  expect((await db.query("select daily_ready, practice_ready, gaps from coptle.launch_inventory() where game = 'word' and difficulty = 'beginner'")).rows)
    .toEqual([{ daily_ready: 30, practice_ready: 2, gaps: [] }]);
  expect((await db.query("select * from coptle.play_ready()")).rows).toEqual([{ game: "word", difficulty: "beginner" }]);
  await db.exec("create role reviewed_test in role coptle_play; set role reviewed_test");
  try {
    await expect(db.query("select * from coptle.studio_launch_inventory()")).rejects.toMatchObject({ code: "42501" });
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
  await db.exec(`create role launch_staff login in role coptle_studio;
    insert into coptle.studio_permissions values ('00000000-0000-0000-0000-000000000001', 'publish');
    set session authorization launch_staff;`);
  try {
    await expect(db.query("select * from coptle.studio_launch_inventory()")).rejects.toMatchObject({ code: "42501" });
    await db.transaction(async (tx) => {
      await tx.query("select set_config('coptle.studio_subject', '00000000-0000-0000-0000-000000000001', true)");
      expect((await tx.query("select daily_ready, practice_ready, gaps from coptle.studio_launch_inventory() where game = 'word' and difficulty = 'beginner'")).rows)
        .toMatchObject([{ daily_ready: 29, practice_ready: 2, gaps: [{ reason: "withdrawn" }] }]);
    });
  } finally { await db.exec("reset session authorization"); }
});
