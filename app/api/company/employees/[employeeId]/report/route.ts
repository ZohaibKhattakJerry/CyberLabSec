import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await getAuthFromCookies("admin");
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { employeeId } = resolvedParams;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        submissions: {
          include: { task: true }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const totalSubmissions = employee.submissions.length;
    const approved = employee.submissions.filter(s => s.status === "Approved").length;
    const rejected = employee.submissions.filter(s => s.status === "Revision").length;
    const pending = totalSubmissions - approved - rejected;

    // Simulate AI delay for realism
    await new Promise(resolve => setTimeout(resolve, 2000));

    let report = `Performance Analysis for ${employee.name} (${employee.designation})\n\n`;
    report += `Total Tasks Assigned: ${totalSubmissions}\n`;
    report += `Completed Successfully: ${approved}\n`;
    report += `Pending / In Review: ${pending}\n`;
    report += `Required Revisions: ${rejected}\n\n`;

    if (totalSubmissions === 0) {
      report += `AI ASSESSMENT: No operational data available. The employee has not submitted any tasks yet.`;
    } else {
      const completionRate = Math.round((approved / totalSubmissions) * 100);
      report += `Overall Completion Rate: ${completionRate}%\n\n`;
      
      report += `AI ASSESSMENT:\n`;
      if (completionRate >= 80) {
        report += `Exceptional performance. ${employee.name} consistently delivers high-quality results with minimal supervision. Shows strong adherence to operational protocols and deadlines. Recommended for advanced projects or team leadership roles.`;
      } else if (completionRate >= 50) {
        report += `Average performance. ${employee.name} completes tasks but occasionally requires revisions or misses minor details. Needs to focus on improving accuracy and reducing turnaround time on critical tasks.`;
      } else {
        report += `Subpar performance. The high rate of revisions indicates a potential gap in skills or understanding of the standard operating procedures. Immediate intervention and mentoring are recommended.`;
      }
    }

    // Log the action
    await prisma.activityLog.create({
      data: {
        actorId: null,
        actorType: "Admin",
        action: "GENERATE_REPORT",
        metadata: JSON.stringify({ employeeId, employeeName: employee.name })
      }
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
