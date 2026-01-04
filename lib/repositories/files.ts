import { addProjectActivity } from "@/lib/repositories/activity";
import { getDb } from "@/lib/repositories/db";
import { ProjectFile } from "@/lib/types";

export function listFilesByProject(projectId: string): ProjectFile[] {
  return getDb().files.filter((f) => f.projectId === projectId);
}

type CreateFileInput = Omit<ProjectFile, "id" | "uploadedAt">;

export function addProjectFile(input: CreateFileInput): ProjectFile {
  const file: ProjectFile = {
    ...input,
    id: crypto.randomUUID(),
    uploadedAt: new Date().toISOString(),
  };
  getDb().files.push(file);
  addProjectActivity(file.projectId, {
    type: "file",
    message: `File uploaded: ${file.fileName}`,
    userId: file.uploadedBy,
    relatedEntity: { id: file.id, entityType: "file" },
  });
  return file;
}

