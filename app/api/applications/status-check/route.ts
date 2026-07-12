import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { referenceId } = await req.json();

    if (!referenceId || typeof referenceId !== "string") {
      return NextResponse.json({ error: "Reference ID is required" }, { status: 400 });
    }

    const applicant = await prisma.applicant.findUnique({
      where: { referenceId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        jobPosting: {
          select: { title: true, department: true }
        }
      }
    });

    if (!applicant) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      application: {
        id: applicant.id,
        status: applicant.status,
        appliedDate: applicant.createdAt.toISOString(),
        jobTitle: applicant.jobPosting.title,
        department: applicant.jobPosting.department
      }
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }
}
