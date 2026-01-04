import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/repositories/projects";
import { listFilesByProject } from "@/lib/repositories/files";
import { listProposalsByProject } from "@/lib/repositories/proposals";
import { listInvoicesByProject } from "@/lib/repositories/invoices";
import { listFieldReportsByProject } from "@/lib/repositories/field-reports";
import { listUsersByFirm } from "@/lib/repositories/users";
import { filterProjectsForUser } from "@/lib/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileUploadForm } from "@/components/projects/file-upload-form";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const project = getProjectById(projectId);
  if (!project || !filterProjectsForUser(user, [project]).length) {
    redirect("/projects");
  }

  const files = listFilesByProject(project.id);
  const proposals = listProposalsByProject(project.id);
  const invoices = listInvoicesByProject(project.id);
  const reports =
    user.role === "client"
      ? listFieldReportsByProject(project.id).filter((r) => r.status !== "draft")
      : listFieldReportsByProject(project.id);
  const clients = listUsersByFirm(user.firmId, ["client"]);

  const clientLookup = new Map(clients.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Project</p>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="capitalize">
            {project.status}
          </Badge>
          {user.role !== "client" && (
            <Button asChild variant="secondary">
              <Link href={`/projects/${project.id}/proposals/new`}>New Proposal</Link>
            </Button>
          )}
          {user.role !== "client" && (
            <Button asChild>
              <Link href={`/projects/${project.id}/invoices/new`}>New Invoice</Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="reports">Field Reports</TabsTrigger>
          {user.role !== "client" && <TabsTrigger value="notes">Internal Notes</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <SummaryItem label="Status" value={project.status} />
              <SummaryItem
                label="Clients"
                value={
                  project.clientIds
                    .map((id) => clientLookup.get(id))
                    .filter(Boolean)
                    .join(", ") || "None"
                }
              />
              <SummaryItem
                label="Open proposals"
                value={proposals.filter((p) => p.status === "draft").length}
              />
              <SummaryItem
                label="Open invoices"
                value={invoices.filter((inv) => inv.status !== "paid").length}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.activityLog.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatDate(entry.createdAt)}</TableCell>
                      <TableCell className="capitalize">{entry.type}</TableCell>
                      <TableCell>{entry.message}</TableCell>
                    </TableRow>
                  ))}
                  {project.activityLog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No activity yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Files</CardTitle>
                <p className="text-sm text-muted-foreground">Metadata only; stored in-memory.</p>
              </div>
              {user.role !== "client" && (
                <FileUploadForm projectId={project.id} userId={user.id} />
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>{file.fileName}</TableCell>
                      <TableCell>{file.fileType}</TableCell>
                      <TableCell>{formatDate(file.uploadedAt)}</TableCell>
                    </TableRow>
                  ))}
                  {files.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No files uploaded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proposals">
          <Card>
            <CardHeader>
              <CardTitle>Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">{proposal.title}</TableCell>
                      <TableCell className="capitalize">{proposal.status}</TableCell>
                      <TableCell>{clientLookup.get(proposal.clientId) ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(proposal.total)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${project.id}/proposals/${proposal.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {proposals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        No proposals yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.description ?? "Invoice"}
                      </TableCell>
                      <TableCell className="capitalize">{invoice.status}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${project.id}/invoices/${invoice.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        No invoices yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Field Review Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell className="capitalize">{report.status}</TableCell>
                      <TableCell>{formatDate(report.updatedAt ?? report.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${project.id}/field-review-reports/${report.id}`}>
                            Open
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        No field reports yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role !== "client" && (
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{project.internalNotes ?? "No notes yet."}</p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

