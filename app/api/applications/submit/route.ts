// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { _hashCNIC, encryptCNIC } from "@/lib/cnic";
import { saveFile, extractPdfText } from "@/lib/fileStorage";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { screenApplicant } from "@/lib/gemini";
import { sendInterviewInvite, sendDeclineEmail, sendApplicationReceivedEmail, sendEmail } from "@/lib/email";
import crypto from "crypto";
import { waitUntil } from "@vercel/functions";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);

  // Rate limit: 4 submissions per 5 minutes per IP
  const { blocked } = await checkRateLimit(`apply-ip:${ip}`, 4, 5);
  if (blocked) {
    return NextResponse.json({ error: "Too many attempts from this IP. Please wait 5 minutes." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const postingId = formData.get("postingId") as string;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const cnic = (formData.get("cnic") as string) || "00000-0000000-0"; // Dummy fallback if empty
  const city = (formData.get("city") as string) || "";
  const universityName = (formData.get("universityName") as string) || "";
  const semester = (formData.get("semester") as string) || "";
  
  const linkedIn = (formData.get("linkedIn") as string) || "";
  const github = (formData.get("github") as string) || "";
  const tryHackMe = (formData.get("tryHackMe") as string) || "";
  const hackTheBox = (formData.get("hackTheBox") as string) || "";
  const portfolio = (formData.get("portfolio") as string) || "";
  const cve = (formData.get("cve") as string) || "";
  const certifications = (formData.get("certifications") as string) || "";
  const motivation = (formData.get("motivation") as string) || "";
//   const emailVerified = formData.get("emailVerified") === "true";

  const consentData = formData.get("consentData") === "true";
  const consentInterview = formData.get("consentInterview") === "true";
  const cvFile = formData.get("cv") as File | null;
  const photoFile = formData.get("photo") as File | null;
  // Honeypot check
  const honeypot = formData.get("website") as string;
  if (honeypot) {
    return NextResponse.json({ error: "Bot detected" }, { status: 400 });
  }

  // Validate core required fields (frontend does deep validation)
  const missingFields = [];
  if (!postingId) missingFields.push("postingId");
  if (!fullName) missingFields.push("fullName");
  if (!email) missingFields.push("email");
  if (!phone) missingFields.push("phone");
  
  if (missingFields.length > 0) {
    return NextResponse.json({ 
      error: `Missing core fields: ${missingFields.join(", ")}. Please ensure you completed step 1.` 
    }, { status: 400 });
  }

  const cnicHash = crypto.createHash("sha256").update(cnic).digest("hex");

  try {
    // Check for duplicate application for THIS posting based on email
    const existing = await prisma.applicant.findFirst({ where: { email: email.toLowerCase().trim(), jobPostingId: postingId } });
    if (existing) {
      const blockedStatuses = ["Failed", "Rejected", "Blocked"];
      if (blockedStatuses.includes(existing.status)) {
        return NextResponse.json({
          error: `A previous application with this email for this role was marked "${existing.status}". You are not eligible to re-apply for this specific role.`,
        }, { status: 403 });
      }
      // Already has active application
      return NextResponse.json({
        error: "An application with this email address already exists for this position. You cannot apply multiple times.",
      }, { status: 409 });
    }

    // Verify posting is published
    const posting = await prisma.jobPosting.findUnique({ where: { id: postingId, status: "Published" } });
    if (!posting) {
      return NextResponse.json({ error: "This position is no longer accepting applications." }, { status: 404 });
    }
    if (posting.deadline < new Date()) {
      return NextResponse.json({ error: "The deadline for this position has passed." }, { status: 410 });
    }

    // Validate CV file type server-side
    const allowedCvTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedCvTypes.includes(cvFile.type)) {
      return NextResponse.json({ error: "CV must be a PDF or Word document" }, { status: 400 });
    }
    if (cvFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "CV file too large (max 5MB)" }, { status: 400 });
    }

    // Save files
    const emailHash = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
    const namespace = `applicant-${emailHash.slice(0, 12)}`;
    const cvUrl = await saveFile(cvFile, namespace, "cv");
    let photoUrl: string | undefined;
    if (photoFile && photoFile.size > 0) {
      const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp"];
      if (allowedPhotoTypes.includes(photoFile.type) && photoFile.size <= 2 * 1024 * 1024) {
        photoUrl = await saveFile(photoFile, namespace, "photo");
      }
    }

    const referenceId = `APP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create applicant record
    const applicant = await prisma.applicant.create({
      data: {
        referenceId,
        fullName,
        email,
        phone,
        cnicEncrypted: encryptCNIC(cnic),
        cnicHash,
        city,
        cvFileUrl: cvUrl,
        photoUrl,
        linkedIn,
        github,
        tryHackMe,
        hackTheBox,
        portfolio,
        cve,
        certifications,
        motivation,
        emailVerified: true,
        universityName: universityName || null,
        semester: semester || null,
        jobPostingId: postingId,
        status: "Reviewing",
        consentData: JSON.stringify({
          dataConsent: consentData,
          interviewConsent: consentInterview,
          timestamp: new Date().toISOString(),
          ip,
        }),
        ipAddress: ip,
      },
    });

    // We do not send plain received emails. Status changes remain in-app.
    // If autoShortlist is false, they enter Reviewing silently.
    // If autoShortlist is true, they receive the interview invite later below.

    // Notify Admin
    waitUntil(
      prisma.notification.create({
        data: {
          userId: "admin",
          title: "New Application",
          message: `${fullName} has applied for ${posting.title}`,
          type: "Application",
          link: "/company/applications"
        }
      }).catch(console.error)
    );

    // Run AI screening asynchronously without blocking the Vercel function
    waitUntil(runScreening(applicant.id, cvUrl, { fullName, email, posting, referenceId: applicant.referenceId }));

    return NextResponse.json({ applicationId: applicant.id, referenceId: applicant.referenceId, message: "Application received and screened" }, { status: 201 });
  } catch (error: any) {
    console.error("Database or processing error during application submission:", error);
    return NextResponse.json({ error: "Service temporarily unavailable. Please try again later." }, { status: 503 });
  }
}

async function runScreening(
  applicantId: string,
  cvUrl: string,
  ctx: { fullName: string; email: string; posting: any; referenceId: string }
) {
  try {
    // Extract CV text
    const cvText = await extractPdfText(cvUrl);

    // Call Gemini
    const result = await screenApplicant(
      cvText || "CV text unavailable",
      ctx.fullName,
      ctx.posting.title,
      ctx.posting.description,
      ctx.posting.requirements,
      ctx.posting.type as "Job" | "Internship"
    );

    // Generate applicant-specific question variants from the Job Posting's Assessment Bank
    let finalQuestions: any[] = [];
    if (ctx.posting.assessmentBank && ctx.posting.answerKey) {
      const { generateApplicantVariant } = await import("@/lib/assessmentEngine");
      const bank = JSON.parse(ctx.posting.assessmentBank);
      const answerKey = JSON.parse(ctx.posting.answerKey);
      const settings = ctx.posting.assessmentSettings ? JSON.parse(ctx.posting.assessmentSettings) : { mcqCount: 10, openCount: 5 };
      
      const { applicantQuestions, applicantAnswers } = generateApplicantVariant(
        bank, 
        answerKey, 
        settings
      );
      
      finalQuestions = applicantQuestions;
      
      const token = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await prisma.interviewSession.create({
        data: {
          applicantId,
          token,
          tokenExpiry,
          questions: JSON.stringify(applicantQuestions),
          answers: JSON.stringify(applicantAnswers)
        },
      });
    } else {
      // Fallback if no assessment generated yet
      const token = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await prisma.interviewSession.create({
        data: {
          applicantId,
          token,
          tokenExpiry,
          questions: "[]",
          answers: "[]"
        },
      });
    }

    const shortlisted = ctx.posting.autoShortlist; // Unconditional override

    if (shortlisted) {
      await prisma.applicant.update({
        where: { id: applicantId },
        data: {
          status: "Invited for Interview",
          fitScore: result.fitScore,
          fitReasoning: `${result.reasoning}\n\nStrengths: ${result.strengths.join(", ")}\nGaps: ${result.gaps.join(", ")}`,
        },
      });

      // We need to fetch the newly created token since it's scoped in the block above
      const session = await prisma.interviewSession.findFirst({ where: { applicantId } });
      if (session) {
        const interviewLink = `https://cyberlabsec.tech/careers/interview/${session.token}`;
        const { sendCombinedShortlistEmail } = await import("@/lib/email");
        await sendCombinedShortlistEmail(
          ctx.email,
          ctx.fullName,
          ctx.posting.title,
          ctx.referenceId,
          interviewLink,
          168 // 7 days in hours
        );
      }
    } else {
      await prisma.applicant.update({
        where: { id: applicantId },
        data: {
          status: "Reviewing",
          fitScore: result.fitScore,
          fitReasoning: `${result.reasoning}\n\nStrengths: ${result.strengths.join(", ")}\nGaps: ${result.gaps.join(", ")}`,
        },
      });
      // Admin will manually review and trigger invite
    }
  } catch (err: any) {
    console.error("Screening error:", err);
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { status: "Applied" },
    }).catch(() => {});
  }
}
