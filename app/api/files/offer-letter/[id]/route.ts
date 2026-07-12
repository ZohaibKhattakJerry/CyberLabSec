import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const applicant = await prisma.applicant.findUnique({
    where: { id: resolvedParams.id },
    include: { jobPosting: true },
  });

  if (!applicant) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const notes = searchParams.get("notes") || "";
  const date = format(new Date(), "MMMM d, yyyy");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offer Letter - ${applicant.fullName}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f4f4f5;
          margin: 0;
          padding: 40px;
          display: flex;
          justify-content: center;
        }
        .page {
          background: white;
          width: 800px;
          min-height: 1100px;
          padding: 60px 80px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          color: #18181b;
          line-height: 1.6;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #a855f7;
          padding-bottom: 20px;
          margin-bottom: 40px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #a855f7;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .date {
          color: #71717a;
        }
        h1 {
          font-size: 20px;
          margin-bottom: 24px;
        }
        p {
          margin-bottom: 16px;
        }
        .signature {
          margin-top: 60px;
        }
        .signature-line {
          width: 250px;
          border-top: 1px solid #18181b;
          margin-top: 60px;
          padding-top: 8px;
          font-weight: 600;
        }
        .ceo-notes {
          margin-top: 40px;
          padding: 20px;
          background: #faf5ff;
          border-left: 4px solid #a855f7;
          color: #581c87;
          font-style: italic;
        }
        @media print {
          body { background: white; padding: 0; }
          .page { box-shadow: none; width: 100%; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            CyberLabSec
          </div>
          <div class="date">${date}</div>
        </div>
        
        <p><strong>${applicant.fullName}</strong><br>
        ${applicant.email}</p>

        <h1>Subject: Offer of Employment / Internship</h1>

        <p>Dear ${applicant.fullName},</p>

        <p>We are thrilled to extend this offer for the position of <strong>${applicant.jobPosting.title}</strong> at CyberLabSec. Your performance during our AI assessment and interview process demonstrated the skills and potential we value in our team.</p>

        <p>This is a formal offer for a <strong>${applicant.jobPosting.type}</strong> role in the <strong>${applicant.jobPosting.department}</strong> department, based in <strong>${applicant.jobPosting.location}</strong>.</p>

        <p>By joining CyberLabSec, you will be part of an innovative team dedicated to advancing cybersecurity and operational excellence. We are confident that your contributions will be highly valuable.</p>

        ${notes ? `
        <div class="ceo-notes">
          <strong>Additional Notes from the CEO:</strong><br>
          ${notes}
        </div>
        ` : ''}

        <p>Please review this offer, and if you choose to accept, sign and return a copy to us by the end of this week. Upon acceptance, we will initiate your onboarding process through the CyberLab Employee Portal.</p>

        <p>We look forward to welcoming you to the team!</p>

        <div class="signature">
          <p>Sincerely,</p>
          <div class="signature-line">
            Chief Executive Officer<br>
            <span style="color: #71717a; font-weight: 400;">CyberLabSec Operations</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
