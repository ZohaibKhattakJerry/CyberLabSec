import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeOpenAnswer, screenApplicant } from "@/lib/gemini";
import { extractPdfText } from "@/lib/fileStorage";
import { sendEmail } from "@/lib/email";

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
      const passMark = session.applicant.jobPosting.passMark;
      try {
        const grade = await gradeOpenAnswer(q.prompt, q.rubric || "", answer, q.points, passMark);
        totalScore += grade.score;
        aiLikelihoodTotal += grade.aiLikelihood;
        openAnswerCount++;
        perQuestionScore.push({ questionId: q.id, score: grade.score, maxPoints: q.points, aiLikelihood: grade.aiLikelihood });
      } catch {
        perQuestionScore.push({ questionId: q.id, score: 0, maxPoints: q.points });
      }
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
  const passMark = session.applicant.jobPosting.passMark;
  
  const isFail = terminated || normalizedScore < passMark;
  const newAttempts = session.attempts + 1;
  const hasMoreAttempts = isFail && newAttempts < session.maxAttempts;

  if (isFail && hasMoreAttempts) {
    // Generate new questions for the next attempt
    const cvText = await extractPdfText(session.applicant.cvFileUrl);
    const screening = await screenApplicant(
      cvText,
      session.applicant.fullName,
      session.applicant.jobPosting.title,
      session.applicant.jobPosting.description,
      session.applicant.jobPosting.requirements,
      session.applicant.jobPosting.type as "Job" | "Internship"
    );

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        attempts: newAttempts,
        tokenUsed: false,
        answers: "[]",
        questions: JSON.stringify(screening.questions),
        perQuestionScore: "[]",
        cheatingSignals: "{}",
        result: null,
        totalScore: null,
        startedAt: null,
      },
    });

    return NextResponse.json({ result: "Retry", score: normalizedScore, terminated });
  }

  // Final submission (Passed, or Failed out of attempts)
  const result = terminated ? "Cheating" : normalizedScore >= passMark ? "Passed" : "Failed";

  await prisma.interviewSession.update({
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

  const newStatus = result === "Passed" ? "Final Approval" : "Rejected";
  await prisma.applicant.update({
    where: { id: session.applicantId },
    data: { status: newStatus },
  });

  if (result === "Passed") {
    await prisma.cEOReview.create({
      data: {
        type: "Hire Request",
        applicantId: session.applicantId,
        status: "Pending",
        comments: `Automated Request: Candidate successfully passed the AI interview with a score of ${normalizedScore}%.`,
      },
    });
  }

  // Send Email Notification
  try {
    await sendEmail({
      to: session.applicant.email,
      subject: `Interview Completed - Update on your Application`,
      html: `
        <div>
          <h2 style="font-size: 24px; font-weight: 800; color: #f4f4f5; margin: 0 0 16px 0;">Interview Completed</h2>
          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Hi ${session.applicant.fullName.split(" ")[0]},</p>
          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Thank you for taking the time to complete your AI technical interview for the <strong style="color: #f4f4f5;">${session.applicant.jobPosting.title}</strong> role at CyberLabSec.</p>
          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0;">Your interview has been successfully submitted and scored. Our team is currently reviewing the results.</p>
          <div style="background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 20px 24px; margin: 24px 0;">
            <p style="color: #f4f4f5; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Application Status Update</p>
            <p style="color: #a1a1aa; font-size: 13px; margin: 0; line-height: 1.6;">Your status is now: <strong style="color: #a855f7;">${newStatus}</strong>.</p>
          </div>
          <p style="color: #a1a1aa; font-size: 15px; line-height: 1.7; margin: 0;">Best regards,<br/>The CyberLabSec Team</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Failed to send interview completion email:", e);
  }

  return NextResponse.json({ result, score: normalizedScore, terminated });
}

