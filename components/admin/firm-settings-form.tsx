"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFirmSettingsAction } from "@/app/actions/admin";
import { Firm } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2),
  logoUrl: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function FirmSettingsForm({ firm }: { firm: Firm }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: firm.name,
      logoUrl: firm.settings.logoUrl ?? "",
      contactEmail: firm.settings.contactEmail ?? "",
      contactPhone: firm.settings.contactPhone ?? "",
      address: firm.settings.address ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      await updateFirmSettingsAction(firm.id, values);
      toast({ title: "Settings saved" });
    });
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label>Logo URL</Label>
        <Input {...form.register("logoUrl")} />
      </div>
      <div className="space-y-2">
        <Label>Contact email</Label>
        <Input {...form.register("contactEmail")} />
      </div>
      <div className="space-y-2">
        <Label>Contact phone</Label>
        <Input {...form.register("contactPhone")} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Address</Label>
        <Input {...form.register("address")} />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

