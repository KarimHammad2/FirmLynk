import { redirect } from "next/navigation";
import { ProposalEditor } from "@/components/proposals/proposal-editor";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/repositories/projects";
import { getProposalById } from "@/lib/repositories/proposals";
import { listUsersByFirm } from "@/lib/repositories/users";
import { filterProjectsForUser } from "@/lib/permissions";

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ projectId: string; proposalId: string }>;
}) {
  const { projectId, proposalId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "client") redirect(`/projects/${projectId}`);

  const project = getProjectById(projectId);
  if (!project || !filterProjectsForUser(user, [project]).length) redirect("/projects");

  const isNew = proposalId === "new";
  const proposal = isNew ? undefined : getProposalById(proposalId);
  const clients = listUsersByFirm(user.firmId, ["client"]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Proposal for {project.name}</p>
        <h1 className="text-2xl font-semibold">{proposal ? "Edit Proposal" : "New Proposal"}</h1>
      </div>
      <ProposalEditor
        projectId={project.id}
        firmId={project.firmId}
        userId={user.id}
        proposal={proposal}
        clients={clients}
      />
    </div>
  );
}

