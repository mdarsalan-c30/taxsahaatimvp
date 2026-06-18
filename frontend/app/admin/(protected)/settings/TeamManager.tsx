"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EffectiveAdminUser } from "@/lib/admin/users";
import { Pill, Table, Td } from "../../_components/ui";

interface RoleOption {
  key: string;
  label: string;
}

export function TeamManager({
  users,
  roles,
  canManage,
  currentEmail,
}: {
  users: EffectiveAdminUser[];
  roles: RoleOption[];
  canManage: boolean;
  currentEmail: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roles[0]?.key ?? "ceo");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const roleLabel = (key: string) =>
    roles.find((r) => r.key === key)?.label ?? key;

  async function call(method: string, body: Record<string, unknown>) {
    setError(null);
    const res = await fetch("/api/admin/team", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }

  async function create() {
    setBusy(true);
    try {
      await call("POST", { email, password, role });
      setOpen(false);
      setEmail("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(id: string, nextRole: string) {
    try {
      await call("PATCH", { id, role: nextRole });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function toggleStatus(u: EffectiveAdminUser) {
    try {
      await call("PATCH", {
        id: u.id,
        status: u.status === "active" ? "disabled" : "active",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function resetPassword(id: string) {
    const pw = window.prompt("New password (min 8 characters)");
    if (!pw) return;
    try {
      await call("PATCH", { id, password: pw });
      window.alert("Password updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function remove(u: EffectiveAdminUser) {
    if (!window.confirm(`Remove ${u.email}? This cannot be undone.`)) return;
    try {
      await call("DELETE", { id: u.id });
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
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            + Add user
          </button>
        </div>
      )}

      {open && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                placeholder="teammate@taxsaathi.com"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Temp password</span>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                placeholder="min 8 characters"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5"
              >
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Adding…" : "Add user"}
            </button>
          </div>
        </div>
      )}

      {error && !open && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <Table headers={["Email", "Role", "Source", "Status", ""]}>
        {users.map((u) => {
          const isSelf = u.email.toLowerCase() === currentEmail.toLowerCase();
          const editable = canManage && u.source === "store";
          return (
            <tr key={u.id}>
              <Td className="font-medium">
                {u.email}
                {isSelf && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </Td>
              <Td>
                {editable ? (
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    {roles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Pill tone="blue">{roleLabel(u.role)}</Pill>
                )}
              </Td>
              <Td>
                <Pill tone={u.source === "env" ? "amber" : "gray"}>
                  {u.source === "env" ? "bootstrap (env)" : "managed"}
                </Pill>
              </Td>
              <Td>
                <Pill tone={u.status === "active" ? "green" : "red"}>
                  {u.status}
                </Pill>
              </Td>
              <Td>
                {editable ? (
                  <div className="flex flex-wrap gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => resetPassword(u.id)}
                      className="text-primary hover:underline"
                    >
                      Reset password
                    </button>
                    {!isSelf && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleStatus(u)}
                          className="text-amber-600 hover:underline"
                        >
                          {u.status === "active" ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(u)}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {u.source === "env" ? "set via ADMIN_USERS" : "—"}
                  </span>
                )}
              </Td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
