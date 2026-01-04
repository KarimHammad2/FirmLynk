"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUserAction } from "@/app/actions/admin";
import { Role, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "staff", "client"]),
});

type FormValues = z.infer<typeof schema>;

export function UserManagement({ firmId, users }: { firmId: string; users: User[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: "staff" },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      await createUserAction({ ...values, firmId, role: values.role as Role });
      toast({ title: "User added" });
      form.reset({ name: "", email: "", role: "staff" });
    });
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <form className="grid gap-3 md:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1">
          <Label>Name</Label>
          <Input {...form.register("name")} />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input {...form.register("email")} />
        </div>
        <div className="space-y-1">
          <Label>Role</Label>
          <Select
            value={form.watch("role")}
            onValueChange={(value) => form.setValue("role", value as FormValues["role"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding..." : "Add user"}
          </Button>
        </div>
      </form>
    </div>
  );
}

