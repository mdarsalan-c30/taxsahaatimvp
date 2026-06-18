"use client";

import { useRouter } from "next/navigation";

export function CompleteDeletionButton({ id }: { id: string }) {
  const router = useRouter();
  async function complete() {
    await fetch("/api/admin/compliance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={complete}
      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
    >
      Mark deleted
    </button>
  );
}
