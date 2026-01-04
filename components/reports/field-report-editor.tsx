"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { upsertFieldReportAction, updateFieldReportStatusAction } from "@/app/actions/field-reports";
import { FieldReviewReport, User } from "@/lib/types";
import { mockAIService } from "@/lib/ai/aiService";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  title: z.string().min(2),
  userEnteredNotes: z.string().min(2),
  aiDraftNarrative: z.string().optional(),
  photos: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string().min(2),
        caption: z.string().optional(),
      })
    )
    .default([]),
  disclaimers: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  projectId: string;
  firmId: string;
  clientId: string;
  userId: string;
  report?: FieldReviewReport;
  defaultDisclaimers: string[];
  clients: User[];
};

export function FieldReportEditor({
  projectId,
  firmId,
  clientId,
  userId,
  report,
  defaultDisclaimers,
  clients,
}: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: report
      ? {
          title: report.title,
          userEnteredNotes: report.userEnteredNotes,
          aiDraftNarrative: report.aiDraftNarrative ?? "",
          photos: report.photos,
          disclaimers: report.disclaimers,
        }
      : {
          title: "Field Review",
          userEnteredNotes: "",
          aiDraftNarrative: "",
          photos: [],
          disclaimers: defaultDisclaimers,
        },
  });

  const addPhoto = () => {
    const photos = form.getValues("photos");
    form.setValue("photos", [...photos, { id: crypto.randomUUID(), url: "/placeholder.png", caption: "" }]);
  };

  const updatePhoto = (index: number, field: "url" | "caption", value: string) => {
    const photos = form.getValues("photos");
    const updated = photos.map((photo, i) =>
      i === index ? ({ ...photo, [field]: value } as FormValues["photos"][number]) : photo
    );
    form.setValue("photos", updated);
  };

  const removePhoto = (index: number) => {
    const photos = [...form.getValues("photos")];
    photos.splice(index, 1);
    form.setValue("photos", photos);
  };

  const runAIDraft = () => {
    const rawNotes = form.getValues("userEnteredNotes");
    startTransition(async () => {
      const narrative = await mockAIService.draftFieldReviewNarrative({
        rawNotes,
        projectContext: `Project ${projectId}`,
      });
      form.setValue("aiDraftNarrative", narrative);
      toast({ title: "Narrative drafted" });
    });
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      await upsertFieldReportAction({
        id: report?.id,
        projectId,
        firmId,
        clientId,
        title: values.title,
        userEnteredNotes: values.userEnteredNotes,
        aiDraftNarrative: values.aiDraftNarrative,
        photos: values.photos,
        disclaimers: values.disclaimers,
        status: report?.status ?? "draft",
        authorId: userId,
      });
      toast({ title: "Report saved" });
    });
  };

  const updateStatus = (status: "draft" | "approved" | "sent") => {
    if (!report) return;
    startTransition(async () => {
      try {
        await updateFieldReportStatusAction(report.id, projectId, status, userId);
        toast({ title: `Report ${status}` });
      } catch (err) {
        toast({
          title: "Unable to update status",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{report ? "Edit Field Review Report" : "New Field Review Report"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Client: {clients.find((c) => c.id === clientId)?.name ?? "Client"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Raw notes</Label>
                <Textarea rows={6} {...form.register("userEnteredNotes")} />
                <Button type="button" variant="outline" size="sm" onClick={runAIDraft} disabled={isPending}>
                  AI Draft Narrative
                </Button>
              </div>
              <div className="space-y-2">
                <Label>AI narrative (editable)</Label>
                <Textarea
                  rows={6}
                  value={form.watch("aiDraftNarrative")}
                  onChange={(e) => form.setValue("aiDraftNarrative", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Photos</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addPhoto}>
                  Add photo
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Caption</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.watch("photos").map((photo, index) => (
                    <TableRow key={photo.id ?? index}>
                      <TableCell>
                        <Input value={photo.url} onChange={(e) => updatePhoto(index, "url", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={photo.caption ?? ""}
                          onChange={(e) => updatePhoto(index, "caption", e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removePhoto(index)}
                          disabled={form.watch("photos").length === 0}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {form.watch("photos").length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No photos yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <Label>Disclaimers</Label>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground space-y-2">
                {form.watch("disclaimers").map((text, idx) => (
                  <p key={idx}>• {text}</p>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant="outline" className="capitalize">
                  {report?.status ?? "draft"}
                </Badge>
              </div>
              <div className="flex gap-2">
                {report && (
                  <>
                    {report.status === "draft" && (
                      <Button type="button" variant="outline" onClick={() => updateStatus("approved")} disabled={isPending}>
                        Approve
                      </Button>
                    )}
                    {report.status === "approved" && (
                      <Button type="button" variant="secondary" onClick={() => updateStatus("sent")} disabled={isPending}>
                        Mark as Sent
                      </Button>
                    )}
                  </>
                )}
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {report && (
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
                {report.auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{entry.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.userId}</TableCell>
                  </TableRow>
                ))}
                {report.auditLog.length === 0 && (
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

