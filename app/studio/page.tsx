import type { Metadata } from "next";
import { cookies } from "next/headers";
import { difficulties, games, isGame } from "../../lib/catalog";
import { studioConfigured, studioCookie, studioSubject, withStudio } from "../../lib/studio";
import { reviewStages } from "../../lib/studio-validation";
import { signIn, signOut, submitStudio } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Content Studio", robots: { index: false, follow: false } };

type Version = {
  version_id: string; puzzle_id: string; game: string; difficulty: string; category: string;
  inventory: string; version: number; payload: Record<string, unknown>; citation: string;
  reviews: Record<string, { decision: string; reviewer_id: string; reviewed_at: string }>;
  approved: boolean; withdrawn: boolean; scheduled: string | null;
};

const notices: Record<string, string> = {
  saved: "Change saved.",
  signin: "Sign-in failed or expired. Use an authorized staff account.",
  invalid: "Check the required fields, review confirmation, and field lengths.",
  forbidden: "Your staff account lacks permission for this action.",
  duplicate: "That review, approval, or schedule slot already exists.",
  blocked: "The version or schedule does not meet the publishing requirements.",
  unavailable: "Content Studio is temporarily unavailable.",
};

function Draft({ version }: { version?: Version }) {
  const payload = version?.payload;
  const value = (key: string) => typeof payload?.[key] === "string" ? payload[key] as string : undefined;
  return <form action={submitStudio} className="studio-form">
    <input type="hidden" name="intent" value="draft" />
    {version && <input type="hidden" name="puzzle" value={version.puzzle_id} />}
    {version ? <>
      {(["game", "difficulty", "inventory", "category"] as const).map((key) =>
        <input key={key} type="hidden" name={key} value={version[key]} />)}
    </> : <div className="studio-fields">
      <label>Game <select name="game">{Object.entries(games).map(([key, game]) => <option key={key} value={key}>{game.name}</option>)}</select></label>
      <label>Difficulty <select name="difficulty">{difficulties.map((level) => <option key={level}>{level}</option>)}</select></label>
      <label>Inventory <select name="inventory"><option value="daily">Daily</option><option value="practice">Practice</option></select></label>
      <label>Category <input name="category" required maxLength={100} /></label>
    </div>}
    <label>Source citation <input name="citation" required maxLength={500} defaultValue={version?.citation} /></label>
    <label>License or permission <input name="license" maxLength={300} /></label>
    <label>Answer <input name="answer" required maxLength={120} defaultValue={value("answer")} /></label>
    <label>Accepted aliases, one per line <textarea name="aliases" maxLength={1600} defaultValue={Array.isArray(payload?.aliases) ? payload.aliases.join("\n") : undefined} /></label>
    <label>Explanation <textarea name="explanation" required maxLength={4000} defaultValue={value("explanation")} /></label>
    {(!version || version.game === "versele") && <>
      <label>Versele prompt <textarea name="prompt" required={version?.game === "versele"} maxLength={1000} defaultValue={value("prompt")} /></label>
      <label>Versele choices, one per line <textarea name="options" maxLength={730} defaultValue={Array.isArray(payload?.options) ? payload.options.join("\n") : undefined} /></label>
    </>}
    {(!version || version.game === "saintle") && <div className="studio-fields">
      <label>Saintle region <input name="region" required={version?.game === "saintle"} maxLength={120} defaultValue={value("region")} /></label>
      <label>Saintle vocation <input name="vocation" required={version?.game === "saintle"} maxLength={120} defaultValue={value("vocation")} /></label>
    </div>}
    {(!version || version.game === "saintle") && <label>Saintle alternatives, one per line as name | region | vocation
      <textarea name="candidates" maxLength={7400} defaultValue={Array.isArray(payload?.candidates)
        ? payload.candidates.filter((entry) => entry.answer !== payload.answer)
          .map((entry) => [entry.answer, entry.region, entry.vocation].join(" | ")).join("\n") : undefined} />
    </label>}
    <div><button className="button">{version ? "Save new version" : "Create draft"}</button></div>
  </form>;
}

function VersionCard({ version, permissions }: { version: Version; permissions: string[] }) {
  const { version_id: id, payload, reviews } = version;
  const gameName = isGame(version.game) ? games[version.game].name : version.game;
  const approved = reviewStages.every((stage) => reviews[stage]?.decision === "approved");
  const stages = reviewStages.filter((stage) => permissions.includes(stage) && !reviews[stage]);
  const publish = permissions.includes("publish") && !version.withdrawn;
  return <details className="studio-card">
    <summary><strong>{gameName} · {version.difficulty}</strong> · v{version.version} · {version.withdrawn ? "Withdrawn" : version.scheduled ?? (version.approved ? "Approved" : "In review")}</summary>
    <p>{version.category} · {version.inventory}</p>
    <p>Source: {version.citation}</p>
    <dl>{Object.entries(payload).map(([key, value]) => <div key={key}>
      <dt>{key}</dt><dd>{Array.isArray(value) ? value.join(", ") || "None" : String(value)}</dd>
    </div>)}</dl>
    <ul>{reviewStages.map((stage) => <li key={stage}>{stage}: {reviews[stage]?.decision ?? "Pending"}
      {reviews[stage] && <> · {reviews[stage].reviewer_id}</>}</li>)}</ul>
    {stages.length > 0 && !version.approved && !version.withdrawn && <form action={submitStudio} className="studio-form">
      <input type="hidden" name="intent" value="review" /><input type="hidden" name="version" value={id} />
      <div className="studio-fields">
        <label>Review stage <select name="stage">{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
        <label>Decision <select name="verdict" defaultValue="" required><option value="" disabled>Select a decision</option><option value="approved">Approve review</option><option value="rejected">Reject review</option></select></label>
      </div>
      <label><input type="checkbox" name="confirmed" required /> I personally reviewed this exact version.</label>
      <div><button className="button">Record review</button></div>
    </form>}
    {publish && approved && !version.approved && <form action={submitStudio} className="studio-form">
      <input type="hidden" name="intent" value="approve" /><input type="hidden" name="version" value={id} />
      <div><button className="button">Approve version for publication</button></div>
    </form>}
    {publish && version.approved && version.inventory === "daily" && !version.scheduled && <form action={submitStudio} className="studio-form">
      <input type="hidden" name="intent" value="schedule" /><input type="hidden" name="version" value={id} />
      <label>Puzzle date <input type="date" name="date" required /></label>
      <div><button className="button">Schedule</button></div>
    </form>}
    {publish && version.approved && <details className="studio-card"><summary>Withdraw version</summary>
      <form action={submitStudio} className="studio-form">
        <input type="hidden" name="intent" value="withdraw" /><input type="hidden" name="version" value={id} />
        <label>Reason <textarea name="note" maxLength={1000} required /></label>
        <div><button className="button">Confirm withdrawal</button></div>
      </form>
    </details>}
    {permissions.includes("draft") && <details className="studio-card"><summary>Create a revised version</summary><Draft version={version} /></details>}
  </details>;
}

export default async function Studio({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  let available = studioConfigured();
  let permissions: string[] = [];
  let versions: Version[] = [];
  let signedIn = false;
  if (available) {
    try {
      const subject = await studioSubject((await cookies()).get(studioCookie)?.value);
      signedIn = Boolean(subject);
      if (subject) {
        ({ permissions, versions } = await withStudio(subject, async (sql) => {
          const [record] = await sql<{ permissions: string[] }[]>`select coptle.editorial_capabilities() as permissions`;
          return {
            permissions: record.permissions,
            versions: record.permissions.length ? await sql<Version[]>`
              select v.*, s.puzzle_date::text as scheduled from coptle.editorial_versions() as v
              left join coptle.studio_schedule() as s using (version_id)
            ` : [],
          };
        }));
      }
    } catch {
      available = false;
    }
  }
  return <section className="play studio">
    <h1>Content Studio</h1>
    {typeof status === "string" && Object.hasOwn(notices, status) && <p role="status">{notices[status]}</p>}
    {!available ? <p>Content Studio is unavailable.</p> : !permissions.length ? <>
      {signedIn ? <><p>This account has no editorial permissions.</p><form action={signOut}><button className="button">Sign out</button></form></>
        : <form action={signIn} className="studio-form">
          <label>Staff email <input type="email" name="email" autoComplete="username" required maxLength={320} /></label>
          <label>Password <input type="password" name="password" autoComplete="current-password" required maxLength={512} /></label>
          <div><button className="button">Sign in</button></div>
        </form>}
    </> : <>
      <form action={signOut}><button className="button">Sign out</button></form>
      {permissions.includes("draft") && <details className="studio-card"><summary>New puzzle</summary><Draft /></details>}
      <h2>Puzzle versions</h2>
      {versions.length ? versions.map((version) => <VersionCard key={version.version_id} version={version} permissions={permissions} />)
        : <p>No puzzle versions yet.</p>}
    </>}
  </section>;
}
