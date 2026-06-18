import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/rbac";
import { writeAudit } from "@/lib/admin/audit";
import {
  createCustomRole,
  deleteCustomRole,
  setRolePermissions,
} from "@/lib/admin/users";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "manageTeam");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    key?: string;
    label?: string;
    permissions?: string[];
  };
  if (!body.key) {
    return NextResponse.json({ error: "Role key is required" }, { status: 400 });
  }

  const { role, error } = await createCustomRole({
    key: body.key,
    label: body.label ?? body.key,
    permissions: body.permissions ?? [],
  });
  if (error || !role) {
    return NextResponse.json({ error: error ?? "Create failed" }, { status: 400 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "team.role.create",
    entity: "adminRoles",
    entityId: role.key,
    after: { label: role.label, permissions: role.permissions },
  });
  return NextResponse.json({ ok: true, role });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, "manageTeam");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    key?: string;
    label?: string;
    permissions?: string[];
  };
  if (!body.key || !Array.isArray(body.permissions)) {
    return NextResponse.json(
      { error: "Role key and permissions array are required" },
      { status: 400 }
    );
  }

  const { role, error } = await setRolePermissions(
    body.key,
    body.permissions,
    body.label
  );
  if (error || !role) {
    return NextResponse.json({ error: error ?? "Update failed" }, { status: 400 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "team.role.update",
    entity: "adminRoles",
    entityId: role.key,
    after: { label: role.label, permissions: role.permissions },
  });
  return NextResponse.json({ ok: true, role });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, "manageTeam");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { key?: string };
  if (!body.key) {
    return NextResponse.json({ error: "Role key is required" }, { status: 400 });
  }

  const { ok, error } = await deleteCustomRole(body.key);
  if (error || !ok) {
    return NextResponse.json({ error: error ?? "Delete failed" }, { status: 400 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "team.role.delete",
    entity: "adminRoles",
    entityId: body.key,
  });
  return NextResponse.json({ ok: true });
}
