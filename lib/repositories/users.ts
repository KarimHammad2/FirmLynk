import { getDb } from "@/lib/repositories/db";
import { Role, User } from "@/lib/types";

type CreateUserInput = Omit<User, "id">;

export function listUsersByFirm(firmId: string, roles?: Role[]): User[] {
  const all = getDb().users.filter((u) => u.firmId === firmId);
  if (!roles || roles.length === 0) return all;
  return all.filter((u) => roles.includes(u.role));
}

export function getUserById(id: string): User | undefined {
  return getDb().users.find((u) => u.id === id);
}

export function createUser(input: CreateUserInput): User {
  const user: User = { id: crypto.randomUUID(), ...input };
  getDb().users.push(user);
  return user;
}

