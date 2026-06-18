import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/rbac";
import { addNote, completeTask, createTask } from "@/lib/admin/crm";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "manageCrm");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    action?: "task" | "note" | "complete";
    title?: string;
    contactId?: string;
    dueAt?: string | null;
    body?: string;
    id?: string;
  };

  switch (body.action) {
    case "task": {
      if (!body.title?.trim()) {
        return NextResponse.json({ error: "Title required" }, { status: 400 });
      }
      const task = await createTask({
        title: body.title.trim(),
        contactId: body.contactId,
        dueAt: body.dueAt ?? null,
        assignee: auth.email,
      });
      return NextResponse.json({ ok: true, task });
    }
    case "note": {
      if (!body.contactId || !body.body?.trim()) {
        return NextResponse.json(
          { error: "Contact and note body required" },
          { status: 400 }
        );
      }
      const note = await addNote({
        contactId: body.contactId,
        adminEmail: auth.email,
        body: body.body.trim(),
      });
      return NextResponse.json({ ok: true, note });
    }
    case "complete": {
      if (!body.id) {
        return NextResponse.json({ error: "Task id required" }, { status: 400 });
      }
      const task = await completeTask(body.id);
      return NextResponse.json({ ok: true, task });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
