"use server";

import { revalidatePath } from "next/cache";
import { markProposalSent, upsertProposal } from "@/lib/repositories/proposals";

type UpsertProposalInput = {
  id?: string;
  projectId: string;
  firmId: string;
  clientId: string;
  title: string;
  description: string;
  lineItems: { id?: string; description: string; quantity: number; unitPrice: number }[];
  status?: "draft" | "sent";
  userId: string;
};

export async function upsertProposalAction(input: UpsertProposalInput) {
  const withIds = input.lineItems.map((li) => ({ ...li, id: li.id ?? crypto.randomUUID() }));
  const proposal = upsertProposal({ ...input, lineItems: withIds });
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath(`/projects/${input.projectId}/proposals/${proposal.id}`);
  revalidatePath("/projects");
  return proposal;
}

export async function markProposalSentAction(proposalId: string, projectId: string, userId: string) {
  const proposal = markProposalSent(proposalId, userId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/proposals/${proposalId}`);
  return proposal;
}

