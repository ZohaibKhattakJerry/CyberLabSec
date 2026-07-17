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
    const { mcqCount = 10, openCount = 5, jobData } = body;

    let postingInfo = jobData;

    if (!postingInfo || id !== "new") {
      const posting = await prisma.jobPosting.findUnique({
        where: { id },
      });

      if (!posting) {
        return NextResponse.json({ error: "Job posting not found and no job data provided" }, { status: 404 });
      }

      postingInfo = {
        title: posting.title,
        department: posting.department,
        description: posting.description,
        requirements: posting.requirements,
        experienceLevel: posting.experienceLevel,
        niceToHave: posting.niceToHave || "",
        type: posting.type,
      };
    }

    // Call the local NLP/Heuristic engine
    const { assessmentBank, answerKey } = generateAssessmentBank(
      {
        title: postingInfo.title || "",
        department: postingInfo.department || "",
        description: postingInfo.description || "",
        requirements: postingInfo.requirements || "",
        experienceLevel: postingInfo.experienceLevel || "",
        niceToHave: postingInfo.niceToHave || "",
        type: postingInfo.type || "",
      },
      { mcqCount, openCount }
    );

    // Return generated bank and answer key to the client
    // (Do not save immediately, allow the user to review and save)

    return NextResponse.json({
      message: "Assessment generated successfully",
      assessmentBank,
      answerKey,
    });
  } catch (error: any) {
    console.error("Assessment generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
