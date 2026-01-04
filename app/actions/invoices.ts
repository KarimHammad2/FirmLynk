"use server";

import { revalidatePath } from "next/cache";
import { updateInvoiceStatus, upsertInvoice } from "@/lib/repositories/invoices";

type UpsertInvoiceInput = {
  id?: string;
  projectId: string;
  firmId: string;
  clientId: string;
  proposalId?: string;
  lineItems: { id?: string; description: string; quantity: number; unitPrice: number }[];
  taxes?: number;
  description?: string;
  notes?: string;
  status?: "draft" | "sent" | "paid";
  userId: string;
};

export async function upsertInvoiceAction(input: UpsertInvoiceInput) {
  const lineItems = input.lineItems.map((li) => ({ ...li, id: li.id ?? crypto.randomUUID() }));
  const invoice = upsertInvoice({ ...input, lineItems });
  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath(`/projects/${input.projectId}/invoices/${invoice.id}`);
  revalidatePath("/projects");
  return invoice;
}

export async function updateInvoiceStatusAction(
  invoiceId: string,
  projectId: string,
  status: "draft" | "sent" | "paid",
  userId: string
) {
  const invoice = updateInvoiceStatus(invoiceId, status, userId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/invoices/${invoiceId}`);
  return invoice;
}

