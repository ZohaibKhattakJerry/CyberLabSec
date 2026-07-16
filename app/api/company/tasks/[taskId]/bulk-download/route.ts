import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import JSZip from "jszip";

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolvedParams = await params;
  
  const task = await prisma.task.findUnique({
    where: { id: resolvedParams.taskId },
    include: {
      submissions: {
        include: { employee: true }
      }
    }
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const zip = new JSZip();

  // Create a mock folder for each employee's submission since actual files are URL strings
  // In a real production environment, you would fetch() the actual files from S3/cloud storage
  // and append the blob to the zip. Since we are storing URLs (which might be placeholder or local paths),
  // we will add a summary text file for each submission with the links.
  
  task.submissions.forEach(sub => {
    let files = [];
    try { files = JSON.parse(sub.files); } catch {}
    
    const folderName = `${sub.employee.name.replace(/[^a-zA-Z0-9]/g, '_')}_${sub.employee.employeeCode}`;
    const folder = zip.folder(folderName);
    
    let reportContent = `Employee: ${sub.employee.name}\n`;
    reportContent += `Submitted At: ${new Date(sub.submittedAt).toISOString()}\n`;
    reportContent += `Status: ${sub.status}\n\n`;
    reportContent += `Attached File Links:\n`;
    files.forEach((f: string) => {
      reportContent += `- ${f}\n`;
    });
    
    if (sub.aiSummary) {
      reportContent += `\nAI Summary:\n${sub.aiSummary}\n`;
    }

    if (folder) {
      folder.file("submission_details.txt", reportContent);
    }
  });

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(zipBuffer as unknown, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Task_${task.title.replace(/[^a-zA-Z0-9]/g, '_')}_Submissions.zip"`,
    }
  });
}
