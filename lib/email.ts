import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "mrzohaibkhattak@gmail.com",
    pass: process.env.SMTP_PASSWORD || "jccq fhij hxxb qlzj",
  },
});

const FROM = `CyberLabSec Careers <contact@cyberlabsec.tech>`;

// ─── Shared design tokens ────────────────────────────────────────────────────
const BASE = `font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #18181b; margin: 0; padding: 0;`;
const WRAP = `max-width: 600px; margin: 0 auto; padding: 40px 20px;`;
const BOX = `background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);`;
const HEADER = `background-color: #ffffff; padding: 32px 40px 24px; border-bottom: 1px solid #f4f4f5;`;
const BODY = `padding: 32px 40px; background-color: #ffffff;`;
const FOOTER = `padding: 24px 40px; border-top: 1px solid #f4f4f5; background: #fafafa;`;

const ACCENT = `#7e22ce`;
const TEXT_PRIMARY = `#000000`;
const TEXT_SECONDARY = `#555555`;
const TEXT_MUTED = `#888888`;
const CARD_BG = `#fafafa`;
const CARD_BORDER = `#e4e4e7`;

const BUTTON = `display: inline-block; background-color: #7e22ce; color: #ffffff !important; text-decoration: none !important; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.01em;`;

const infoRow = (label: string, value: string) => `
  <tr>
    <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7; color: #52525b; font-size: 14px; font-weight: 600; width: 140px;">${label}</td>
    <td style="padding: 12px 0; border-bottom: 1px solid #e4e4e7; color: #09090b; font-size: 14px;">${value}</td>
  </tr>`;

const logoBlock = (subtitle: string) => `
  <div style="margin-bottom: 20px;">
    <h2 style="color: #7e22ce; font-size: 24px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em; font-family: 'Inter', sans-serif;">CyberLab<span style="color: #18181b;">Sec</span></h2>
  </div>
  <p style="color: #7e22ce; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin: 0;">${subtitle}</p>`;

const divider = () => `<div style="height: 1px; background: #e4e4e7; margin: 28px 0;"></div>`;

const footerBlock = (extra: string = "") => `
  <p style="color: ${TEXT_MUTED}; font-size: 12px; margin: 0 0 8px 0; line-height: 1.6;">
    ${extra ? extra + "<br/><br/>" : ""}
    © ${new Date().getFullYear()} CyberLabSec · Offensive Security &amp; Pentesting<br/>
    <a href="https://cyberlabsec.tech" style="color: ${ACCENT}; text-decoration: none;">cyberlabsec.tech</a>
    &nbsp;·&nbsp; <a href="mailto:contact@cyberlabsec.tech" style="color: ${TEXT_MUTED}; text-decoration: none;">contact@cyberlabsec.tech</a>
  </p>`;

// ─── 1. Interview Invite ─────────────────────────────────────────────────────
export async function sendInterviewInvite(
  toEmail: string,
  applicantName: string,
  jobTitle: string,
  interviewLink: string,
  expiryHours: number = 48
) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `You've Been Shortlisted — Technical Interview for ${jobTitle} | CyberLabSec`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="${BASE}">
        <div style="${WRAP}">
          <div style="${BOX}">
            <div style="${HEADER}">
              ${logoBlock("Technical Assessment Invitation")}
            </div>
            <div style="${BODY}">
              <h1 style="font-size: 26px; font-weight: 800; color: ${TEXT_PRIMARY}; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                Congratulations, ${firstName}!
              </h1>
              <p style="color: ${TEXT_SECONDARY}; font-size: 16px; margin: 0 0 28px 0; line-height: 1.6;">
                Your application for the <strong style="color: ${TEXT_PRIMARY};">${jobTitle}</strong> role has been reviewed — and you've been selected to proceed to our technical assessment stage.
              </p>

              <div style="background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
                <p style="color: ${ACCENT}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 10px 0;">Assessment Details</p>
                <table style="width: 100%; border-collapse: collapse;">
                  ${infoRow("Role", `<strong style="color: ${TEXT_PRIMARY}; font-size: 14px;">${jobTitle}</strong>`)}
                  ${infoRow("Format", `<span style="color: ${TEXT_SECONDARY}; font-size: 14px;">AI-Proctored Technical Screening</span>`)}
                  ${infoRow("Link Expires", `<span style="color: #f59e0b; font-size: 14px; font-weight: 600;">In ${expiryHours} hours</span>`)}
                  ${infoRow("Max Attempts", `<span style="color: ${TEXT_SECONDARY}; font-size: 14px;">3 attempts available</span>`)}
                </table>
              </div>

              <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 10px; padding: 20px 24px; margin-bottom: 32px;">
                <p style="color: #f59e0b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px 0;">⚠ Critical Instructions</p>
                <ul style="color: ${TEXT_SECONDARY}; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 18px;">
                  <li>Ensure a <strong style="color: ${TEXT_PRIMARY};">stable, uninterrupted internet</strong> connection before starting.</li>
                  <li>The assessment <strong style="color: ${TEXT_PRIMARY};">cannot be paused</strong> once begun.</li>
                  <li>Tab switching, copy-pasting, or AI tool usage will <strong style="color: #ef4444;">immediately flag and terminate</strong> your session.</li>
                  <li>Each question has a <strong style="color: ${TEXT_PRIMARY};">timed window</strong> — answer confidently and independently.</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 8px 0 32px 0;">
                <a href="${interviewLink}" style="${BUTTON}">Begin Technical Assessment →</a>
              </div>

              <p style="color: ${TEXT_MUTED}; font-size: 13px; line-height: 1.6; text-align: center;">
                If the button doesn't work, copy this link into your browser:<br/>
                <a href="${interviewLink}" style="color: ${ACCENT}; text-decoration: none; word-break: break-all;">${interviewLink}</a>
              </p>
            </div>
            <div style="${FOOTER}">
              ${footerBlock("If you did not apply to this position, you may safely ignore this email.")}
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

// ─── 2. Application Decline ──────────────────────────────────────────────────
export async function sendDeclineEmail(
  toEmail: string,
  applicantName: string,
  jobTitle: string
) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `CyberLabSec — Update on Your Application for ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="${BASE}">
        <div style="${WRAP}">
          <div style="${BOX}">
            <div style="${HEADER}">
              ${logoBlock("Application Update")}
            </div>
            <div style="${BODY}">
              <h1 style="font-size: 24px; font-weight: 800; color: ${TEXT_PRIMARY}; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                Hi ${firstName},
              </h1>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                Thank you for your interest in the <strong style="color: ${TEXT_PRIMARY};">${jobTitle}</strong> position and for investing your time in our assessment process.
              </p>
              ${divider()}
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                After a thorough review of all applications and technical evaluations, we have decided to move forward with candidates whose profiles most closely align with the specific requirements of this role at this time.
              </p>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                This decision does not reflect a lack of capability on your part — the competition was strong and this was a highly selective process. We genuinely encourage you to apply again as our team expands.
              </p>
              <div style="background: rgba(168,85,247,0.06); border: 1px solid rgba(168,85,247,0.2); border-radius: 10px; padding: 20px 24px; margin: 24px 0;">
                <p style="color: ${TEXT_PRIMARY}; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Stay Connected</p>
                <p style="color: ${TEXT_SECONDARY}; font-size: 13px; margin: 0; line-height: 1.6;">
                  We regularly open new positions across our offensive security operations. Visit our careers portal to be among the first to apply when a new role opens that matches your skills.
                </p>
              </div>
            </div>
            <div style="${FOOTER}">
              ${footerBlock("Sent with respect by the CyberLabSec Hiring Team.")}
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

// ─── 3. Employee Credentials / Welcome ───────────────────────────────────────
export async function sendEmployeeCredentials(
  toEmail: string,
  employeeName: string,
  employeeCode: string,
  temporaryPassword: string,
  portalUrl: string,
  offerLetterPdfBase64?: string,
  customMessage?: string
) {
  const firstName = employeeName.split(" ")[0];
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Welcome to the Team, ${firstName}! — Your CyberLabSec Portal Access`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="${BASE}">
        <div style="${WRAP}">
          <div style="${BOX}">
            <div style="background: linear-gradient(135deg, #18101f 0%, #0a0a12 100%); padding: 36px 40px 28px; border-bottom: 1px solid #27272a;">
              ${logoBlock("Welcome to CyberLabSec")}
            </div>
            <div style="${BODY}">
              <h1 style="font-size: 28px; font-weight: 800; color: ${TEXT_PRIMARY}; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                Welcome Aboard, ${firstName}! 🎉
              </h1>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                Your offer has been formally approved by the executive board. We are truly excited to have you join our team and look forward to the work you'll do with us.
              </p>

              ${customMessage ? `
              <div style="background: #18181b; border-left: 3px solid ${ACCENT}; padding: 16px 20px; margin: 0 0 28px 0; border-radius: 0 8px 8px 0;">
                <p style="color: ${TEXT_SECONDARY}; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${customMessage}</p>
              </div>` : ""}

              <p style="color: ${TEXT_SECONDARY}; font-size: 14px; margin: 0 0 16px 0; font-weight: 600;">Your Portal Credentials</p>
              <div style="background: ${CARD_BG}; border: 1px solid ${CARD_BORDER}; border-radius: 10px; padding: 20px 24px; margin-bottom: 12px;">
                <table style="width: 100%; border-collapse: collapse;">
                  ${infoRow("Employee ID", `<code style="background: #27272a; padding: 6px 12px; border-radius: 6px; color: #c084fc; font-size: 16px; font-weight: 700; letter-spacing: 2px; display: inline-block;">${employeeCode}</code>`)}
                  ${infoRow("Temp Password", `<code style="background: #27272a; padding: 6px 12px; border-radius: 6px; color: #c084fc; font-size: 15px; font-weight: 700; letter-spacing: 1px; display: inline-block;">${temporaryPassword}</code>`)}
                </table>
              </div>
              <div style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 12px 16px; margin-bottom: 32px;">
                <p style="color: #ef4444; font-size: 13px; font-weight: 600; margin: 0;">
                  ⚠️ Security Notice: You will be required to change this password immediately upon your first login. Keep your credentials strictly confidential.
                </p>
              </div>

              <div style="text-align: center; margin-bottom: 28px;">
                <a href="${portalUrl}" style="${BUTTON}">Access Your Portal →</a>
              </div>

              ${divider()}
              <p style="color: ${TEXT_MUTED}; font-size: 13px; line-height: 1.7; margin: 0;">
                ${offerLetterPdfBase64 ? "Your signed offer letter is attached to this email for your records.<br/><br/>" : ""}
                If you have any questions before your start date, reach out to us at <a href="mailto:hr@cyberlabsec.tech" style="color: ${ACCENT}; text-decoration: none;">hr@cyberlabsec.tech</a>. We're here to help.
              </p>
            </div>
            <div style="${FOOTER}">
              ${footerBlock("Sent by CyberLabSec HR &amp; Operations.")}
            </div>
          </div>
        </div>
      </div>
    `,
    attachments: offerLetterPdfBase64
      ? [
          {
            filename: "CyberLabSec_Offer_Letter.pdf",
            content: Buffer.from(offerLetterPdfBase64, "base64"),
            contentType: "application/pdf",
          },
        ]
      : [],
  });
}

// ─── 4. Termination Letter ───────────────────────────────────────────────────
export async function sendTerminationLetter(
  toEmail: string,
  employeeName: string,
  terminationLetterPdfBase64: string
) {
  const firstName = employeeName.split(" ")[0];
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `CyberLabSec — Employment Status Notification for ${employeeName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="${BASE}">
        <div style="${WRAP}">
          <div style="${BOX}">
            <div style="${HEADER}">
              ${logoBlock("Employment Update")}
            </div>
            <div style="${BODY}">
              <h1 style="font-size: 22px; font-weight: 700; color: ${TEXT_PRIMARY}; margin: 0 0 20px 0;">
                Hi ${firstName},
              </h1>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                Please find your official employment status notification letter attached to this email.
              </p>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 20px 0;">
                Your access to all CyberLabSec internal systems and operational portals has been deactivated effective immediately. All company materials should be returned per the terms outlined in your contract.
              </p>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 8px 0;">
                For any questions regarding final settlement, documentation, or references, please contact our HR department at:
              </p>
              <a href="mailto:hr@cyberlabsec.tech" style="color: ${ACCENT}; font-size: 14px; text-decoration: none; font-weight: 600;">hr@cyberlabsec.tech</a>
            </div>
            <div style="${FOOTER}">
              ${footerBlock("CyberLabSec HR &amp; Operations")}
            </div>
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: "CyberLabSec_Employment_Status.pdf",
        content: Buffer.from(terminationLetterPdfBase64, "base64"),
        contentType: "application/pdf",
      },
    ],
  });
}

// ─── 5. Announcement ─────────────────────────────────────────────────────────
export async function sendAnnouncement(
  toEmails: string[],
  subject: string,
  message: string,
  senderName: string
) {
  await transporter.sendMail({
    from: FROM,
    to: toEmails.join(","),
    subject: `[CyberLabSec] ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="${BASE}">
        <div style="${WRAP}">
          <div style="${BOX}">
            <div style="${HEADER}">
              ${logoBlock("Internal Announcement")}
            </div>
            <div style="${BODY}">
              <h1 style="font-size: 22px; font-weight: 800; color: ${TEXT_PRIMARY}; margin: 0 0 24px 0; letter-spacing: -0.01em;">
                ${subject}
              </h1>
              <div style="background: ${CARD_BG}; border: 1px solid ${CARD_BORDER}; border-left: 3px solid ${ACCENT}; border-radius: 0 10px 10px 0; padding: 20px 24px; margin-bottom: 24px;">
                <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.8; white-space: pre-wrap; margin: 0;">${message}</p>
              </div>
              <p style="color: ${TEXT_MUTED}; font-size: 13px; text-align: right; font-style: italic; margin: 0;">
                — ${senderName}, CyberLabSec
              </p>
            </div>
            <div style="${FOOTER}">
              ${footerBlock("This is an internal broadcast. Do not reply directly to this email.")}
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

// ─── 6. Generic send ─────────────────────────────────────────────────────────
export async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="${BASE}">
        <div style="${WRAP}">
          <div style="${BOX}">
            <div style="${HEADER}">
              ${logoBlock("CyberLabSec")}
            </div>
            <div style="${BODY}">
              ${html}
            </div>
            <div style="${FOOTER}">
              ${footerBlock()}
            </div>
          </div>
        </div>
      </div>
    `,
    attachments,
  });
}

// ─── 7. Application Received ─────────────────────────────────────────────────
export async function sendApplicationReceivedEmail(
  toEmail: string,
  applicantName: string,
  jobTitle: string,
  referenceId: string,
  trackingUrl: string
) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Application Received — ${jobTitle} at CyberLabSec (Ref: ${referenceId})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="${BASE}">
        <div style="${WRAP}">
          <div style="${BOX}">
            <div style="${HEADER}">
              ${logoBlock("Application Confirmation")}
            </div>
            <div style="${BODY}">
              <h1 style="font-size: 26px; font-weight: 800; color: ${TEXT_PRIMARY}; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                We've Got Your Application, ${firstName}!
              </h1>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                Thank you for applying to the <strong style="color: ${TEXT_PRIMARY};">${jobTitle}</strong> position at CyberLabSec. Your application has been successfully submitted and is now in our review queue.
              </p>

              <div style="background: ${CARD_BG}; border: 1px solid ${CARD_BORDER}; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
                <p style="color: ${ACCENT}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Your Application Summary</p>
                <table style="width: 100%; border-collapse: collapse;">
                  ${infoRow("Reference ID", `<code style="background: #27272a; padding: 5px 10px; border-radius: 5px; color: #c084fc; font-size: 14px; font-weight: 700; letter-spacing: 1px; display: inline-block;">${referenceId}</code>`)}
                  ${infoRow("Position", `<span style="color: ${TEXT_SECONDARY}; font-size: 14px;">${jobTitle}</span>`)}
                  ${infoRow("Status", `<span style="color: #22c55e; font-size: 14px; font-weight: 600;">● Under Review</span>`)}
                </table>
              </div>

              <p style="color: ${TEXT_SECONDARY}; font-size: 14px; line-height: 1.7; margin: 0 0 28px 0;">
                Our team carefully reviews every application. If you are shortlisted, you will receive a personalized technical assessment invitation via email. You can check your real-time status anytime using the button below.
              </p>

              <div style="text-align: center; margin-bottom: 28px;">
                <a href="${trackingUrl}" style="${BUTTON}">Track Application Status →</a>
              </div>

              ${divider()}
              <p style="color: ${TEXT_MUTED}; font-size: 12px; text-align: center; line-height: 1.6; margin: 0;">
                Save this email — your Reference ID is <strong style="color: ${TEXT_SECONDARY};">${referenceId}</strong>.<br/>
                You'll need it to access your application status page.
              </p>
            </div>
            <div style="${FOOTER}">
              ${footerBlock("Sent by the CyberLabSec Recruitment Team.")}
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─── 8. Interview Completed ──────────────────────────────────────────────────
export async function sendInterviewCompleteEmail(
  toEmail: string,
  applicantName: string,
  jobTitle: string,
  status: string
) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Interview Completed — Update on your Application`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="${BASE}">
        <div style="${WRAP}">
          <div style="${BOX}">
            <div style="${HEADER}">
              ${logoBlock("Interview Completed")}
            </div>
            <div style="${BODY}">
              <h1 style="font-size: 26px; font-weight: 800; color: ${TEXT_PRIMARY}; margin: 0 0 8px 0; letter-spacing: -0.02em;">
                Great job, ${firstName}!
              </h1>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                Thank you for taking the time to complete your AI technical interview for the <strong style="color: ${TEXT_PRIMARY};">${jobTitle}</strong> role at CyberLabSec.
              </p>
              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
                Your interview has been successfully submitted and scored. Our team is currently reviewing the results alongside your application.
              </p>

              <div style="background: ${CARD_BG}; border: 1px solid ${CARD_BORDER}; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
                <p style="color: ${ACCENT}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Application Status Update</p>
                <table style="width: 100%; border-collapse: collapse;">
                  ${infoRow("Position", `<span style="color: ${TEXT_SECONDARY}; font-size: 14px;">${jobTitle}</span>`)}
                  ${infoRow("Status", `<span style="color: ${status === 'Rejected' ? '#ef4444' : '#22c55e'}; font-size: 14px; font-weight: 600;">● ${status}</span>`)}
                </table>
              </div>

              <p style="color: ${TEXT_SECONDARY}; font-size: 15px; line-height: 1.7; margin: 0;">
                We will be in touch with you shortly regarding the next steps in the process.
              </p>
            </div>
            <div style="${FOOTER}">
              ${footerBlock("Sent by the CyberLabSec Recruitment Team.")}
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
