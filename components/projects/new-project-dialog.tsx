"use client";

import React, { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectAction } from "@/app/actions/projects";
import { useToast } from "@/hooks/use-toast";
import { ProjectStatus, User } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NO_CLIENT_VALUE = "none";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(4),
  status: z.enum(["planning", "active", "on-hold", "completed"]),
  clientId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function NewProjectDialog({
  firmId,
  userId,
  clients,
}: {
  firmId: string;
  userId: string;
  clients: User[];
}) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      clientId: NO_CLIENT_VALUE,
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      await createProjectAction({
        firmId,
        name: values.name,
        description: values.description,
        status: values.status as ProjectStatus,
        clientIds: values.clientId && values.clientId !== NO_CLIENT_VALUE ? [values.clientId] : [],
        userId,
      });
      toast({ title: "Project created" });
      form.reset();
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Set up a new project for your firm.</DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name")} placeholder="Project name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} placeholder="Short description" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as FormValues["status"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Invite client (optional)</Label>
            <Select
              value={form.watch("clientId")}
              onValueChange={(value) => form.setValue("clientId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLIENT_VALUE}>No client yet</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

