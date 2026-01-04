import { getDb } from "@/lib/repositories/db";
import { Firm, FirmSettings } from "@/lib/types";

export function listFirms(): Firm[] {
  return getDb().firms;
}

export function getFirmById(id: string): Firm | undefined {
  return getDb().firms.find((f) => f.id === id);
}

export function updateFirmSettings(
  id: string,
  settings: Partial<FirmSettings> & { name?: string }
): Firm | undefined {
  const firm = getFirmById(id);
  if (!firm) return undefined;
  firm.settings = { ...firm.settings, ...settings };
  if (settings.name) {
    firm.name = settings.name;
  }
  return firm;
}

