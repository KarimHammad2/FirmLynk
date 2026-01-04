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
import { upsertProposalAction, markProposalSentAction } from "@/app/actions/proposals";
import { Proposal, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(2),
  description: z.string().min(4),
  clientId: z.string().min(1),
  status: z.enum(["draft", "sent"]),
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
});

type FormValues = z.infer<typeof schema>;

type Props = {
  projectId: string;
  firmId: string;
  userId: string;
  proposal?: Proposal;
  clients: User[];
};

export function ProposalEditor({ projectId, firmId, userId, proposal, clients }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: proposal
      ? {
          title: proposal.title,
          description: proposal.description,
          clientId: proposal.clientId,
          status: proposal.status,
          lineItems: proposal.lineItems.map((li) => ({
            ...li,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
          })),
        }
      : {
          title: "",
          description: "",
          clientId: clients[0]?.id ?? "",
          status: "draft",
          lineItems: [
            {
              id: crypto.randomUUID(),
              description: "Concept design",
              quantity: 1,
              unitPrice: 10000,
            },
          ],
        },
  });

  const lineItems = form.watch("lineItems");

  const total = useMemo(
    () => lineItems.reduce((sum, li) => sum + (li.quantity || 0) * (li.unitPrice || 0), 0),
    [lineItems]
  );

  const addLine = () => {
    form.setValue("lineItems", [
      ...lineItems,
      { id: crypto.randomUUID(), description: "Line item", quantity: 1, unitPrice: 0 },
    ]);
  };

  const updateLine = (index: number, field: keyof FormValues["lineItems"][number], value: string) => {
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
    startTransition(async () => {
      await upsertProposalAction({
        ...values,
        lineItems: values.lineItems,
        id: proposal?.id,
        projectId,
        firmId,
        userId,
      });
      toast({ title: "Proposal saved" });
    });
  };

  const markSent = () => {
    if (!proposal) return;
    startTransition(async () => {
      await markProposalSentAction(proposal.id, projectId, userId);
      toast({ title: "Marked as sent" });
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{proposal ? "Edit Proposal" : "New Proposal"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...form.register("title")} />
              </div>
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
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={4} {...form.register("description")} />
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

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant="outline" className="capitalize">
                  {proposal?.status ?? "draft"}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">{formatCurrency(total)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
              {proposal?.status === "draft" && (
                <Button type="button" variant="outline" onClick={markSent} disabled={isPending}>
                  Mark as Sent
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {proposal && (
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
                {proposal.auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{entry.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.userId}</TableCell>
                  </TableRow>
                ))}
                {proposal.auditLog.length === 0 && (
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

