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

  // Generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")        // Replace spaces with -
      .replace(/[^\w\-]+/g, "")    // Remove all non-word chars
      .replace(/\-\-+/g, "-")      // Replace multiple - with single -
      .replace(/^-+/, "")          // Trim - from start of text
      .replace(/-+$/, "");         // Trim - from end of text
  };

  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  
  // Basic conflict resolution
  const existing = await prisma.jobPosting.findUnique({ where: { id: slug } });
  if (existing) {
    slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
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
