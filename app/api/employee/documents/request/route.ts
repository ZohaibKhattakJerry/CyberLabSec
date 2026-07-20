import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await getAuthFromCookies("employee");
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title } = body;
  if (!title) return NextResponse.json({ error: "Document title is required" }, { status: 400 });

  try {
    const employee = await prisma.employee.findUnique({ where: { id: auth.sub } });
    if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Check if request already exists
    const existing = await prisma.employeeDocument.findFirst({
      where: { employeeId: employee.id, title, status: "Requested" }
    });

    if (existing) {
      return NextResponse.json({ error: "Already requested" }, { status: 400 });
    }

    const newDoc = await prisma.employeeDocument.create({
      data: {
        employeeId: employee.id,
        title,
        type: "Request",
        status: "Requested",
      }
    });

    // Create an announcement/notification for the Admin
    await prisma.announcement.create({
      data: {
        message: `Employee ${employee.name} (${employee.employeeCode}) has requested: ${title}`,
        scope: "Company",
        sentById: employee.id,
        isPinned: false
      }
    });

    return NextResponse.json({ success: true, document: newDoc });
  } catch (error) {
    console.error("Doc request error:", error);
    return NextResponse.json({ error: "Failed to request document" }, { status: 500 });
  }
}
