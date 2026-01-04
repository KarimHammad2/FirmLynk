import { getDb } from "@/lib/repositories/db";
import { ActivityLogEntry } from "@/lib/types";

type ActivityInput = Omit<ActivityLogEntry, "id" | "createdAt"> & {
  createdAt?: string;
};

export function createActivityEntry(input: ActivityInput): ActivityLogEntry {
  return {
    id: crypto.randomUUID(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  };
}

export function addProjectActivity(projectId: string, entry: ActivityInput) {
  const db = getDb();
  const project = db.projects.find((p) => p.id === projectId);
  if (!project) return;
  project.activityLog.unshift(createActivityEntry(entry));
}

