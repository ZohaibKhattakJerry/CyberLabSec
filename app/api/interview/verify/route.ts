import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCNIC } from "@/lib/cnic";
import { decryptCNIC } from "@/lib/cnic";
import { checkRateLimit, getIpFromRequest, rateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const { blocked, resetAt } = await checkRateLimit(`interview-verify-ip:${ip}`, 5, 15);
  if (blocked) return rateLimitResponse(resetAt);

  const { token, email, cnic } = await req.json();

  const session = await prisma.interviewSession.findUnique({
    where: { token },
    include: { applicant: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (session.tokenExpiry < new Date() || session.tokenUsed) {
    return NextResponse.json({ error: "Token expired or already used" }, { status: 410 });
  }

  // Verify email
  if (session.applicant.email.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: "Email does not match our records" }, { status: 403 });
  }

  // Verify CNIC hash
  const inputHash = hashCNIC(cnic);
  if (inputHash !== session.applicant.cnicHash) {
    return NextResponse.json({ error: "CNIC does not match our records" }, { status: 403 });
  }

  // Mark email verified
  await prisma.interviewSession.update({
    where: { id: session.id },
    data: { emailVerified: true },
  });

  return NextResponse.json({ verified: true });
}
