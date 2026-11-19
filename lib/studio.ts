import "server-only";
import postgres from "postgres";
import { uuidPattern } from "./studio-validation";

export const studioCookie = "coptle_studio_access";
export const studioConfigured = () => Boolean(process.env.COPTLE_STUDIO_DATABASE_URL && process.env.COPTLE_SUPABASE_URL && process.env.COPTLE_SUPABASE_PUBLISHABLE_KEY);

export async function authRequest(path: string, init: RequestInit = {}) {
  const endpoint = new URL(process.env.COPTLE_SUPABASE_URL!);
  if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1"].includes(endpoint.hostname))) {
    throw new Error("Supabase Auth must use HTTPS");
  }
  const headers = new Headers(init.headers);
  headers.set("apikey", process.env.COPTLE_SUPABASE_PUBLISHABLE_KEY!);
  return fetch(new URL("/auth/v1/" + path, endpoint), {
    ...init, headers, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8_000),
  });
}

export async function studioSubject(token?: string) {
  if (!token || !studioConfigured()) return null;
  const response = await authRequest("user", { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Supabase Auth could not verify the session");
  const { id } = await response.json();
  return typeof id === "string" && uuidPattern.test(id) ? id : null;
}

let connection: ReturnType<typeof postgres> | undefined;
export async function withStudio<T>(id: string, work: (sql: postgres.TransactionSql) => Promise<T>) {
  connection ??= postgres(process.env.COPTLE_STUDIO_DATABASE_URL!, { prepare: false, max: 3, connect_timeout: 5, idle_timeout: 20 });
  return connection.begin(async (sql) => {
    await sql`select set_config('coptle.studio_subject', ${id}, true), set_config('statement_timeout', '5000', true)`;
    return work(sql);
  });
}
