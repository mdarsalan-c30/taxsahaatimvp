import { PageHeader, Card } from "../../_components/ui";

export const dynamic = "force-dynamic";

export default async function CredentialsPage() {
  const credentials = [
    {
      role: "Admin (CEO)",
      email: "emailnikhil95@gmail.com",
      password: "ITR2026",
      type: "Admin",
      portal: "/admin/login",
    },
    {
      role: "Admin (Content Writer)",
      email: "content@lmitr.com",
      password: "123@qwerty",
      type: "Admin",
      portal: "/admin/login",
    },
    {
      role: "CA Partner (B2B)",
      email: "partner@taxsaathi.com",
      password: "Partner2026",
      type: "Professional CA",
      portal: "/auth/ca-login",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Testing Credentials"
        subtitle="Default passwords for testing different roles"
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Type</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Role</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Email</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Password</th>
                <th className="pb-3 font-medium text-muted-foreground">Login URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {credentials.map((cred, i) => (
                <tr key={i} className="group transition-colors hover:bg-muted/50">
                  <td className="py-3 pr-4 font-medium">{cred.type}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{cred.role}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{cred.email}</td>
                  <td className="py-3 pr-4 font-mono text-xs">{cred.password}</td>
                  <td className="py-3">
                    <a
                      href={cred.portal}
                      target="_blank"
                      className="text-primary hover:underline"
                    >
                      {cred.portal}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Note for store/DB users:</p>
        <p className="mt-1">
          Users created from the Team settings will not show up here because their passwords are irreversibly hashed in the database.
          Use these default accounts to log in and test.
        </p>
      </div>
    </div>
  );
}
