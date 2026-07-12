import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeOpenAnswer } from "@/lib/gemini";

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

  // Mark as used immediately to prevent double-submission
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { tokenUsed: true, startedAt: session.startedAt || new Date(), completedAt: new Date() },
  });

  const questions = JSON.parse(session.questions as string);
  const perQuestionScore: Array<{ questionId: string; score: number; maxPoints: number; aiLikelihood?: number }> = [];
  let totalScore = 0;
  let maxPossibleScore = 0;
  let aiLikelihoodTotal = 0;
  let openAnswerCount = 0;

  // Grade each question
  for (const q of questions) {
    maxPossibleScore += q.points;
    const answer = answers[q.id] || "";

    if (q.type === "mcq") {
      const correct = parseInt(answer) === q.correctOption;
      const score = correct ? q.points : 0;
      totalScore += score;
      perQuestionScore.push({ questionId: q.id, score, maxPoints: q.points });
    } else {
      // Open-ended — grade with Gemini
      try {
        const grade = await gradeOpenAnswer(q.prompt, q.rubric || "", answer, q.points);
        totalScore += grade.score;
        aiLikelihoodTotal += grade.aiLikelihood;
        openAnswerCount++;
        perQuestionScore.push({ questionId: q.id, score: grade.score, maxPoints: q.points, aiLikelihood: grade.aiLikelihood });
      } catch {
        // Fallback: 0 score if grading fails
        perQuestionScore.push({ questionId: q.id, score: 0, maxPoints: q.points });
      }
    }
  }

  // Normalize score to 100
  const normalizedScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  // Calculate average AI likelihood for open answers
  const avgAiLikelihood = openAnswerCount > 0 ? aiLikelihoodTotal / openAnswerCount : 0;

  // Combined suspicion score
  const suspicionScore =
    (cheatingSignals.pasteAttempts * 30) +
    (cheatingSignals.tabBlurCount * 20) +
    (suspicionFlag ? 40 : 0) +
    (avgAiLikelihood > 0.7 ? 50 : 0);

  const terminated = suspicionScore >= 60;
  const passMark = session.applicant.jobPosting.passMark;

  let result: string;
  if (terminated) {
    result = "Cheating";
  } else if (normalizedScore >= passMark) {
    result = "Passed";
  } else {
    result = "Failed";
  }

  // Update session
  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      answers: JSON.stringify(answers),
      perQuestionScore: JSON.stringify(perQuestionScore),
      cheatingSignals: JSON.stringify({ ...cheatingSignals, avgAiLikelihood, suspicionScore }),
      totalScore: normalizedScore,
      result,
    },
  });

  // Update applicant status
  const newStatus = terminated ? "Failed" : result === "Passed" ? "Passed" : "Failed";
  await prisma.applicant.update({
    where: { id: session.applicantId },
    data: { status: newStatus },
  });

  return NextResponse.json({ result, score: normalizedScore, terminated });
}
