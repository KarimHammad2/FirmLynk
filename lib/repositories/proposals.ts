import { addProjectActivity } from "@/lib/repositories/activity";
import { getDb } from "@/lib/repositories/db";
import { LineItem, Proposal, ProposalStatus } from "@/lib/types";

const calcTotal = (items: LineItem[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

type UpsertProposalInput = {
  id?: string;
  projectId: string;
  firmId: string;
  clientId: string;
  title: string;
  description: string;
  lineItems: LineItem[];
  status?: ProposalStatus;
  userId: string;
};

export function listProposalsByProject(projectId: string): Proposal[] {
  return getDb().proposals.filter((p) => p.projectId === projectId);
}

export function getProposalById(id: string): Proposal | undefined {
  return getDb().proposals.find((p) => p.id === id);
}

export function upsertProposal(input: UpsertProposalInput): Proposal {
  const db = getDb();
  const existing = input.id ? getProposalById(input.id) : undefined;
  const now = new Date().toISOString();
  const total = calcTotal(input.lineItems);

  if (existing) {
    existing.clientId = input.clientId;
    existing.title = input.title;
    existing.description = input.description;
    existing.lineItems = input.lineItems;
    existing.total = total;
    existing.status = input.status ?? existing.status;
    existing.updatedAt = now;
    addAudit(existing, "Proposal updated", input.userId);
    addProjectActivity(existing.projectId, {
      type: "proposal",
      message: "Proposal updated",
      userId: input.userId,
      relatedEntity: { id: existing.id, entityType: "proposal" },
    });
    return existing;
  }

  const proposal: Proposal = {
    id: crypto.randomUUID(),
    firmId: input.firmId,
    projectId: input.projectId,
    clientId: input.clientId,
    title: input.title,
    description: input.description,
    lineItems: input.lineItems,
    total,
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    auditLog: [],
  };
  db.proposals.push(proposal);
  addAudit(proposal, "Proposal created", input.userId);
  addProjectActivity(proposal.projectId, {
    type: "proposal",
    message: "Proposal created",
    userId: input.userId,
    relatedEntity: { id: proposal.id, entityType: "proposal" },
  });
  return proposal;
}

export function markProposalSent(id: string, userId: string): Proposal | undefined {
  const proposal = getProposalById(id);
  if (!proposal) return undefined;
  proposal.status = "sent";
  proposal.sentAt = new Date().toISOString();
  addAudit(proposal, "Proposal marked as sent", userId);
  addProjectActivity(proposal.projectId, {
    type: "proposal",
    message: "Proposal sent",
    userId,
    relatedEntity: { id: proposal.id, entityType: "proposal" },
  });
  return proposal;
}

function addAudit(proposal: Proposal, message: string, userId: string) {
  proposal.auditLog.unshift({
    id: crypto.randomUUID(),
    type: "proposal",
    message,
    createdAt: new Date().toISOString(),
    userId,
    relatedEntity: { id: proposal.id, entityType: "proposal" },
  });
}

