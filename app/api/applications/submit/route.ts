import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCNIC, encryptCNIC } from "@/lib/cnic";
import { saveFile, extractPdfText } from "@/lib/fileStorage";
import { checkRateLimit, getIpFromRequest } from "@/lib/rateLimit";
import { screenApplicant } from "@/lib/gemini";
import { sendInterviewInvite, sendDeclineEmail } from "@/lib/email";
import crypto from "crypto";

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
  const cnic = formData.get("cnic") as string;
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
  const emailVerified = formData.get("emailVerified") === "true";

  const consentData = formData.get("consentData") === "true";
  const consentInterview = formData.get("consentInterview") === "true";
  const cvFile = formData.get("cv") as File | null;
  const photoFile = formData.get("photo") as File | null;
  // Honeypot check
  const honeypot = formData.get("website") as string;
  if (honeypot) {
    return NextResponse.json({ error: "Bot detected" }, { status: 400 });
  }

  // Validate required fields
  if (!postingId || !fullName || !email || !phone || !cnic || !city || !cvFile || !consentData || !consentInterview || !motivation) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 });
  }

  // Validate CNIC format
  if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
    return NextResponse.json({ error: "Invalid CNIC format" }, { status: 400 });
  }

  const cnicHash = hashCNIC(cnic);

  try {
    // Check for duplicate CNIC with failed/rejected status for THIS posting
    const existing = await prisma.applicant.findFirst({ where: { cnicHash, jobPostingId: postingId } });
    if (existing) {
      const blockedStatuses = ["Failed", "Rejected", "Blocked"];
      if (blockedStatuses.includes(existing.status)) {
        return NextResponse.json({
          error: `A previous application with this CNIC for this role was marked "${existing.status}". You are not eligible to re-apply for this specific role.`,
        }, { status: 403 });
      }
      // Already has active application
      return NextResponse.json({
        error: "An application with this CNIC already exists for this position. You cannot apply multiple times.",
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
    const namespace = `applicant-${cnicHash.slice(0, 12)}`;
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

    // Run AI screening asynchronously (don't block the response)
    // Actually, we must await it on Vercel so the serverless function is not killed
    // before the screening and email sending completes.
    await runScreening(applicant.id, cvUrl, { fullName, email, posting });

    return NextResponse.json({ applicationId: applicant.id, referenceId: applicant.referenceId, message: "Application received and screened" }, { status: 201 });
  } catch (error) {
    console.error("Database or processing error during application submission:", error);
    return NextResponse.json({ error: "Service temporarily unavailable. Please try again later." }, { status: 503 });
  }
}

async function runScreening(
  applicantId: string,
  cvUrl: string,
  ctx: { fullName: string; email: string; posting: { id: string; title: string; type: string; description: string; requirements: string; shortlistThreshold: number; passMark: number } }
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

    // AI Screening still runs to generate questions, but we shortlist everyone automatically
    // as per the new requirement (Pass/Fail is determined solely by interview performance)
    const shortlisted = true;

    if (shortlisted) {
      // Generate interview token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      await prisma.interviewSession.create({
        data: {
          applicantId,
          token,
          tokenExpiry,
          questions: JSON.stringify(result.questions),
        },
      });

      await prisma.applicant.update({
        where: { id: applicantId },
        data: {
          status: "Shortlisted",
          fitScore: result.fitScore,
          fitReasoning: `${result.reasoning}\n\nStrengths: ${result.strengths.join(", ")}\nGaps: ${result.gaps.join(", ")}`,
        },
      });

      const interviewLink = `https://cyberlabsec.tech/careers/interview/${token}`;
      await sendInterviewInvite(ctx.email, ctx.fullName, ctx.posting.title, interviewLink, 48);

      await prisma.applicant.update({
        where: { id: applicantId },
        data: { status: "InterviewInvited" },
      });
    } else {
      await prisma.applicant.update({
        where: { id: applicantId },
        data: {
          status: "Rejected",
          fitScore: result.fitScore,
          fitReasoning: `${result.reasoning}\n\nStrengths: ${result.strengths.join(", ")}\nGaps: ${result.gaps.join(", ")}`,
        },
      });
      // Optionally send decline email
      await sendDeclineEmail(ctx.email, ctx.fullName, ctx.posting.title).catch(() => {});
    }
  } catch (err) {
    console.error("Screening error:", err);
    await prisma.applicant.update({
      where: { id: applicantId },
      data: { status: "Reviewing" },
    }).catch(() => {});
  }
}
