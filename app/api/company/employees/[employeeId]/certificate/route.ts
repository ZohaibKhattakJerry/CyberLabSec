import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ employeeId: string }> }) {
  const auth = await getAuthFromCookies();
  if (!auth || auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "completion"; // "completion" | "lor"

  const resolvedParams = await params;
  const employeeId = resolvedParams.employeeId;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { team: true }
  });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const startDate = employee.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const endDate = (employee.offboardedAt || new Date()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  let html = "";
  
  if (type === "completion" && employee.customCertificateUrl) {
    if (employee.customCertificateUrl.startsWith("http")) {
      return NextResponse.redirect(employee.customCertificateUrl);
    }
    const dataUri = employee.customCertificateUrl;
    const mimeMatch = dataUri.match(/^data:(.*?);base64,(.*)$/);
    if (mimeMatch) {
      const buffer = Buffer.from(mimeMatch[2], "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeMatch[1],
          "Content-Disposition": `inline; filename="Certificate_${employee.name.replace(/\s+/g, '_')}.${mimeMatch[1].split('/')[1] || 'pdf'}"`
        }
      });
    }
  }

  if (type === "lor" && employee.customLorUrl) {
    if (employee.customLorUrl.startsWith("http")) {
      return NextResponse.redirect(employee.customLorUrl);
    }
    const dataUri = employee.customLorUrl;
    const mimeMatch = dataUri.match(/^data:(.*?);base64,(.*)$/);
    if (mimeMatch) {
      const buffer = Buffer.from(mimeMatch[2], "base64");
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeMatch[1],
          "Content-Disposition": `inline; filename="LoR_${employee.name.replace(/\s+/g, '_')}.${mimeMatch[1].split('/')[1] || 'pdf'}"`
        }
      });
    }
  }

  if (type === "completion") {
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Internship Completion Certificate</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Georgia', serif; background: #fff; }
.page { width: 210mm; min-height: 148mm; padding: 40mm 30mm; position: relative; }
.border { position: absolute; inset: 12mm; border: 3px solid #7c3aed; }
.border2 { position: absolute; inset: 14mm; border: 1px solid #c4b5fd; }
.logo { text-align: center; margin-bottom: 20px; }
.logo-text { font-size: 28px; font-weight: bold; color: #7c3aed; letter-spacing: 2px; }
.title { text-align: center; font-size: 36px; color: #1e1b4b; margin: 20px 0 8px; letter-spacing: 1px; }
.subtitle { text-align: center; font-size: 14px; color: #6b7280; margin-bottom: 30px; }
.body-text { text-align: center; font-size: 16px; color: #374151; line-height: 1.8; }
.name { font-size: 28px; font-weight: bold; color: #7c3aed; display: block; margin: 12px 0; font-family: 'Times New Roman', serif; }
.details { text-align: center; margin: 24px 0; font-size: 14px; color: #6b7280; }
.signature { margin-top: 50px; display: flex; justify-content: space-between; }
.sig-block { text-align: center; }
.sig-line { border-top: 1px solid #374151; width: 160px; margin: 0 auto 6px; }
.date { text-align: center; margin-top: 24px; font-size: 13px; color: #9ca3af; }
</style></head><body><div class="page">
<div class="border"></div><div class="border2"></div>
<div style="position:relative;z-index:1">
<div class="logo"><div class="logo-text">CyberLabSec</div></div>
<div class="title">Certificate of Completion</div>
<div class="subtitle">Cybersecurity Internship Program</div>
<div class="body-text">
This is to certify that<br>
<span class="name">${employee.name}</span>
has successfully completed the Cybersecurity Internship Program at CyberLabSec<br>
from <strong>${startDate}</strong> to <strong>${endDate}</strong><br>
as <strong>${employee.designation || employee.employeeCode}</strong>${employee.team ? ` with the <strong>${employee.team.name}</strong> team` : ""}.
</div>
<div class="details">Employee ID: ${employee.employeeCode} &nbsp;|&nbsp; Issue Date: ${today}</div>
<div class="signature">
<div class="sig-block"><div class="sig-line"></div><div>CEO & Founder<br>CyberLabSec</div></div>
<div class="sig-block"><div class="sig-line"></div><div>Internship Coordinator<br>CyberLabSec</div></div>
</div>
<div class="date">Issued on ${today} &nbsp;·&nbsp; cyberlabsec.tech</div>
</div></div></body></html>`;
  } else {
    html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Letter of Recommendation</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; background: #fff; }
.page { width: 210mm; padding: 25mm 30mm; }
.letterhead { border-bottom: 3px solid #7c3aed; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
.company { font-size: 24px; font-weight: bold; color: #7c3aed; }
.date { font-size: 13px; color: #6b7280; }
.subject { font-weight: bold; margin: 20px 0; font-size: 15px; }
p { font-size: 14px; color: #374151; line-height: 1.8; margin-bottom: 16px; }
.sig { margin-top: 40px; }
.sig-name { font-weight: bold; font-size: 15px; margin-top: 40px; }
.sig-title { color: #6b7280; font-size: 13px; }
</style></head><body><div class="page">
<div class="letterhead">
<div class="company">CyberLabSec</div>
<div class="date">${today}</div>
</div>
<p>To Whom It May Concern,</p>
<div class="subject">Re: Letter of Recommendation for ${employee.name}</div>
<p>It is with great pleasure that I recommend <strong>${employee.name}</strong> (Employee ID: ${employee.employeeCode}), who served as <strong>${employee.designation || "Intern"}</strong> at CyberLabSec from ${startDate} to ${endDate}${employee.team ? ` with our ${employee.team.name} team` : ""}.</p>
<p>During their tenure at CyberLabSec — a specialized offensive security firm — ${employee.name} demonstrated exceptional dedication, technical aptitude, and a strong work ethic. They consistently delivered high-quality work, actively participated in team initiatives, and showed remarkable growth throughout the internship.</p>
<p>We found ${employee.name} to be a highly motivated individual with excellent problem-solving skills and the ability to work effectively both independently and as part of a collaborative team. Their contributions made a meaningful impact on our operations.</p>
<p>I wholeheartedly recommend ${employee.name} for any future opportunities in cybersecurity. They have my strongest endorsement, and I am confident they will continue to excel in their career.</p>
<div class="sig">
<p>Sincerely,</p>
<div class="sig-name">CEO & Founder</div>
<div class="sig-title">CyberLabSec &nbsp;·&nbsp; cyberlabsec.tech</div>
</div>
</div></body></html>`;
  }

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${type === 'lor' ? 'LoR' : 'Certificate'}_${employee.name.replace(/\s+/g, '_')}.html"`
    }
  });
}
