import "server-only";
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import postgres from "postgres";
import { newGuest, type Guest } from "./fixture-sessions";

let local: DatabaseSync | undefined;
let remote: ReturnType<typeof postgres> | undefined;
const tokenFormat = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/;

export async function withFixtureGuest<T>(cookie: string | undefined, create: boolean, update: (guest: Guest) => T) {
  const token = cookie && tokenFormat.test(cookie) ? cookie : undefined;
  const now = Date.now();
  const key = token && createHash("sha256").update(token).digest("hex");
  const freshToken = create ? crypto.randomUUID() : undefined;
  const freshKey = freshToken && createHash("sha256").update(freshToken).digest("hex");
  const url = process.env.COPTLE_FIXTURE_DATABASE_URL;
  if (url) {
    remote ??= postgres(url, { max: 3, prepare: false, idle_timeout: 20, connect_timeout: 5 });
    return remote.begin(async (sql) => {
      const [stored] = key ? await sql<{ state: Guest }[]>`
        select state from coptle.fixture_guests where token_hash = ${key} and expires_ms > ${now} for update
      ` : [];
      if (!stored && !freshKey) return null;
      const guest = stored?.state ?? newGuest(now);
      const result = update(guest);
      if (stored && key) {
        await sql`update coptle.fixture_guests set state = ${sql.json(JSON.parse(JSON.stringify(guest)))} where token_hash = ${key}`;
      } else if (freshKey) {
        await sql`insert into coptle.fixture_guests (token_hash, expires_ms, state)
          values (${freshKey}, ${guest.expires}, ${sql.json(JSON.parse(JSON.stringify(guest)))})`;
      }
      return { result, token: stored ? undefined : freshToken };
    });
  }
  const file = process.env.COPTLE_FIXTURE_DB_FILE || (process.env.VERCEL ? "/tmp/coptle.sqlite" : ".coptle/fixtures.sqlite");
  if (!local) {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    local = new DatabaseSync(file, { timeout: 5_000 });
    local.exec("pragma journal_mode = WAL; create table if not exists fixture_guests (token_hash text primary key, expires_ms integer not null, state text not null) strict;");
  }
  local.exec("begin immediate");
  try {
    const row = key && local.prepare("select state from fixture_guests where token_hash = ? and expires_ms > ?").get(key, now);
    if (!row && !freshKey) {
      local.exec("commit");
      return null;
    }
    if (!row) {
      local.prepare("delete from fixture_guests where expires_ms <= ?").run(now);
      const count = local.prepare("select count(*) as count from fixture_guests").get();
      if (Number(count?.count) >= 2_000) {
        local.exec("commit");
        return null;
      }
    }
    const guest: Guest = row ? JSON.parse(String(row.state)) : newGuest(now);
    const result = update(guest);
    if (row && key) local.prepare("update fixture_guests set state = ? where token_hash = ?").run(JSON.stringify(guest), key);
    else if (freshKey) local.prepare("insert into fixture_guests values (?, ?, ?)").run(freshKey, guest.expires, JSON.stringify(guest));
    local.exec("commit");
    return { result, token: row ? undefined : freshToken };
  } catch (cause) {
    local.exec("rollback");
    throw cause;
  }
}
