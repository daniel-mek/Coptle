"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authRequest, studioConfigured, studioCookie, studioSubject, withStudio } from "../../lib/studio";
import { parseStudioAction, StudioInputError } from "../../lib/studio-validation";
import { parseDraftBatch, type ImportFeedback } from "../../lib/studio-import";

function finish(status: string): never {
  redirect("/studio?status=" + status);
}

export async function signIn(form: FormData) {
  if (!studioConfigured()) finish("unavailable");
  const email = form.get("email");
  const password = form.get("password");
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || email.length > 320
    || !password || password.length > 512) finish("signin");
  let signedIn = false;
  try {
    const response = await authRequest("token?grant_type=password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (response.ok) {
      const { access_token, expires_in } = await response.json();
      const subject = await studioSubject(typeof access_token === "string" ? access_token : undefined);
      if (subject && await withStudio(subject, async (sql) => {
        const [result] = await sql<{ allowed: boolean }[]>`select cardinality(coptle.editorial_capabilities()) > 0 as allowed`;
        return result.allowed;
      })) {
        (await cookies()).set(studioCookie, access_token, {
          httpOnly: true, sameSite: "strict", path: "/studio",
          secure: process.env.NODE_ENV === "production",
          maxAge: typeof expires_in === "number" && expires_in > 0 ? Math.min(expires_in, 3600) : 900,
        });
        signedIn = true;
      }
    }
  } catch {
    finish("unavailable");
  }
  if (!signedIn) finish("signin");
  redirect("/studio");
}

export async function signOut() {
  (await cookies()).set(studioCookie, "", { path: "/studio", maxAge: 0 });
  redirect("/studio");
}

export async function submitStudio(form: FormData) {
  let status = "saved";
  try {
    const id = await studioSubject((await cookies()).get(studioCookie)?.value);
    if (!id) {
      status = "signin";
    } else {
      const input = parseStudioAction(form);
      await withStudio(id, async (sql) => {
        switch (input.action) {
          case "draft":
            await sql`select coptle.editorial_draft(${input.puzzle}::uuid, ${input.game}, ${input.difficulty},
              ${input.category}, ${input.inventory}, ${input.citation}, ${input.license}, ${sql.json(input.payload)})`;
            break;
          case "review":
            await sql`select coptle.editorial_review(${input.version}::uuid, ${input.stage}, ${input.verdict})`;
            break;
          case "approve":
            await sql`select coptle.editorial_approve(${input.version}::uuid)`;
            break;
          case "schedule":
            await sql`select coptle.editorial_schedule(${input.version}::uuid, ${input.date}::date)`;
            break;
          case "withdraw":
            await sql`select coptle.editorial_withdraw(${input.version}::uuid, ${input.note})`;
        }
      });
    }
  } catch (cause) {
    const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
    status = cause instanceof StudioInputError ? "invalid" : code === "42501" ? "forbidden"
      : code === "23505" ? "duplicate" : code === "23503" || code === "23514" ? "blocked" : "unavailable";
  }
  finish(status);
}

export async function importStudioDrafts(_previous: ImportFeedback, form: FormData): Promise<ImportFeedback> {
  try {
    const subject = await studioSubject((await cookies()).get(studioCookie)?.value);
    if (!subject) return { errors: ["Sign in with a staff account to import drafts."] };
    const input = parseDraftBatch(form.get("batch"));
    if (!input.drafts) return { errors: [...input.errors] };
    const feedback = await withStudio(subject, async (sql) => {
      const [result] = await sql<{ draft_count: number; repeated: boolean }[]>`
        select * from coptle.studio_import_drafts(${sql.json(input.drafts)})
      `;
      return { count: result.draft_count, repeated: result.repeated };
    });
    if (!feedback.repeated) revalidatePath("/studio");
    return feedback;
  } catch (cause) {
    const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
    return { errors: [code === "42501" ? "Your staff account lacks draft permission."
      : code === "23514" || code === "23502" || code === "23503" ? "The database rejected this batch. No drafts were saved."
      : "The import could not finish. You can retry the same batch."] };
  }
}
