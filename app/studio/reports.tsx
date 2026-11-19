import { games, type Game } from "../../lib/catalog";
import { reportCategories } from "../../lib/report-categories";
import { submitStudio } from "./actions";

export type ContentReport = {
  id: string; version_id: string; game: Game; difficulty: string; version: number;
  category: keyof typeof reportCategories; details: string; status: "open" | "resolved"; created_at: Date;
  history: { status: string; moderator_id: string; note: string; created_at: string }[];
  withdrawn: boolean;
};

const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/New_York" });

export function ContentReports({ reports }: { reports: ContentReport[] }) {
  return <section aria-labelledby="content-reports">
    <h2 id="content-reports">Content reports</h2>
    {!reports.length && <p>No reports yet.</p>}
    {reports.map((report) => <details className="studio-card" key={report.id}>
      <summary><strong>{reportCategories[report.category]}</strong> · {games[report.game].name} · {report.status}</summary>
      <p>{report.difficulty} · Version {report.version} · {dateLabel.format(new Date(report.created_at))}</p>
      <p>Version ID <code>{report.version_id}</code></p>
      {report.details && <p className="report-details">{report.details}</p>}
      {report.history.length > 0 && <ol>
        {report.history.map((event, index) => <li key={index}>
          {dateLabel.format(new Date(event.created_at))} · {event.status} · {event.moderator_id}
          <p className="report-details">{event.note}</p>
        </li>)}
      </ol>}
      <form className="studio-form" action={submitStudio}>
        <input type="hidden" name="intent" value="moderate-report" />
        <input type="hidden" name="version" value={report.id} />
        <input type="hidden" name="expected" value={report.status} />
        <label>Internal note <textarea name="note" maxLength={1000} required /></label>
        <div><button className="button">{report.status === "open" ? "Resolve report" : "Reopen report"}</button></div>
      </form>
      {report.withdrawn ? <p>This version was withdrawn.</p> : <details className="studio-card">
        <summary>Withdraw puzzle version</summary>
        <form className="studio-form" action={submitStudio}>
          <input type="hidden" name="intent" value="withdraw" />
          <input type="hidden" name="version" value={report.version_id} />
          <label>Withdrawal reason <textarea name="note" maxLength={1000} required /></label>
          <div><button className="button">Confirm withdrawal</button></div>
        </form>
      </details>}
    </details>)}
  </section>;
}
