import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/repositories/db";
import {
  filterInvoicesForUser,
  filterProjectsForUser,
  filterProposalsForUser,
  filterReportsForUser,
} from "@/lib/permissions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = getDb();
  const projects = filterProjectsForUser(user, db.projects);
  const proposals = filterProposalsForUser(user, db.proposals, db.projects);
  const invoices = filterInvoicesForUser(user, db.invoices, db.projects);
  const reports = filterReportsForUser(user, db.fieldReports, db.projects);

  const stats = [
    { label: "Projects", value: projects.length },
    { label: "Proposals", value: proposals.length },
    { label: "Invoices", value: invoices.length },
    { label: "Field Reports", value: reports.length },
  ];

  const recentActivity = projects
    .flatMap((project) =>
      project.activityLog.map((entry) => ({
        project,
        entry,
      }))
    )
    .sort((a, b) => new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of projects, proposals, invoices, and field review reports.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map(({ project, entry }) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.createdAt)}</TableCell>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="mr-2 capitalize">
                      {entry.type}
                    </Badge>
                    {entry.message}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{entry.userId}</TableCell>
                </TableRow>
              ))}
              {recentActivity.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <SummaryRow label="Draft invoices" value={invoices.filter((i) => i.status === "draft").length} />
          <SummaryRow label="Sent invoices" value={invoices.filter((i) => i.status === "sent").length} />
          <SummaryRow label="Paid invoices" value={invoices.filter((i) => i.status === "paid").length} />
          <SummaryRow
            label="Open A/R"
            value={formatCurrency(
              invoices.filter((i) => i.status !== "paid").reduce((sum, inv) => sum + inv.total, 0)
            )}
          />
          <SummaryRow
            label="Proposals sent"
            value={proposals.filter((p) => p.status === "sent").length}
          />
          <SummaryRow
            label="Field reports pending"
            value={reports.filter((r) => r.status !== "sent").length}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

