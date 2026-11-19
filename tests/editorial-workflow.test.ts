import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, test } from "vitest";

const db = new PGlite();
const staff = ["drafter", "source_reviewer", "theology_reviewer", "gameplay_reviewer", "publisher"] as const;
const permissions = ["draft", "source", "theology", "gameplay", "publish"];

beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);`);
  for (const name of ["202611190001_content_foundation", "202611190002_editorial_workflow"]) {
    await db.exec(readFileSync(new URL(`../supabase/migrations/${name}.sql`, import.meta.url), "utf8"));
  }
  for (const [index, login] of staff.entries()) {
    const person = `00000000-0000-0000-0000-00000000000${index + 1}`;
    await db.exec(`create role ${login} login in role coptle_editorial`);
    await db.query("insert into auth.users values ($1)", [person]);
    await db.query("insert into coptle.editorial_permissions values ($1, $2, $3)", [login, person, permissions[index]]);
  }
  await db.exec("create role unassigned login in role coptle_editorial");
}, 30_000);
afterAll(async () => { await db.close(); });

async function as<T>(login: (typeof staff)[number] | "unassigned", work: () => Promise<T>) {
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
