import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, type, department, location, description, requirements, universityRequired, deadline, passMark, showApplicantCount, status, autoShortlist, stipend, experienceLevel, duration, weeklyHours, niceToHave, whatYouGain, openings } = body;

  if (!title || !department || !deadline) {
    return NextResponse.json({ error: "title, department and deadline are required" }, { status: 400 });
  }

  // Generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  };

  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  
  const existing = await prisma.jobPosting.findUnique({ where: { id: slug } });
  if (existing) {
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const { generateQuestionsForJob } = await import("@/lib/questionDictionary");
  const generatedQuestions = generateQuestionsForJob(title || "", description || "", requirements || "");

  let finalAssessmentBank = body.assessmentBank || "[]";
  let finalAnswerKey = body.answerKey || "{}";

  if (finalAssessmentBank === "[]" || finalAssessmentBank === "null") {
    const { generateAssessmentBank } = await import("@/lib/assessmentEngine");
    const ctx = {
      title: title || "",
      department: department || "",
      description: description || "",
      requirements: requirements || "",
      experienceLevel: experienceLevel || "Any",
      niceToHave: niceToHave || "",
      type: type || "Job"
    };
    const settings = typeof body.assessmentSettings === "string" ? JSON.parse(body.assessmentSettings) : (body.assessmentSettings || { mcqCount: 10, openCount: 5 });
    const { assessmentBank, answerKey } = generateAssessmentBank(ctx, settings);
    finalAssessmentBank = JSON.stringify(assessmentBank);
    finalAnswerKey = JSON.stringify(answerKey);
  }

  const posting = await prisma.jobPosting.create({
    data: {
      id: slug,
      title: title.trim(),
      type: type || "Job",
      department: department.trim(),
      location: location?.trim() || "Remote",
      description: description?.trim() || "",
      requirements: requirements?.trim() || "",
      universityRequired: !!universityRequired,
      deadline: new Date(deadline),
      status: status || "Published",
      shortlistThreshold: 0, // Ignored, kept for DB schema compatibility
      passMark: Number(passMark) || 60,
      showApplicantCount: showApplicantCount !== undefined ? !!showApplicantCount : true,
      autoShortlist: autoShortlist !== undefined ? !!autoShortlist : false,
      screeningQuestions: JSON.stringify(generatedQuestions),
      assessmentBank: finalAssessmentBank,
      answerKey: finalAnswerKey,
      assessmentSettings: typeof body.assessmentSettings === "string" ? body.assessmentSettings : JSON.stringify(body.assessmentSettings || { mcqCount: 10, openCount: 5 }),
      stipend: stipend || null,
      experienceLevel: experienceLevel || "Any",
      duration: duration || null,
      weeklyHours: weeklyHours ? parseInt(weeklyHours) : null,
      niceToHave: niceToHave || null,
      whatYouGain: whatYouGain || null,
      openings: openings ? parseInt(openings) : 1
    },
  });

  await prisma.activityLog.create({
    data: { actorId: auth.sub, actorType: "Admin", action: "POSTING_CREATED", metadata: JSON.stringify({ postingId: posting.id, title, status }) },
  }).catch(() => {});

  return NextResponse.json({ success: true, posting }, { status: 201 });
}
