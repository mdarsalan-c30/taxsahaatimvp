import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/rbac";
import { Sidebar } from "../_components/Sidebar";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar email={session.email} role={session.role} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
