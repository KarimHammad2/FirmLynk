import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/repositories/db";
import { listUsersByFirm } from "@/lib/repositories/users";
import { filterProjectsForUser } from "@/lib/permissions";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  planning: "bg-blue-50 text-blue-800",
  active: "bg-emerald-50 text-emerald-800",
  "on-hold": "bg-amber-50 text-amber-800",
  completed: "bg-slate-100 text-slate-800",
};

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getDb();
  const projects = filterProjectsForUser(user, db.projects);
  const clients = listUsersByFirm(user.firmId, ["client"]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage active, planning, and completed work.</p>
        </div>
        {user.role !== "client" && <NewProjectDialog firmId={user.firmId} userId={user.id} clients={clients} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant="secondary" className={statusColors[project.status]}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </CardHeader>
            <CardContent className="flex items-end justify-between text-sm">
              <div className="space-y-1">
                <div className="text-muted-foreground">
                  Clients: {project.clientIds.length > 0 ? project.clientIds.length : "None"}
                </div>
                <div className="text-muted-foreground">
                  Last activity: {project.activityLog[0] ? formatDate(project.activityLog[0].createdAt) : "—"}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/projects/${project.id}`}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No projects yet. {user.role !== "client" ? "Create one to get started." : "Contact your firm."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

