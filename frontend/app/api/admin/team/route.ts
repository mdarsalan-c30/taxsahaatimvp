import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/rbac";
import { writeAudit } from "@/lib/admin/audit";
import {
  createAdminUser,
  deleteAdminUser,
  listEffectiveUsers,
  listRoles,
  listStoreUsers,
  updateAdminUser,
} from "@/lib/admin/users";
import type { AdminUserStatus } from "@/lib/db/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, "manageTeam");
  if (auth instanceof NextResponse) return auth;
  const [users, roles] = await Promise.all([listEffectiveUsers(), listRoles()]);
  return NextResponse.json({ users, roles });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, "manageTeam");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    email?: string;
    password?: string;
    role?: string;
  };
  if (!body.email || !body.password || !body.role) {
    return NextResponse.json(
      { error: "Email, password and role are required" },
      { status: 400 }
    );
  }

  const { user, error } = await createAdminUser({
    email: body.email,
    password: body.password,
    role: body.role,
    createdBy: auth.email,
  });
  if (error || !user) {
    return NextResponse.json({ error: error ?? "Create failed" }, { status: 400 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "team.user.create",
    entity: "adminUsers",
    entityId: user.id,
    after: { email: user.email, role: user.role, status: user.status },
  });
  return NextResponse.json({ ok: true, user });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request, "manageTeam");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    id?: string;
    role?: string;
    status?: AdminUserStatus;
    password?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  // Guard against locking yourself out.
  const target = (await listStoreUsers()).find((u) => u.id === body.id);
  if (
    target &&
    body.status === "disabled" &&
    target.email.toLowerCase() === auth.email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "You cannot disable your own account" },
      { status: 400 }
    );
  }

  const { user, error } = await updateAdminUser(body.id, {
    role: body.role,
    status: body.status,
    password: body.password,
  });
  if (error || !user) {
    return NextResponse.json({ error: error ?? "Update failed" }, { status: 400 });
  }

  await writeAudit({
    adminEmail: auth.email,
    action: "team.user.update",
    entity: "adminUsers",
    entityId: user.id,
    after: {
      email: user.email,
      role: user.role,
      status: user.status,
      passwordChanged: body.password !== undefined,
    },
  });
  return NextResponse.json({ ok: true, user });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, "manageTeam");
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const target = (await listStoreUsers()).find((u) => u.id === body.id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.email.toLowerCase() === auth.email.toLowerCase()) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 }
    );
  }

  await deleteAdminUser(body.id);
  await writeAudit({
    adminEmail: auth.email,
    action: "team.user.delete",
    entity: "adminUsers",
    entityId: body.id,
    before: { email: target.email, role: target.role },
  });
  return NextResponse.json({ ok: true });
}
