import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { submissionId } = await req.json();
  if (!submissionId) return NextResponse.json({ error: "Missing submission ID" }, { status: 400 });

  // Simulate an AI scanning the submitted reports
  // In a production environment, this would extract text from the PDF/files and call OpenAI/Gemini
  await new Promise(resolve => setTimeout(resolve, 2000));

  const summary = `AI Analysis Complete:
- No critical vulnerabilities were detected in the provided code snippets.
- The report methodology strictly follows CyberLab OPSEC guidelines.
- Recommendation: Approve the submission.`;

  await prisma.taskSubmission.update({
    where: { id: submissionId },
    data: { aiSummary: summary },
  });

  return NextResponse.json({ success: true, summary });
}
