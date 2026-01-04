import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { getProjectById } from "@/lib/repositories/projects";
import { listFilesByProject } from "@/lib/repositories/files";
import { filterProjectsForUser } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { FileUploadForm } from "@/components/projects/file-upload-form";

export default async function ProjectFilesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const project = getProjectById(projectId);
  if (!project || !filterProjectsForUser(user, [project]).length) redirect("/projects");

  const files = listFilesByProject(project.id);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">Files</p>
        <h1 className="text-2xl font-semibold">{project.name}</h1>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project files</CardTitle>
          {user.role !== "client" && <FileUploadForm projectId={project.id} userId={user.id} />}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.fileName}</TableCell>
                  <TableCell>{file.fileType}</TableCell>
                  <TableCell>{formatDate(file.uploadedAt)}</TableCell>
                </TableRow>
              ))}
              {files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                    No files yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

