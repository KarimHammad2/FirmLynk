"use server";

import { revalidatePath } from "next/cache";
import { createProject, updateProject } from "@/lib/repositories/projects";

type CreateProjectActionInput = {
  firmId: string;
  name: string;
  description: string;
  status?: "planning" | "active" | "on-hold" | "completed";
  clientIds?: string[];
  internalNotes?: string;
  userId: string;
};

export async function createProjectAction(input: CreateProjectActionInput) {
  const project = createProject(input);
  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  return project;
}

type UpdateProjectActionInput = {
  id: string;
  userId: string;
  status?: "planning" | "active" | "on-hold" | "completed";
  internalNotes?: string;
  clientIds?: string[];
};

export async function updateProjectAction(input: UpdateProjectActionInput) {
  const project = updateProject(input.id, input);
  if (project) {
    revalidatePath("/projects");
    revalidatePath(`/projects/${project.id}`);
  }
  return project;
}

