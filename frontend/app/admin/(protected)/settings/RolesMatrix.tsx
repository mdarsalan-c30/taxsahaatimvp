"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedRole } from "@/lib/admin/users";
import { Pill } from "../../_components/ui";

interface PermissionOption {
  key: string;
  label: string;
}

export function RolesMatrix({
  roles,
  permissionCatalog,
  canManage,
}: {
  roles: ResolvedRole[];
  permissionCatalog: PermissionOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(roles.map((r) => [r.key, new Set(r.permissions)]))
  );
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");

  function isOn(roleKey: string, perm: string): boolean {
    return draft[roleKey]?.has(perm) ?? false;
  }

  function toggle(roleKey: string, perm: string) {
    if (!canManage) return;
    setDraft((prev) => {
      const next = new Set(prev[roleKey] ?? []);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return { ...prev, [roleKey]: next };
    });
  }

  function isDirty(role: ResolvedRole): boolean {
    const current = draft[role.key] ?? new Set<string>();
    if (current.size !== role.permissions.length) return true;
    return role.permissions.some((p) => !current.has(p));
  }

  async function save(role: ResolvedRole) {
    setSavingKey(role.key);
    setError(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: role.key,
          permissions: Array.from(draft[role.key] ?? []),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  }

  async function addRole() {
    setError(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: newKey, label: newLabel, permissions: [] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setAddOpen(false);
      setNewKey("");
      setNewLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  }

  async function deleteRole(role: ResolvedRole) {
    if (!window.confirm(`Delete custom role "${role.label}"?`)) return;
    setError(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: role.key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
          >
            + Custom role
          </button>
        </div>
      )}

      {addOpen && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Key</span>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                placeholder="finance"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Label</span>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                placeholder="Finance"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addRole}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Create role
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Permission
              </th>
              {roles.map((r) => (
                <th
                  key={r.key}
                  className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="uppercase tracking-wide">{r.label}</span>
                    <span className="font-normal normal-case text-[10px]">
                      {r.builtin ? "built-in" : "custom"} · {r.userCount} user
                      {r.userCount === 1 ? "" : "s"}
                    </span>
                    {!r.builtin && canManage && r.userCount === 0 && (
                      <button
                        type="button"
                        onClick={() => deleteRole(r)}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        delete
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionCatalog.map((perm) => (
              <tr key={perm.key} className="border-b border-border/60">
                <td className="px-4 py-2">
                  <span className="font-medium">{perm.label}</span>
                  <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                    {perm.key}
                  </span>
                </td>
                {roles.map((r) => (
                  <td key={r.key} className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={isOn(r.key, perm.key)}
                      disabled={!canManage}
                      onChange={() => toggle(r.key, perm.key)}
                      className="h-4 w-4 accent-primary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {canManage && (
            <tfoot>
              <tr>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  Save edited columns
                </td>
                {roles.map((r) => (
                  <td key={r.key} className="px-3 py-3 text-center">
                    {isDirty(r) ? (
                      <button
                        type="button"
                        disabled={savingKey === r.key}
                        onClick={() => save(r)}
                        className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        {savingKey === r.key ? "Saving…" : "Save"}
                      </button>
                    ) : (
                      <Pill tone="green">saved</Pill>
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
