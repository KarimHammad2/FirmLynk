import { addProjectActivity } from "@/lib/repositories/activity";
import { getDb } from "@/lib/repositories/db";
import { Invoice, InvoiceStatus, LineItem } from "@/lib/types";

const calcTotal = (items: LineItem[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

type UpsertInvoiceInput = {
  id?: string;
  projectId: string;
  firmId: string;
  clientId: string;
  proposalId?: string;
  lineItems: LineItem[];
  taxes?: number;
  description?: string;
  notes?: string;
  status?: InvoiceStatus;
  userId: string;
};

export function listInvoicesByProject(projectId: string): Invoice[] {
  return getDb().invoices.filter((inv) => inv.projectId === projectId);
}

export function getInvoiceById(id: string): Invoice | undefined {
  return getDb().invoices.find((inv) => inv.id === id);
}

export function upsertInvoice(input: UpsertInvoiceInput): Invoice {
  const db = getDb();
  const existing = input.id ? getInvoiceById(input.id) : undefined;
  const now = new Date().toISOString();
  const total = calcTotal(input.lineItems) + (input.taxes ?? 0);

  if (existing) {
    existing.clientId = input.clientId;
    existing.proposalId = input.proposalId;
    existing.lineItems = input.lineItems;
    existing.total = total;
    existing.taxes = input.taxes;
    existing.description = input.description;
    existing.notes = input.notes;
    existing.status = input.status ?? existing.status;
    existing.updatedAt = now;
    addAudit(existing, "Invoice updated", input.userId);
    addProjectActivity(existing.projectId, {
      type: "invoice",
      message: "Invoice updated",
      userId: input.userId,
      relatedEntity: { id: existing.id, entityType: "invoice" },
    });
    return existing;
  }

  const invoice: Invoice = {
    id: crypto.randomUUID(),
    firmId: input.firmId,
    projectId: input.projectId,
    clientId: input.clientId,
    proposalId: input.proposalId,
    lineItems: input.lineItems,
    total,
    taxes: input.taxes ?? 0,
    description: input.description,
    notes: input.notes,
    status: input.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    auditLog: [],
  };
  db.invoices.push(invoice);
  addAudit(invoice, "Invoice created", input.userId);
  addProjectActivity(invoice.projectId, {
    type: "invoice",
    message: "Invoice created",
    userId: input.userId,
    relatedEntity: { id: invoice.id, entityType: "invoice" },
  });
  return invoice;
}

export function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  userId: string
): Invoice | undefined {
  const invoice = getInvoiceById(id);
  if (!invoice) return undefined;
  invoice.status = status;
  if (status === "sent") {
    invoice.sentAt = new Date().toISOString();
  }
  if (status === "paid") {
    invoice.paidAt = new Date().toISOString();
  }
  addAudit(invoice, `Invoice marked ${status}`, userId);
  addProjectActivity(invoice.projectId, {
    type: "invoice",
    message: `Invoice ${status}`,
    userId,
    relatedEntity: { id: invoice.id, entityType: "invoice" },
  });
  return invoice;
}

function addAudit(invoice: Invoice, message: string, userId: string) {
  invoice.auditLog.unshift({
    id: crypto.randomUUID(),
    type: "invoice",
    message,
    createdAt: new Date().toISOString(),
    userId,
    relatedEntity: { id: invoice.id, entityType: "invoice" },
  });
}

