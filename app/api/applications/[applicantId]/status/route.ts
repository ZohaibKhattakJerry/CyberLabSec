import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<any> }
) {
  const { applicantId } = await params;

  const applicant = await prisma.applicant.findUnique({
    where: { id: applicantId },
    select: { status: true, fitScore: true },
  });

  if (!applicant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ status: applicant.status, fitScore: applicant.fitScore });
}
