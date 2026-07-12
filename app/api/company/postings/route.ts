import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, type, department, location, description, requirements, universityRequired, deadline, shortlistThreshold, passMark } = body;

  if (!title || !department || !deadline) {
    return NextResponse.json({ error: "title, department and deadline are required" }, { status: 400 });
  }

  const posting = await prisma.jobPosting.create({
    data: {
      title: title.trim(),
      type: type || "Job",
      department: department.trim(),
      location: location?.trim() || "Remote",
      description: description?.trim() || "",
      requirements: requirements?.trim() || "",
      universityRequired: !!universityRequired,
      deadline: new Date(deadline),
      status: "Open",
      shortlistThreshold: Number(shortlistThreshold) || 50,
      passMark: Number(passMark) || 60,
    },
  });

  await prisma.activityLog.create({
    data: { actorId: auth.sub, actorType: "Admin", action: "POSTING_CREATED", metadata: JSON.stringify({ postingId: posting.id, title }) },
  }).catch(() => {});

  return NextResponse.json({ success: true, posting }, { status: 201 });
}
