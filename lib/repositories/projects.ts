import { addProjectActivity } from "@/lib/repositories/activity";
import { getDb } from "@/lib/repositories/db";
import { Project, ProjectStatus, User } from "@/lib/types";

export function listProjectsByFirm(firmId: string, status?: ProjectStatus): Project[] {
  return getDb().projects.filter(
    (p) => p.firmId === firmId && (!status || p.status === status)
  );
}

export function getProjectById(id: string): Project | undefined {
  return getDb().projects.find((p) => p.id === id);
}

export function listProjectsForUser(user: User): Project[] {
  const all = listProjectsByFirm(user.firmId);
  if (user.role === "client") {
    return all.filter((p) => p.clientIds.includes(user.id));
  }
  return all;
}

type CreateProjectInput = {
  firmId: string;
  name: string;
  description: string;
  status?: ProjectStatus;
  clientIds?: string[];
  internalNotes?: string;
  userId: string;
};

export function createProject(input: CreateProjectInput): Project {
  const project: Project = {
    id: crypto.randomUUID(),
    firmId: input.firmId,
    name: input.name,
    description: input.description,
    status: input.status ?? "planning",
    clientIds: input.clientIds ?? [],
    internalNotes: input.internalNotes,
    activityLog: [],
  };
  getDb().projects.push(project);
  addProjectActivity(project.id, {
    type: "project",
    message: "Project created",
    userId: input.userId,
    relatedEntity: { id: project.id, entityType: "project" },
  });
  return project;
}

type UpdateProjectInput = Partial<Omit<Project, "id" | "firmId" | "activityLog">> & {
  userId?: string;
};

export function updateProject(id: string, updates: UpdateProjectInput): Project | undefined {
  const project = getProjectById(id);
  if (!project) return undefined;
  Object.assign(project, updates);
  if (updates.userId) {
    addProjectActivity(project.id, {
      type: "project",
      message: "Project updated",
      userId: updates.userId,
      relatedEntity: { id: project.id, entityType: "project" },
    });
  }
  return project;
}

export function canUserAccessProject(user: User, project: Project): boolean {
  if (user.firmId !== project.firmId) return false;
  if (user.role === "client") {
    return project.clientIds.includes(user.id);
  }
  return true;
}

