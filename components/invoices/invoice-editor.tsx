"use client";

import React, { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { upsertInvoiceAction, updateInvoiceStatusAction } from "@/app/actions/invoices";
import { Invoice, Proposal, User } from "@/lib/types";
import { mockAIService } from "@/lib/ai/aiService";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const NO_PROPOSAL_VALUE = "none";

const schema = z.object({
  clientId: z.string().min(1),
  proposalId: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string().min(1),
        quantity: z.number().min(0),
        unitPrice: z.number().min(0),
      })
    )
    .min(1),
  taxes: z.number().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "paid"]),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  projectId: string;
  firmId: string;
  userId: string;
  invoice?: Invoice;
  proposals: Proposal[];
  clients: User[];
};

export function InvoiceEditor({ projectId, firmId, userId, invoice, proposals, clients }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: invoice
      ? {
          clientId: invoice.clientId,
          proposalId: invoice.proposalId ?? NO_PROPOSAL_VALUE,
          lineItems: invoice.lineItems.map((li) => ({
            ...li,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
          })),
          taxes: invoice.taxes ?? 0,
          description: invoice.description ?? "",
          notes: invoice.notes ?? "",
          status: invoice.status,
        }
      : {
          clientId: clients[0]?.id ?? "",
          proposalId: NO_PROPOSAL_VALUE,
          lineItems: [
            { id: crypto.randomUUID(), description: "Professional services", quantity: 1, unitPrice: 5000 },
          ],
          taxes: 0,
          description: "",
          notes: "",
          status: "draft",
        },
  });

  const lineItems = form.watch("lineItems");
  const total = useMemo(
    () => lineItems.reduce((sum, li) => sum + (li.quantity || 0) * (li.unitPrice || 0), 0) + (form.watch("taxes") || 0),
    [lineItems, form]
  );

  const addLine = () => {
    form.setValue("lineItems", [
      ...lineItems,
      { id: crypto.randomUUID(), description: "Line item", quantity: 1, unitPrice: 0 },
    ]);
  };

  const updateLine = (index: number, field: "description" | "quantity" | "unitPrice", value: string) => {
    const numeric = field === "quantity" || field === "unitPrice" ? Number(value) : value;
    const updated = lineItems.map((item, i) =>
      i === index ? ({ ...item, [field]: numeric } as FormValues["lineItems"][number]) : item
    );
    form.setValue("lineItems", updated);
  };

  const removeLine = (index: number) => {
    const copy = [...lineItems];
    copy.splice(index, 1);
    form.setValue("lineItems", copy);
  };

  const onSubmit = (values: FormValues) => {
    const proposalId = values.proposalId === NO_PROPOSAL_VALUE ? undefined : values.proposalId;
    startTransition(async () => {
      await upsertInvoiceAction({
        ...values,
        proposalId,
        id: invoice?.id,
        projectId,
        firmId,
        userId,
      });
      toast({ title: "Invoice saved" });
    });
  };

  const markStatus = (status: "draft" | "sent" | "paid") => {
    if (!invoice) return;
    startTransition(async () => {
      await updateInvoiceStatusAction(invoice.id, projectId, status, userId);
      toast({ title: `Marked ${status}` });
    });
  };

  const prefillFromProposal = (proposalId: string) => {
    if (!proposalId) return;
    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return;
    form.setValue(
      "lineItems",
      proposal.lineItems.map((li) => ({ ...li }))
    );
    form.setValue("proposalId", proposalId);
    form.setValue("clientId", proposal.clientId);
  };

  const runAIDraft = () => {
    const projectSummary = `Invoice for project ${projectId}`;
    const workPerformed = lineItems.map((li) => `${li.description} (${li.quantity} @ ${li.unitPrice})`).join("; ");
    const notes = form.watch("notes") ?? "";
    startTransition(async () => {
      const text = await mockAIService.draftInvoiceText({ projectSummary, workPerformed, notes });
      form.setValue("description", text);
      toast({ title: "AI draft generated" });
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{invoice ? "Edit Invoice" : "New Invoice"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={form.watch("clientId")}
                  onValueChange={(value) => form.setValue("clientId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link proposal</Label>
                <Select
                  value={form.watch("proposalId") ?? NO_PROPOSAL_VALUE}
                  onValueChange={(value) => {
                    if (value === NO_PROPOSAL_VALUE) {
                      form.setValue("proposalId", NO_PROPOSAL_VALUE);
                      return;
                    }
                    prefillFromProposal(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PROPOSAL_VALUE}>None</SelectItem>
                    {proposals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addLine}>
                  Add line
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLine(index, "description", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="w-24">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) => updateLine(index, "quantity", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="w-32">
                        <Input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLine(index)}
                          disabled={lineItems.length === 1}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={4}
                  value={form.watch("description")}
                  onChange={(e) => form.setValue("description", e.target.value)}
                />
                <Button type="button" variant="outline" size="sm" onClick={runAIDraft} disabled={isPending}>
                  AI Draft Description
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  rows={4}
                  value={form.watch("notes")}
                  onChange={(e) => form.setValue("notes", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Taxes</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.watch("taxes")}
                  onChange={(e) => form.setValue("taxes", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Badge variant="outline" className="capitalize">
                  {invoice?.status ?? "draft"}
                </Badge>
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">{formatCurrency(total)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
              {invoice && invoice.status !== "paid" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => markStatus(invoice.status === "sent" ? "paid" : "sent")}
                  disabled={isPending}
                >
                  Mark as {invoice.status === "sent" ? "Paid" : "Sent"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {invoice && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{entry.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.userId}</TableCell>
                  </TableRow>
                ))}
                {invoice.auditLog.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      No audit events yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

