"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddTaskForm({ contactId }: { contactId?: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!title.trim()) return;
    setBusy(true);
    await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "task", title, contactId }),
    });
    setBusy(false);
    setTitle("");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task…"
        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      />
      <button
        type="button"
        disabled={busy}
        onClick={add}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        Add
      </button>
    </div>
  );
}

export function CompleteTaskButton({ id }: { id: string }) {
  const router = useRouter();
  async function complete() {
    await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", id }),
    });
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={complete}
      className="text-xs text-primary hover:underline"
    >
      Mark done
    </button>
  );
}

export function AddNoteForm({ contactId }: { contactId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!body.trim()) return;
    setBusy(true);
    await fetch("/api/admin/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "note", contactId, body }),
    });
    setBusy(false);
    setBody("");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Internal note (never shown to the user)…"
        rows={2}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={busy}
        onClick={add}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        Add note
      </button>
    </div>
  );
}
