"use client";

import { useActionState, useState } from "react";
import { draftBatchBytes, draftBatchLimit } from "../../lib/studio-import";
import { importStudioDrafts } from "./actions";

const template = JSON.stringify([{
  game: "word", difficulty: "beginner", inventory: "daily",
  category: "Category", citation: "Source reference", answer: "xxxxx",
  explanation: "Replace with the draft explanation.", aliases: [],
}], null, 2);

export function BulkImport() {
  const [batch, setBatch] = useState("");
  const [feedback, submit, pending] = useActionState(importStudioDrafts, {});
  return <details className="studio-card">
    <summary>Import draft batch</summary>
    <p>Paste a JSON array of up to {draftBatchLimit} puzzles. All entries will need review.</p>
    <details><summary>JSON template and game fields</summary>
      <pre className="studio-import-template">{template}</pre>
      <p>Use <code>word</code>, <code>saintle</code>, or <code>versele</code> for the game. License is optional.
        Versele uses a prompt and a choices array named <code>options</code> for multiple choice.
        Saintle uses region, vocation, and a <code>candidates</code> array with each alternative formatted as name | region | vocation.</p>
    </details>
    <form action={submit} className="studio-form">
      <label>Draft JSON<textarea name="batch" required maxLength={draftBatchBytes} value={batch}
        onChange={(event) => setBatch(event.target.value)} /></label>
      <div><button className="button" disabled={pending}>{pending ? "Importing…" : "Import drafts"}</button></div>
    </form>
    {feedback.errors?.length ? <div role="alert"><p>Check the batch and try again.</p>
      <ul>{feedback.errors.map((error) => <li key={error}>{error}</li>)}</ul>
    </div> : feedback.count ? <p role="status">{feedback.repeated
      ? `This batch of ${feedback.count} drafts was already imported.`
      : `Imported ${feedback.count} ${feedback.count === 1 ? "draft" : "drafts"} for review.`}</p> : null}
  </details>;
}
