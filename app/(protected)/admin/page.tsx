import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { getFirmById } from "@/lib/repositories/firms";
import { listUsersByFirm } from "@/lib/repositories/users";
import { FirmSettingsForm } from "@/components/admin/firm-settings-form";
import { UserManagement } from "@/components/admin/user-management";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const firm = getFirmById(user.firmId);
  const users = listUsersByFirm(user.firmId);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Admin</p>
        <h1 className="text-2xl font-semibold">Firm settings & users</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Firm Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {firm ? <FirmSettingsForm firm={firm} /> : <div className="text-sm text-muted-foreground">Firm not found.</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <UserManagement firmId={user.firmId} users={users} />
        </CardContent>
      </Card>
    </div>
  );
}

