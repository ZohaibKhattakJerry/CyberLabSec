import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";
import { generateAssessmentBank } from "@/lib/assessmentEngine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { mcqCount = 10, openCount = 5 } = body;

    const posting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!posting) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    // Call the local NLP/Heuristic engine
    const { assessmentBank, answerKey } = generateAssessmentBank(
      {
        title: posting.title,
        department: posting.department,
        description: posting.description,
        requirements: posting.requirements,
        experienceLevel: posting.experienceLevel,
        niceToHave: posting.niceToHave || "",
        type: posting.type,
      },
      { mcqCount, openCount }
    );

    // Save generated bank and answer key back to the posting
    const updated = await prisma.jobPosting.update({
      where: { id },
      data: {
        assessmentSettings: JSON.stringify({ mcqCount, openCount }),
        assessmentBank: JSON.stringify(assessmentBank),
        answerKey: JSON.stringify(answerKey),
      },
    });

    return NextResponse.json({
      message: "Assessment generated successfully",
      assessmentBank,
    });
  } catch (error: any) {
    console.error("Assessment generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
