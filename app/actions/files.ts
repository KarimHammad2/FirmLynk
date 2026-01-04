"use server";

import { revalidatePath } from "next/cache";
import { addProjectFile } from "@/lib/repositories/files";

type AddFileInput = {
  projectId: string;
  fileName: string;
  fileType: string;
  url: string;
  uploadedBy: string;
};

export async function addFileAction(input: AddFileInput) {
  const file = addProjectFile(input);
  revalidatePath(`/projects/${input.projectId}/files`);
  revalidatePath(`/projects/${input.projectId}`);
  return file;
}

