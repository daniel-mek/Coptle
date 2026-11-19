"use client";

import { useState, type FormEvent } from "react";
import { reportCategories } from "../lib/report-categories";

export function ReportPuzzle({ boardId }: { boardId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || sent) return;
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, category: form.get("category"), details: form.get("details") }),
      });
      const reply = await response.json();
      if (!response.ok) {
        setMessage(reply.error);
        return;
      }
      setSent(true);
      setMessage(reply.repeated ? "A report for this puzzle was already sent." : "Report sent to the Coptle team.");
    } catch {
      setMessage("The report could not be saved. Try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return <details className="studio-card">
    <summary>Report this puzzle</summary>
    {!sent && <form className="studio-form" onSubmit={submit}>
      <label>Report category <select name="category" defaultValue="" required>
        <option value="" disabled>Choose a category</option>
        {Object.entries(reportCategories).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <label>Details (optional) <textarea name="details" maxLength={1000} aria-describedby="report-privacy" /></label>
      <p id="report-privacy">Keep names, contact details, and other personal information out of your report.</p>
      <div><button className="button" disabled={submitting}>{submitting ? "Sending…" : "Send report"}</button></div>
    </form>}
    <p role="status">{message}</p>
  </details>;
}
