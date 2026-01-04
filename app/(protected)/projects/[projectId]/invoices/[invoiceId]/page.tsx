import { redirect } from "next/navigation";
import { InvoiceEditor } from "@/components/invoices/invoice-editor";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/repositories/projects";
import { getInvoiceById } from "@/lib/repositories/invoices";
import { listProposalsByProject } from "@/lib/repositories/proposals";
import { listUsersByFirm } from "@/lib/repositories/users";
import { filterProjectsForUser } from "@/lib/permissions";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ projectId: string; invoiceId: string }>;
}) {
  const { projectId, invoiceId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "client") redirect(`/projects/${projectId}`);

  const project = getProjectById(projectId);
  if (!project || !filterProjectsForUser(user, [project]).length) redirect("/projects");

  const isNew = invoiceId === "new";
  const invoice = isNew ? undefined : getInvoiceById(invoiceId);
  const proposals = listProposalsByProject(project.id);
  const clients = listUsersByFirm(user.firmId, ["client"]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Invoice for {project.name}</p>
        <h1 className="text-2xl font-semibold">{invoice ? "Edit Invoice" : "New Invoice"}</h1>
      </div>
      <InvoiceEditor
        projectId={project.id}
        firmId={project.firmId}
        userId={user.id}
        invoice={invoice}
        proposals={proposals}
        clients={clients}
      />
    </div>
  );
}

