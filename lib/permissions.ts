import { FieldReviewReport, Invoice, Proposal, Project, User } from "@/lib/types";

export function userCanSeeProject(user: User, project: Project) {
  if (user.firmId !== project.firmId) return false;
  if (user.role === "client") {
    return project.clientIds.includes(user.id);
  }
  return true;
}

export function filterProjectsForUser(user: User, projects: Project[]) {
  return projects.filter((project) => userCanSeeProject(user, project));
}

export function filterProposalsForUser(user: User, proposals: Proposal[], projects: Project[]) {
  const allowedProjectIds = new Set(filterProjectsForUser(user, projects).map((p) => p.id));
  return proposals.filter((p) => allowedProjectIds.has(p.projectId));
}

export function filterInvoicesForUser(user: User, invoices: Invoice[], projects: Project[]) {
  const allowedProjectIds = new Set(filterProjectsForUser(user, projects).map((p) => p.id));
  return invoices.filter((inv) => allowedProjectIds.has(inv.projectId));
}

export function filterReportsForUser(
  user: User,
  reports: FieldReviewReport[],
  projects: Project[]
) {
  const allowedProjectIds = new Set(filterProjectsForUser(user, projects).map((p) => p.id));
  if (user.role === "client") {
    return reports.filter(
      (r) =>
        allowedProjectIds.has(r.projectId) && (r.status === "approved" || r.status === "sent")
    );
  }
  return reports.filter((r) => allowedProjectIds.has(r.projectId));
}

