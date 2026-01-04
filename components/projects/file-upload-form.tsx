"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFileAction } from "@/app/actions/files";
import { useToast } from "@/hooks/use-toast";

export function FileUploadForm({ projectId, userId }: { projectId: string; userId: string }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const handleSubmit = (formData: FormData) => {
    const fileName = formData.get("fileName") as string;
    const fileType = formData.get("fileType") as string;
    const url = formData.get("url") as string;
    if (!fileName || !fileType || !url) return;
    startTransition(async () => {
      await addFileAction({ projectId, fileName, fileType, url, uploadedBy: userId });
      toast({ title: "File saved", description: "Metadata stored in memory." });
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs">File name</Label>
        <Input name="fileName" placeholder="spec.pdf" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Type</Label>
        <Input name="fileType" placeholder="pdf" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">URL</Label>
        <Input name="url" placeholder="/files/spec.pdf" required />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}

