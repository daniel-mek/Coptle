import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, test } from "vitest";

const db = new PGlite();
const staff = ["drafter", "source_reviewer", "theology_reviewer", "gameplay_reviewer", "publisher"] as const;
const permissions = ["draft", "source", "theology", "gameplay", "publish"];

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);`);
  for (const name of ["202611190001_content_foundation", "202611190002_editorial_workflow", "202611190003_studio", "202611190004_reviewed_play", "202611190006_bulk_drafts"]) {
    await db.exec(readFileSync(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8"));
  }
  for (const [index, login] of staff.entries()) {
    const person = `00000000-0000-0000-0000-00000000000${index + 1}`;
    await db.exec(`create role ${login} login in role coptle_editorial`);
    await db.query("insert into auth.users values ($1)", [person]);
    await db.query("insert into coptle.editorial_permissions values ($1, $2, $3)", [login, person, permissions[index]]);
  }
  await db.exec("create role unassigned login in role coptle_editorial; create role studio_server login in role coptle_studio");
  await db.exec("insert into coptle.studio_permissions values ('00000000-0000-0000-0000-000000000003', 'theology'), ('00000000-0000-0000-0000-000000000001', 'draft')");
}, 30_000);
afterAll(async () => { await db.close(); });

async function as<T>(login: (typeof staff)[number] | "unassigned" | "studio_server", work: () => Promise<T>) {
  await db.exec(`set session authorization ${login}`);
  try { return await work(); }
  finally { await db.exec("reset session authorization"); }
}

test("staff capabilities preserve human attribution and protect the full publication workflow", async () => {
  const draft = () => db.query<{ id: string }>(`select coptle.editorial_draft(null, 'word', 'beginner',
    'SQL workflow fixture', 'daily', 'Test citation', null,
    '{"answer":"fixture","explanation":"Test only","aliases":[]}') as id`);
  await expect(as("unassigned", draft)).rejects.toMatchObject({ code: "42501" });
  const record = await as("drafter", draft);
  const id = record.rows[0].id;
  const review = (stage: string) => () => db.query("select coptle.editorial_review($1, $2, 'approved')", [id, stage]);
  const approve = () => db.query("select coptle.editorial_approve($1)", [id]);
  const schedule = () => db.query("select coptle.editorial_schedule($1, date '2030-01-02')", [id]);
  await expect(as("drafter", review("theology"))).rejects.toMatchObject({ code: "42501" });
  await expect(as("drafter", approve)).rejects.toMatchObject({ code: "42501" });
  await as("source_reviewer", review("source"));
  await as("gameplay_reviewer", review("gameplay"));
  await expect(as("publisher", approve)).rejects.toMatchObject({ code: "23503" });
  await expect(as("publisher", schedule)).rejects.toMatchObject({ code: "23503" });
  await as("theology_reviewer", review("theology"));
  await as("publisher", approve);
  await as("publisher", schedule);
  const entries = await as("theology_reviewer", () => db.query("select version_id, approved, reviews from coptle.editorial_versions()"));
  expect(entries.rows).toMatchObject([{ version_id: id, approved: true, reviews: {
    source: { decision: "approved" }, gameplay: { decision: "approved" },
    theology: { decision: "approved", reviewer_id: "00000000-0000-0000-0000-000000000003" },
  } }]);
  await as("publisher", () => db.query("select coptle.editorial_withdraw($1, 'Test withdrawal')", [id]));
  const withdrawn = await as("publisher", () => db.query("select version_id, withdrawn from coptle.editorial_versions()"));
  expect(withdrawn.rows).toEqual([{ version_id: id, withdrawn: true }]);
});

test("Studio identity is transaction-scoped and unavailable to ordinary SQL staff", async () => {
  const subject = "00000000-0000-0000-0000-000000000003";
  const attempt = (login: "studio_server" | "unassigned") => as(login, async () => {
    const capability = await db.transaction(async (tx) => {
      await tx.query("select set_config('coptle.studio_subject', $1, true)", [subject]);
      const result = await tx.query<{ capabilities: string[] }>("select coptle.editorial_capabilities() as capabilities");
      return result.rows[0].capabilities;
    });
    expect((await db.query("select coptle.editorial_capabilities() as capabilities")).rows)
      .toEqual([{ capabilities: [] }]);
    return capability;
  });
  await expect(attempt("studio_server")).resolves.toEqual(["theology"]);
  await expect(attempt("unassigned")).rejects.toMatchObject({ code: "42501" });
});

test("permissions and transaction boundaries protect draft imports and retries", async () => {
  const author = "00000000-0000-0000-0000-000000000001";
  const reviewer = "00000000-0000-0000-0000-000000000003";
  const draft = { game: "word", difficulty: "beginner", category: "Batch test", inventory: "daily", citation: "Test citation",
    payload: { answer: "stone", aliases: [], explanation: "Test-only draft" } };
  const importBatch = (subject: string, batch: object[]) => as("studio_server", () => db.transaction(async (tx) => {
    await tx.query("select set_config('coptle.studio_subject', $1, true)", [subject]);
    return tx.query("select * from coptle.studio_import_drafts($1)", [JSON.stringify(batch)]);
  }));
  const versions = () => as("studio_server", () => db.transaction(async (tx) => {
    await tx.query("select set_config('coptle.studio_subject', $1, true)", [author]);
    return tx.query("select approved, reviews from coptle.editorial_versions() where category = 'Batch test'");
  }));
  await expect(importBatch(reviewer, [draft])).rejects.toMatchObject({ code: "42501" });
  await expect(importBatch(author, [draft, { ...draft, category: null }])).rejects.toMatchObject({ code: "23502" });
  expect((await versions()).rows).toEqual([]);
  expect((await importBatch(author, [draft])).rows).toEqual([{ draft_count: 1, repeated: false }]);
  expect((await importBatch(author, [draft])).rows).toEqual([{ draft_count: 1, repeated: true }]);
  expect((await versions()).rows).toEqual([{ approved: false, reviews: {} }]);
});
