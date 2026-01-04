"use server";

import { revalidatePath } from "next/cache";
import { updateFieldReportStatus, upsertFieldReport } from "@/lib/repositories/field-reports";

type UpsertFieldReportInput = {
  id?: string;
  projectId: string;
  firmId: string;
  clientId: string;
  title: string;
  userEnteredNotes: string;
  aiDraftNarrative?: string;
  photos: { id: string; url: string; caption?: string }[];
  disclaimers: string[];
  status?: "draft" | "approved" | "sent";
  authorId: string;
};

export async function upsertFieldReportAction(input: UpsertFieldReportInput) {
  const report = upsertFieldReport(input);
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath(`/projects/${input.projectId}/field-review-reports/${report.id}`);
  return report;
}

export async function updateFieldReportStatusAction(
  id: string,
  projectId: string,
  status: "draft" | "approved" | "sent",
  userId: string
) {
  const report = updateFieldReportStatus(id, status, userId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/field-review-reports/${id}`);
  return report;
}

