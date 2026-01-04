import { addProjectActivity } from "@/lib/repositories/activity";
import { getDb } from "@/lib/repositories/db";
import { FieldReportStatus, FieldReviewReport } from "@/lib/types";

type UpsertFieldReportInput = {
  id?: string;
  projectId: string;
  firmId: string;
  clientId: string;
  title: string;
  userEnteredNotes: string;
  aiDraftNarrative?: string;
  photos: FieldReviewReport["photos"];
  disclaimers: string[];
  status?: FieldReportStatus;
  authorId: string;
};

export function listFieldReportsByProject(projectId: string): FieldReviewReport[] {
  return getDb().fieldReports.filter((r) => r.projectId === projectId);
}

export function getFieldReportById(id: string): FieldReviewReport | undefined {
  return getDb().fieldReports.find((r) => r.id === id);
}

export function upsertFieldReport(input: UpsertFieldReportInput): FieldReviewReport {
  const db = getDb();
  const existing = input.id ? getFieldReportById(input.id) : undefined;
  const now = new Date().toISOString();

  if (existing) {
    existing.title = input.title;
    existing.userEnteredNotes = input.userEnteredNotes;
    existing.aiDraftNarrative = input.aiDraftNarrative;
    existing.photos = input.photos;
    existing.disclaimers = input.disclaimers;
    existing.status = input.status ?? existing.status;
    existing.updatedAt = now;
    addAudit(existing, "Report updated", input.authorId);
    addProjectActivity(existing.projectId, {
      type: "field-report",
      message: "Field review report updated",
      userId: input.authorId,
      relatedEntity: { id: existing.id, entityType: "field-report" },
    });
    return existing;
  }

  const report: FieldReviewReport = {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    firmId: input.firmId,
    clientId: input.clientId,
    title: input.title,
    userEnteredNotes: input.userEnteredNotes,
    aiDraftNarrative: input.aiDraftNarrative,
    photos: input.photos,
    disclaimers: input.disclaimers,
    status: input.status ?? "draft",
    authorId: input.authorId,
    createdAt: now,
    auditLog: [],
  };
  db.fieldReports.push(report);
  addAudit(report, "Report created", input.authorId);
  addProjectActivity(report.projectId, {
    type: "field-report",
    message: "Field review report created",
    userId: input.authorId,
    relatedEntity: { id: report.id, entityType: "field-report" },
  });
  return report;
}

export function updateFieldReportStatus(
  id: string,
  status: FieldReportStatus,
  userId: string
): FieldReviewReport | undefined {
  const report = getFieldReportById(id);
  if (!report) return undefined;

  if (status === "sent" && report.status !== "approved") {
    throw new Error("Report must be approved before sending.");
  }

  report.status = status;
  if (status === "approved") {
    report.approverId = userId;
    report.approvedAt = new Date().toISOString();
  }
  if (status === "sent") {
    report.sentAt = new Date().toISOString();
  }

  addAudit(report, `Report marked ${status}`, userId);
  addProjectActivity(report.projectId, {
    type: "field-report",
    message: `Report ${status}`,
    userId,
    relatedEntity: { id: report.id, entityType: "field-report" },
  });
  return report;
}

function addAudit(report: FieldReviewReport, message: string, userId: string) {
  report.auditLog.unshift({
    id: crypto.randomUUID(),
    type: "field-report",
    message,
    createdAt: new Date().toISOString(),
    userId,
    relatedEntity: { id: report.id, entityType: "field-report" },
  });
}

