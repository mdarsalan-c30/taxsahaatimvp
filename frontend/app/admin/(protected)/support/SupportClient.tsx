"use client";

import { useRouter } from "next/navigation";

export function TicketActions({
  id,
  status,
}: {
  id: string;
  status: "open" | "closed";
}) {
  const router = useRouter();

  async function act(action: "close" | "assign") {
    await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    router.refresh();
  }

  if (status === "closed") return null;
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => act("assign")}
        className="text-xs text-primary hover:underline"
      >
        Assign to me
      </button>
      <button
        type="button"
        onClick={() => act("close")}
        className="text-xs text-muted-foreground hover:underline"
      >
        Close
      </button>
    </div>
  );
}
