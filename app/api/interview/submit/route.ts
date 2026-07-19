import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeOpenAnswer } from "@/lib/gemini";
import { sendInterviewCompleteEmail, sendInterviewRetryEmail } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { sessionId, answers, cheatingSignals, suspicionFlag } = await req.json();

  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: { applicant: { include: { jobPosting: true } } },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.tokenUsed) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const questions = JSON.parse(session.questions as string);
  const perQuestionScore: Array<{ questionId: string; score: number; maxPoints: number; aiLikelihood?: number }> = [];
  let totalScore = 0;
  let maxPossibleScore = 0;
  let aiLikelihoodTotal = 0;
  let openAnswerCount = 0;

  // Grade each question in parallel
  const passMark = session.applicant.jobPosting.passMark;
  
  const gradePromises = questions.map(async (q: any) => {
    const answer = answers[q.id] || "";
    
    if (q.type === "mcq") {
      const correct = parseInt(answer) === q.correctOption;
      const score = correct ? q.points : 0;
      return { type: "mcq", questionId: q.id, score, maxPoints: q.points, aiLikelihood: 0 };
    } else {
      try {
        const grade = await gradeOpenAnswer(q.prompt, q.rubric || "", answer, q.points, passMark);
        return { type: "open", questionId: q.id, score: grade.score, maxPoints: q.points, aiLikelihood: grade.aiLikelihood };
      } catch {
        return { type: "open", questionId: q.id, score: 0, maxPoints: q.points, aiLikelihood: 0 };
      }
    }
  });

  const gradedResults = await Promise.all(gradePromises);

  for (const res of gradedResults) {
    maxPossibleScore += res.maxPoints;
    totalScore += res.score;
    if (res.type === "open") {
      aiLikelihoodTotal += res.aiLikelihood;
      openAnswerCount++;
      perQuestionScore.push({ questionId: res.questionId, score: res.score, maxPoints: res.maxPoints, aiLikelihood: res.aiLikelihood });
    } else {
      perQuestionScore.push({ questionId: res.questionId, score: res.score, maxPoints: res.maxPoints });
    }
  }

  // Normalize score to 100
  const normalizedScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  const avgAiLikelihood = openAnswerCount > 0 ? aiLikelihoodTotal / openAnswerCount : 0;

  const suspicionScore =
    (cheatingSignals.pasteAttempts * 30) +
    (cheatingSignals.tabBlurCount * 20) +
    (suspicionFlag ? 40 : 0) +
    (avgAiLikelihood > 0.7 ? 50 : 0);

  const terminated = suspicionScore >= 60;
  
  const isFail = terminated || normalizedScore < passMark;
  const newAttempts = session.attempts + 1;
  const hasMoreAttempts = isFail && newAttempts < session.maxAttempts;

  if (isFail && hasMoreAttempts) {
    // Generate new questions for the next attempt
    const bank = session.applicant.jobPosting.assessmentBank ? JSON.parse(session.applicant.jobPosting.assessmentBank) : [];
    const answerKey = session.applicant.jobPosting.answerKey ? JSON.parse(session.applicant.jobPosting.answerKey) : [];
    const settings = session.applicant.jobPosting.assessmentSettings ? JSON.parse(session.applicant.jobPosting.assessmentSettings) : { mcqCount: 10, openCount: 5 };
    
    let nextQuestions: any[] = [];
    let nextAnswers: any[] = [];
    
    if (bank.length > 0) {
      const { generateApplicantVariant } = await import("@/lib/assessmentEngine");
      const variant = generateApplicantVariant(bank, answerKey, settings);
      nextQuestions = variant.applicantQuestions;
      nextAnswers = variant.applicantAnswers;
    }

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        attempts: newAttempts,
        tokenUsed: false,
        answers: "[]",
        questions: JSON.stringify(nextQuestions),
        perQuestionScore: "[]",
        cheatingSignals: "{}",
        result: null,
        totalScore: null,
        startedAt: null,
      },
    });

    await prisma.applicant.update({
      where: { id: session.applicantId },
      data: { status: "Invited for Interview" }
    });

    await sendInterviewRetryEmail(
      session.applicant.email,
      session.applicant.fullName,
      session.applicant.jobPosting.title,
      normalizedScore,
      session.maxAttempts - newAttempts
    );

    return NextResponse.json({ result: "Retry", score: normalizedScore, terminated });
  }

  // Final submission (Passed, or Failed out of attempts)
  const result = terminated ? "Cheating" : normalizedScore >= passMark ? "Passed" : "Failed";
  const newStatus = result === "Passed" ? "Selected – Waiting for Approval" : "Interview Failed";

  await prisma.$transaction(async (tx) => {
    await tx.interviewSession.update({
      where: { id: sessionId },
      data: {
        attempts: newAttempts,
        tokenUsed: true,
        answers: JSON.stringify(answers),
        perQuestionScore: JSON.stringify(perQuestionScore),
        cheatingSignals: JSON.stringify({ ...cheatingSignals, avgAiLikelihood, suspicionScore }),
        totalScore: normalizedScore,
        result,
        completedAt: new Date(),
      },
    });

    await tx.applicant.update({
      where: { id: session.applicantId },
      data: { status: newStatus },
    });

    await tx.notification.create({
      data: {
        userId: "admin",
        title: "Interview Completed",
        message: `${session.applicant.fullName} scored ${normalizedScore}% for ${session.applicant.jobPosting.title}`,
        type: "Interview",
        link: "/company/applications"
      }
    });
  });

  // Send Email Notification
  try {
    await sendInterviewCompleteEmail(
      session.applicant.email,
      session.applicant.fullName,
      session.applicant.jobPosting.title,
      newStatus
    );
  } catch (e) {
    console.error("Failed to send interview completion email:", e);
  }

  return NextResponse.json({ result, score: normalizedScore, terminated });
}
