"use server";

import { revalidatePath } from "next/cache";
import { createUser } from "@/lib/repositories/users";
import { updateFirmSettings } from "@/lib/repositories/firms";
import { Role } from "@/lib/types";

type CreateUserInput = {
  name: string;
  email: string;
  role: Role;
  firmId: string;
};

export async function createUserAction(input: CreateUserInput) {
  const user = createUser(input);
  revalidatePath("/admin");
  return user;
}

export async function updateFirmSettingsAction(
  firmId: string,
  settings: Partial<{ logoUrl?: string; contactEmail?: string; contactPhone?: string; address?: string; name?: string }>
) {
  const firm = updateFirmSettings(firmId, settings);
  if (settings.name && firm) {
    firm.name = settings.name;
  }
  revalidatePath("/admin");
  return firm;
}

