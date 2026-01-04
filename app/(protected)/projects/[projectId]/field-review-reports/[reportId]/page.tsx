import { redirect } from "next/navigation";
import { FieldReportEditor } from "@/components/reports/field-report-editor";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/repositories/projects";
import { getFieldReportById } from "@/lib/repositories/field-reports";
import { listUsersByFirm } from "@/lib/repositories/users";
import { filterProjectsForUser } from "@/lib/permissions";

const DEFAULT_DISCLAIMERS = [
  "This field review is limited to the areas observed during the visit.",
  "Contractor remains responsible for construction means, methods, and safety.",
];

export default async function FieldReportPage({
  params,
}: {
  params: Promise<{ projectId: string; reportId: string }>;
}) {
  const { projectId, reportId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "client") redirect(`/projects/${projectId}`);

  const project = getProjectById(projectId);
  if (!project || !filterProjectsForUser(user, [project]).length) redirect("/projects");

  const isNew = reportId === "new";
  const report = isNew ? undefined : getFieldReportById(reportId);
  const clients = listUsersByFirm(user.firmId, ["client"]);
  const clientId = report?.clientId ?? clients[0]?.id ?? user.id;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Field review for {project.name}</p>
        <h1 className="text-2xl font-semibold">{report ? "Edit Field Review Report" : "New Field Review Report"}</h1>
      </div>
      <FieldReportEditor
        projectId={project.id}
        firmId={project.firmId}
        clientId={clientId}
        userId={user.id}
        report={report}
        defaultDisclaimers={DEFAULT_DISCLAIMERS}
        clients={clients}
      />
    </div>
  );
}

