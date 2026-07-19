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

const FROM = "CyberLabSec Systems <contact@cyberlabsec.tech>";

const GLOBAL_HEAD = `
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
      body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; color: #18181b; background-color: #f4f4f5; }
      table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      a { text-decoration: none; }
      .bg-body { background-color: #f4f4f5; }
      .card-bg { background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
      .header-cell { background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 45px 40px 35px; border-radius: 12px 12px 0 0; }
      .body-cell { background-color: #ffffff; padding: 45px 40px; color: #3f3f46; }
      .footer-cell { background-color: #fafafa; border-top: 1px solid #e4e4e7; padding: 30px 40px; border-radius: 0 0 12px 12px; }
      .footer-text { color: #71717a; font-size: 12px; margin: 0 0 12px 0; line-height: 1.6; }
      h1 { color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.02em; }
      p { color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
      .info-label { color: #71717a; border-bottom: 1px solid #f4f4f5; padding: 14px 0; font-size: 14px; font-weight: 600; width: 140px; vertical-align: top; }
      .info-value { color: #18181b; border-bottom: 1px solid #f4f4f5; padding: 14px 0; font-size: 14px; vertical-align: top; }
      .code-box { background: #f4f4f5; border: 1px solid #e4e4e7; padding: 6px 10px; border-radius: 4px; color: #7c3aed; font-size: 15px; font-weight: 700; }
      .divider { height: 1px; background: #e4e4e7; margin: 30px 0; }
      @media (max-width: 600px) {
        .bg-body { background-color: #ffffff !important; }
        .wrap-cell { padding: 0 !important; }
        .responsive-table { width: 100% !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
        .header-cell { border-radius: 0 !important; padding: 35px 20px 25px !important; }
        .body-cell { padding: 30px 20px !important; }
        .footer-cell { border-radius: 0 !important; padding: 30px 20px !important; }
      }
    </style>
  </head>
`;

const HTML_START = `<!DOCTYPE html><html>${GLOBAL_HEAD}<body style="background-color: #f4f4f5; margin: 0; padding: 0;">`;
const HTML_END = `</body></html>`;

const WRAP_START = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-body" style="width: 100%; background-color: #f4f4f5;">
    <tr>
      <td class="wrap-cell" align="center" style="padding: 40px 20px;">
        <table class="responsive-table card-bg" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
`;
const WRAP_END = `
        </table>
      </td>
    </tr>
  </table>
`;

const headerSection = (subtitle: string) => `
  <tr>
    <td class="header-cell" align="center">
      <div style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; padding: 0; letter-spacing: -0.02em;">CyberLabSec</div>
      <p style="color: #e0e7ff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; margin: 16px 0 0 0;">${subtitle}</p>
    </td>
  </tr>
`;

const footerSection = (extra: string = "") => `
  <tr>
    <td class="footer-cell" align="center">
      <p class="footer-text">
        ${extra ? extra + "<br/><br/>" : ""}
        © ${new Date().getFullYear()} CyberLabSec · Offensive Security & Pentesting Operations<br/>
        <a href="https://cyberlabsec.tech" style="color: #a78bfa; text-decoration: none; font-weight: 500;">cyberlabsec.tech</a>
        &nbsp;|&nbsp; <a href="mailto:contact@cyberlabsec.tech" style="color: #a1a1aa; text-decoration: none;">contact@cyberlabsec.tech</a>
      </p>
    </td>
  </tr>
`;

const BODY_START = `<tr><td class="body-cell">`;
const BODY_END = `</td></tr>`;

const callout = (title: string, content: string, type: 'info' | 'danger' | 'success' = 'info') => {
  const colors = {
    info: { border: '#8b5cf6', bg: '#f3e8ff', text: '#6d28d9', content: '#18181b' },
    danger: { border: '#ef4444', bg: '#fef2f2', text: '#b91c1c', content: '#18181b' },
    success: { border: '#22c55e', bg: '#f0fdf4', text: '#15803d', content: '#18181b' },
  };
  const c = colors[type];
  return `
    <div style="background: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 6px; padding: 24px; margin-bottom: 28px; color: ${c.content};">
      ${title ? `<p style="color: ${c.text}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 12px 0;">${title}</p>` : ''}
      <div style="font-size: 15px; line-height: 1.6;">${content}</div>
    </div>
  `;
};

const btn = (text: string, url: string) => `
  <div style="text-align: center; margin: 35px 0 15px 0;">
    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: bold; font-size: 15px; letter-spacing: 0.02em;">
      ${text}
    </a>
  </div>
`;

// Helper strings for generic use
const divider = () => `<div class="divider"></div>`;
const heading1 = (text: string) => `<h1>${text}</h1>`;
const paragraph = (text: string) => `<p>${text}</p>`;
const infoRow = (label: string, value: string) => `
  <tr>
    <td class="info-label">${label}</td>
    <td class="info-value" style="color: #18181b;">${value}</td>
  </tr>
`;

// ─── Shared Exports ────────────────────────────────────────────────────────
export async function sendInterviewInvite(toEmail: string, applicantName: string, jobTitle: string, interviewLink: string, expiryHours: number = 48) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `You've Been Shortlisted — Technical Interview for ${jobTitle} | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Technical Assessment Invitation")}
      ${BODY_START}
        ${heading1(`Congratulations, ${firstName}!`)}
        ${paragraph(`Your application for the <strong>${jobTitle}</strong> role has been reviewed — and you've been selected to proceed to our technical assessment stage.`)}
        ${callout("Assessment Details", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Role", `<strong>${jobTitle}</strong>`)}
            ${infoRow("Format", `<strong>AI-Proctored Technical Screening</strong>`)}
            ${infoRow("Link Expires", `<strong>In ${expiryHours} hours</strong>`)}
            ${infoRow("Max Attempts", `3 attempts available`)}
          </table>
        `, 'info')}
        ${btn("Begin Technical Assessment", interviewLink)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendDeclineEmail(toEmail: string, applicantName: string, jobTitle: string) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `CyberLabSec — Update on Your Application for ${jobTitle}`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Application Update")}
      ${BODY_START}
        ${heading1(`Hi ${firstName},`)}
        ${paragraph(`Thank you for your interest in the <strong>${jobTitle}</strong> position. After thorough review, we have decided to move forward with candidates whose profiles most closely align with our current requirements.`)}
        ${paragraph(`We genuinely encourage you to apply again in the future.`)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendEmployeeCredentials(toEmail: string, employeeName: string, employeeCode: string, temporaryPassword: string, portalUrl: string, offerLetterPdfBase64?: string, customMessage?: string) {
  const firstName = employeeName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Welcome to the Team, ${firstName}! — Your CyberLabSec Portal Access`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Welcome to CyberLabSec")}
      ${BODY_START}
        ${heading1(`Welcome Aboard, ${firstName}! 🚀`)}
        ${paragraph(`Your offer has been formally approved by the executive board. We are thrilled to have you join our elite team.`)}
        ${customMessage ? callout("Personal Message", customMessage, "info") : ""}
        ${callout("Secure Portal Credentials", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Employee ID", `<code class="code-box">${employeeCode}</code>`)}
            ${infoRow("Temp Password", `<code class="code-box">${temporaryPassword}</code>`)}
          </table>
        `, 'info')}
        ${callout("⚠️ Mandatory Security Protocol", `You are required to change this password immediately upon your first login.`, 'danger')}
        ${btn("Initialize Portal Access", portalUrl)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
    attachments: offerLetterPdfBase64 ? [{ filename: "CyberLabSec_Offer_Letter.pdf", content: Buffer.from(offerLetterPdfBase64, "base64"), contentType: "application/pdf" }] : [],
  });
}

export async function sendTerminationLetter(toEmail: string, employeeName: string, terminationLetterPdfBase64: string) {
  const firstName = employeeName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `CyberLabSec — Employment Status Notification`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Employment Update")}
      ${BODY_START}
        ${heading1(`Hi ${firstName},`)}
        ${paragraph(`Please find your official employment status notification letter attached.`)}
        ${callout("Access Revocation Notice", `Your authorization to access CyberLabSec systems has been revoked.`, 'danger')}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
    attachments: [{ filename: "CyberLabSec_Employment_Status.pdf", content: Buffer.from(terminationLetterPdfBase64, "base64"), contentType: "application/pdf" }],
  });
}

export async function sendAnnouncement(toEmails: string[], subject: string, message: string, senderName: string) {
  await transporter.sendMail({
    from: FROM, to: toEmails.join(","), subject: `[CyberLabSec] ${subject}`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Internal Broadcast")}
      ${BODY_START}
        ${heading1(subject)}
        ${callout("", `<div style="white-space: pre-wrap;">${message}</div>`, 'info')}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
  await transporter.sendMail({
    from: FROM, to, subject,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Secure Transmission")}
      ${BODY_START}${html}${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
    attachments,
  });
}

export async function sendApplicationReceivedEmail(toEmail: string, applicantName: string, jobTitle: string, referenceId: string, trackingUrl: string) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Application Received — ${jobTitle} at CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Application Confirmation")}
      ${BODY_START}
        ${heading1(`We've Got Your Application, ${firstName}!`)}
        ${paragraph(`Thank you for applying to the <strong>${jobTitle}</strong> position.`)}
        ${callout("Application Summary", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Reference ID", `<code class="code-box">${referenceId}</code>`)}
            ${infoRow("Status", `<strong>Awaiting Review</strong>`)}
          </table>
        `, 'info')}
        ${btn("Track Application Status", trackingUrl)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendInterviewCompleteEmail(toEmail: string, applicantName: string, jobTitle: string, status: string) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Interview Completed — Update on your Application`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Interview Completed")}
      ${BODY_START}
        ${heading1(`Assessment Finalized, ${firstName}`)}
        ${paragraph(`Your performance data has been processed.`)}
        ${callout("Status Update", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Position", `<strong>${jobTitle}</strong>`)}
            ${infoRow("Status", `<strong>${status}</strong>`)}
          </table>
        `, ['rejected', 'failed', 'interview failed'].includes(status.toLowerCase()) ? 'danger' : 'success')}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendInterviewRetryEmail(toEmail: string, applicantName: string, jobTitle: string, score: number, attemptsLeft: number) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Interview Attempt Failed — Retry Available`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Interview Retry")}
      ${BODY_START}
        ${heading1(`Attempt Processed, ${firstName}`)}
        ${paragraph(`You did not pass the technical assessment on this attempt.`)}
        ${callout("Status Update", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Position", `<strong>${jobTitle}</strong>`)}
            ${infoRow("Score", `<strong>${score}%</strong>`)}
            ${infoRow("Attempts Left", `<strong>${attemptsLeft}</strong>`)}
          </table>
        `, 'danger')}
        ${paragraph(`Don't worry, you still have attempts left. Please log in with your Reference ID to retry the assessment.`)}
        ${button(`https://cyberlabsec.tech/careers/status`, "Retry Interview")}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendMeetingInvite(toEmail: string, participantName: string, meetingTitle: string, meetingTime: string, meetingLink: string) {
  const firstName = participantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Meeting Scheduled: ${meetingTitle} | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Meeting Scheduled")}
      ${BODY_START}
        ${heading1(`Hello ${firstName},`)}
        ${callout("Meeting Details", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Topic", `<strong>${meetingTitle}</strong>`)}
            ${infoRow("Schedule", `<strong>${meetingTime}</strong>`)}
          </table>
        `, 'info')}
        ${btn("Join Secure Meeting", meetingLink)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendTaskAssigned(toEmail: string, assigneeName: string, taskTitle: string, priority: string, taskUrl: string) {
  const firstName = assigneeName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `New Task Assigned: ${taskTitle} | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Task Assignment")}
      ${BODY_START}
        ${heading1(`Task Assigned: ${firstName}`)}
        ${callout("Task Details", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Objective", `<strong>${taskTitle}</strong>`)}
            ${infoRow("Priority", `<strong>${priority.toUpperCase()}</strong>`)}
          </table>
        `, priority.toLowerCase() === 'high' ? 'danger' : 'info')}
        ${btn("View Task Details", taskUrl)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendVerificationEmail(toEmail: string, userName: string, verificationCode: string, verificationUrl: string) {
  const firstName = userName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Security Alert: Verify Your CyberLabSec Account`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Identity Verification")}
      ${BODY_START}
        ${heading1(`Identity Verification Required`)}
        ${paragraph(`Hello ${firstName}, a request to authenticate your identity was recently made.`)}
        ${callout("Verification Code", `<div style="text-align: center;"><code class="code-box" style="font-size: 24px;">${verificationCode}</code></div>`, 'info')}
        ${btn("Verify Identity", verificationUrl)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendApplicantOTPEmail(toEmail: string, verificationCode: string) {
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `CyberLabSec Application - Verification Code`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Identity Verification")}
      ${BODY_START}
        ${heading1(`Verification Code`)}
        ${paragraph(`Please use the code below to verify your email address.`)}
        ${callout("Verification Code", `<div style="text-align: center;"><code class="code-box" style="font-size: 24px;">${verificationCode}</code></div>`, 'info')}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

export async function sendOfferLetter(toEmail: string, applicantName: string, jobTitle: string, offerUrl: string, expiresInDays: number) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Official Job Offer: ${jobTitle} | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Official Offer Letter")}
      ${BODY_START}
        ${heading1(`Congratulations, ${firstName}!`)}
        ${paragraph(`After a rigorous selection process and technical evaluation, we are exceptionally pleased to formally extend an offer for the <strong>${jobTitle}</strong> position at CyberLabSec.`)}
        ${paragraph(`Your demonstrated aptitude in offensive security, problem-solving, and technical acumen made a strong impression on our team. We believe your expertise will be a formidable asset to our operations.`)}
        
        ${callout("Offer Details", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Position", `<strong>${jobTitle}</strong>`)}
            ${infoRow("Organization", `<strong>CyberLabSec</strong>`)}
            ${infoRow("Action Required", `Please review and sign the attached digital offer.`)}
          </table>
        `, 'success')}
        
        ${btn("View & Respond to Offer", offerUrl)}
        
        ${callout("Time Sensitive", `
          Please note that this offer is valid for exactly <strong>${expiresInDays} days</strong> from the date of this transmission. Should you require any clarification regarding the terms, do not hesitate to reach out.
        `, 'danger')}
        
        ${paragraph(`We look forward to welcoming you to the team.`)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}
