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

// ─── Shared Design Tokens & HTML Building Blocks ─────────────────────────────
const GLOBAL_HEAD = `
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; background-color: #ffffff; }
      table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      a { text-decoration: none; }
      @media (max-width: 600px) {
        .responsive-table { width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
        .body-cell { padding: 25px 20px !important; }
        .header-cell { padding: 30px 20px 25px !important; }
        .wrap-cell { padding: 0 !important; }
      }
      @media (prefers-color-scheme: dark) {
        body { background-color: #000000 !important; }
      }
    </style>
  </head>
`;

const HTML_START = `<!DOCTYPE html><html>${GLOBAL_HEAD}<body>`;
const HTML_END = `</body></html>`;

const WRAP_START = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
    <tr>
      <td class="wrap-cell" align="center" style="padding: 40px 20px;">
        <table class="responsive-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #0a0a0f; border: 1px solid #1f1f2e; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);">
`;
const WRAP_END = `
        </table>
      </td>
    </tr>
  </table>
`;

const headerSection = (subtitle: string) => `
  <tr>
    <td class="header-cell" align="center" style="background: linear-gradient(180deg, #161622 0%, #0d0d12 100%); padding: 40px 40px 30px; border-bottom: 1px solid #1f1f2e;">
      <h2 style="font-size: 34px; font-weight: 900; margin: 0; letter-spacing: -0.03em; font-family: 'Inter', sans-serif;">
        <span style="color: #ffffff; text-shadow: 0 0 20px rgba(112, 0, 255, 0.5);">CyberLab</span><span style="color: #00f0ff; text-shadow: 0 0 20px rgba(0, 240, 255, 0.6);">Sec</span>
      </h2>
      <p style="color: #7000ff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3em; margin: 12px 0 0 0; text-shadow: 0 0 10px rgba(112,0,255,0.3);">${subtitle}</p>
    </td>
  </tr>
`;

const footerSection = (extra: string = "") => `
  <tr>
    <td align="center" style="padding: 30px 40px; border-top: 1px solid #1f1f2e; background-color: #08080b;">
      <p style="color: #606070; font-size: 12px; margin: 0 0 12px 0; line-height: 1.6;">
        ${extra ? extra + "<br/><br/>" : ""}
        © ${new Date().getFullYear()} CyberLabSec · Offensive Security & Pentesting Operations<br/>
        <a href="https://cyberlabsec.tech" style="color: #7000ff; text-decoration: none;">cyberlabsec.tech</a>
        &nbsp;|&nbsp; <a href="mailto:contact@cyberlabsec.tech" style="color: #606070; text-decoration: none;">contact@cyberlabsec.tech</a>
      </p>
    </td>
  </tr>
`;

const BODY_START = `<tr><td class="body-cell" style="padding: 45px 40px; background-color: #0d0d12; color: #e0e0e0;">`;
const BODY_END = `</td></tr>`;

const divider = () => `
  <div style="height: 1px; background: linear-gradient(90deg, rgba(31,31,46,0) 0%, rgba(31,31,46,1) 50%, rgba(31,31,46,0) 100%); margin: 30px 0;"></div>
`;

const infoRow = (label: string, value: string) => `
  <tr>
    <td style="padding: 14px 0; border-bottom: 1px solid #1f1f2e; color: #a0a0b0; font-size: 14px; font-weight: 600; width: 140px; vertical-align: top;">${label}</td>
    <td style="padding: 14px 0; border-bottom: 1px solid #1f1f2e; color: #ffffff; font-size: 14px; vertical-align: top;">${value}</td>
  </tr>
`;

const btn = (text: string, url: string) => `
  <div style="text-align: center; margin: 35px 0 15px 0;">
    <a href="${url}" style="display: inline-block; background: linear-gradient(90deg, #7000ff 0%, #00f0ff 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 8px 25px rgba(112,0,255,0.4), 0 0 15px rgba(0,240,255,0.2); border: 1px solid rgba(255,255,255,0.1);">
      ${text}
    </a>
  </div>
`;

const heading1 = (text: string) => `<h1 style="font-size: 26px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; letter-spacing: -0.02em;">${text}</h1>`;
const paragraph = (text: string, color: string = "#a0a0b0") => `<p style="color: ${color}; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;">${text}</p>`;

const callout = (title: string, content: string, type: 'info' | 'danger' | 'success' = 'info') => {
  const colors = {
    info: { border: '#7000ff', bg: 'rgba(112,0,255,0.05)', glow: 'rgba(112,0,255,0.2)' },
    danger: { border: '#ff0055', bg: 'rgba(255,0,85,0.05)', glow: 'rgba(255,0,85,0.2)' },
    success: { border: '#00ff9d', bg: 'rgba(0,255,157,0.05)', glow: 'rgba(0,255,157,0.2)' },
  };
  const c = colors[type];
  return `
    <div style="background: ${c.bg}; border: 1px solid ${c.glow}; border-left: 4px solid ${c.border}; border-radius: 8px; padding: 24px; margin-bottom: 28px;">
      ${title ? `<p style="color: ${c.border}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0; text-shadow: 0 0 10px ${c.glow};">${title}</p>` : ''}
      <div style="color: #e0e0e0; font-size: 15px; line-height: 1.7;">${content}</div>
    </div>
  `;
};

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
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Technical Assessment Invitation")}
      ${BODY_START}
        ${heading1(`Congratulations, ${firstName}!`)}
        ${paragraph(`Your application for the <strong style="color: #ffffff;">${jobTitle}</strong> role has been reviewed — and you've been selected to proceed to our technical assessment stage.`)}
        
        ${callout("Assessment Details", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Role", `<strong style="color: #ffffff;">${jobTitle}</strong>`)}
            ${infoRow("Format", `<span style="color: #00f0ff;">AI-Proctored Technical Screening</span>`)}
            ${infoRow("Link Expires", `<span style="color: #ffb800;">In ${expiryHours} hours</span>`)}
            ${infoRow("Max Attempts", `3 attempts available`)}
          </table>
        `, 'info')}

        ${callout("⚠ Critical Security Protocol", `
          <ul style="margin: 0; padding-left: 18px;">
            <li style="margin-bottom: 8px;">Ensure a <strong style="color: #ffffff;">stable, uninterrupted internet</strong> connection before starting.</li>
            <li style="margin-bottom: 8px;">The assessment <strong style="color: #ffffff;">cannot be paused</strong> once begun.</li>
            <li style="margin-bottom: 8px;">Tab switching, copy-pasting, or AI tool usage will <strong style="color: #ff0055;">immediately flag and terminate</strong> your session.</li>
            <li>Each question has a <strong style="color: #ffffff;">timed window</strong>.</li>
          </ul>
        `, 'danger')}

        ${btn("Begin Technical Assessment", interviewLink)}
        
        <p style="color: #606070; font-size: 13px; line-height: 1.6; text-align: center; margin-top: 20px;">
          Secure Access Link (copy if button fails):<br/>
          <a href="${interviewLink}" style="color: #7000ff; word-break: break-all;">${interviewLink}</a>
        </p>
      ${BODY_END}
      ${footerSection("If you did not apply to this position, you may safely ignore this email.")}
      ${WRAP_END}
      ${HTML_END}
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
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Application Update")}
      ${BODY_START}
        ${heading1(`Hi ${firstName},`)}
        ${paragraph(`Thank you for your interest in the <strong style="color: #ffffff;">${jobTitle}</strong> position and for investing your time in our rigorous assessment process.`)}
        ${divider()}
        ${paragraph(`After a thorough review of all applications and technical evaluations, we have decided to move forward with candidates whose profiles most closely align with the specific requirements of this role at this time.`)}
        ${paragraph(`This decision does not reflect a lack of capability on your part — the competition was exceptionally strong. We genuinely encourage you to apply again as our operations expand.`)}
        
        ${callout("Stay Connected", `
          We regularly open new positions across our offensive security operations. Visit our careers portal to be among the first to apply when a new role opens that matches your skills.
        `, 'info')}
      ${BODY_END}
      ${footerSection("Sent with respect by the CyberLabSec Recruitment Team.")}
      ${WRAP_END}
      ${HTML_END}
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
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Welcome to CyberLabSec")}
      ${BODY_START}
        ${heading1(`Welcome Aboard, ${firstName}! 🚀`)}
        ${paragraph(`Your offer has been formally approved by the executive board. We are thrilled to have you join our elite team and look forward to the impact you'll make with us.`)}

        ${customMessage ? callout("Personal Message", customMessage, "info") : ""}

        <p style="color: #ffffff; font-size: 16px; margin: 0 0 16px 0; font-weight: 700;">Secure Portal Credentials</p>
        
        ${callout("", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Employee ID", `<code style="background: rgba(112,0,255,0.1); border: 1px solid rgba(112,0,255,0.3); padding: 6px 12px; border-radius: 6px; color: #00f0ff; font-size: 16px; font-weight: 800; letter-spacing: 2px;">${employeeCode}</code>`)}
            ${infoRow("Temp Password", `<code style="background: rgba(112,0,255,0.1); border: 1px solid rgba(112,0,255,0.3); padding: 6px 12px; border-radius: 6px; color: #00f0ff; font-size: 15px; font-weight: 800; letter-spacing: 1px;">${temporaryPassword}</code>`)}
          </table>
        `, 'info')}
        
        ${callout("⚠️ Mandatory Security Protocol", `
          You are required to change this password immediately upon your first login. Do not share these credentials with anyone.
        `, 'danger')}

        ${btn("Initialize Portal Access", portalUrl)}
        
        ${divider()}
        <p style="color: #a0a0b0; font-size: 13px; line-height: 1.7; margin: 0;">
          ${offerLetterPdfBase64 ? "Your digitally signed offer letter is attached to this email for your records.<br/><br/>" : ""}
          If you encounter any authorization issues before your start date, contact <a href="mailto:hr@cyberlabsec.tech" style="color: #00f0ff;">hr@cyberlabsec.tech</a>.
        </p>
      ${BODY_END}
      ${footerSection("Secure Communication via CyberLabSec HR & Operations.")}
      ${WRAP_END}
      ${HTML_END}
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
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Employment Update")}
      ${BODY_START}
        ${heading1(`Hi ${firstName},`)}
        ${paragraph(`Please find your official employment status notification letter attached to this secure transmission.`)}
        
        ${callout("Access Revocation Notice", `
          Your authorization to access CyberLabSec internal systems, operational portals, and secure facilities has been revoked effective immediately. All company assets must be returned per the terms outlined in your contract.
        `, 'danger')}
        
        ${paragraph(`For any questions regarding final settlement, documentation, or transitional processes, please contact our HR department securely at: <a href="mailto:hr@cyberlabsec.tech" style="color: #ff0055;">hr@cyberlabsec.tech</a>`)}
      ${BODY_END}
      ${footerSection("CyberLabSec HR & Operations")}
      ${WRAP_END}
      ${HTML_END}
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
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Internal Broadcast")}
      ${BODY_START}
        ${heading1(subject)}
        ${callout("", `<div style="white-space: pre-wrap; color: #e0e0e0;">${message}</div>`, 'info')}
        <p style="color: #606070; font-size: 14px; text-align: right; font-style: italic; margin: 0; font-weight: 600;">
          — ${senderName}, CyberLabSec Command
        </p>
      ${BODY_END}
      ${footerSection("This is a secured internal broadcast. Do not reply directly.")}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

// ─── 6. Generic send ─────────────────────────────────────────────────────────
export async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: unknown[] }) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Secure Transmission")}
      ${BODY_START}
        ${html}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
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
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Application Confirmation")}
      ${BODY_START}
        ${heading1(`We've Got Your Application, ${firstName}!`)}
        ${paragraph(`Thank you for applying to the <strong style="color: #ffffff;">${jobTitle}</strong> position at CyberLabSec. Your dossier has been successfully encrypted and submitted to our review queue.`)}
        
        ${callout("Application Summary", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Reference ID", `<code style="background: rgba(0,240,255,0.1); border: 1px solid rgba(0,240,255,0.3); padding: 5px 10px; border-radius: 5px; color: #00f0ff; font-size: 14px; font-weight: 800;">${referenceId}</code>`)}
            ${infoRow("Position", `<span style="color: #e0e0e0;">${jobTitle}</span>`)}
            ${infoRow("Status", `<span style="color: #00ff9d; font-weight: 700; text-shadow: 0 0 10px rgba(0,255,157,0.5);">● Awaiting Review</span>`)}
          </table>
        `, 'info')}

        ${paragraph(`Our operations team carefully analyzes every candidate. If your profile matches our stringent requirements, you will receive a secured technical assessment invitation. You can monitor your real-time status below.`)}
        
        ${btn("Track Application Status", trackingUrl)}
        
        ${divider()}
        <p style="color: #606070; font-size: 13px; text-align: center; line-height: 1.6; margin: 0;">
          Retain this transmission — your Reference ID is <strong style="color: #a0a0b0;">${referenceId}</strong>.<br/>
          You will need it to authenticate to your status dashboard.
        </p>
      ${BODY_END}
      ${footerSection("Sent by the CyberLabSec Recruitment Team.")}
      ${WRAP_END}
      ${HTML_END}
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
  const isRejected = status.toLowerCase() === 'rejected';
  
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Interview Completed — Update on your Application`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Interview Completed")}
      ${BODY_START}
        ${heading1(`Assessment Finalized, ${firstName}`)}
        ${paragraph(`Thank you for taking the time to complete the AI-proctored technical screening for the <strong style="color: #ffffff;">${jobTitle}</strong> role.`)}
        ${paragraph(`Your performance data has been successfully processed and scored. Our team is currently reviewing the analytics alongside your application profile.`)}
        
        ${callout("Status Update", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Position", `<span style="color: #e0e0e0;">${jobTitle}</span>`)}
            ${infoRow("Status", `<span style="color: ${isRejected ? '#ff0055' : '#00ff9d'}; font-weight: 700; text-shadow: 0 0 10px ${isRejected ? 'rgba(255,0,85,0.5)' : 'rgba(0,255,157,0.5)'};">● ${status}</span>`)}
          </table>
        `, isRejected ? 'danger' : 'success')}

        ${paragraph(`We will communicate the next steps in your recruitment protocol shortly.`)}
      ${BODY_END}
      ${footerSection("Sent by the CyberLabSec Recruitment Team.")}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

// ─── 9. Meeting Scheduled ────────────────────────────────────────────────────
export async function sendMeetingInvite(
  toEmail: string,
  participantName: string,
  meetingTitle: string,
  meetingTime: string,
  meetingLink: string
) {
  const firstName = participantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Meeting Scheduled: ${meetingTitle} | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Meeting Scheduled")}
      ${BODY_START}
        ${heading1(`Hello ${firstName},`)}
        ${paragraph(`A new secure meeting has been scheduled and requires your attendance.`)}
        
        ${callout("Meeting Details", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Topic", `<strong style="color: #ffffff;">${meetingTitle}</strong>`)}
            ${infoRow("Schedule", `<span style="color: #00f0ff;">${meetingTime}</span>`)}
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

// ─── 10. Task Assigned ───────────────────────────────────────────────────────
export async function sendTaskAssigned(
  toEmail: string,
  assigneeName: string,
  taskTitle: string,
  priority: string,
  taskUrl: string
) {
  const firstName = assigneeName.split(" ")[0];
  const priorityColor = priority.toLowerCase() === 'high' ? '#ff0055' : (priority.toLowerCase() === 'medium' ? '#ffb800' : '#00ff9d');
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `New Task Assigned: ${taskTitle} | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Task Assignment")}
      ${BODY_START}
        ${heading1(`Task Assigned: ${firstName}`)}
        ${paragraph(`A new operation task has been assigned to your queue.`)}
        
        ${callout("Task Details", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Objective", `<strong style="color: #ffffff;">${taskTitle}</strong>`)}
            ${infoRow("Priority", `<span style="color: ${priorityColor}; font-weight: 700;">${priority.toUpperCase()}</span>`)}
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

// ─── 11. Verification Email ──────────────────────────────────────────────────
export async function sendVerificationEmail(
  toEmail: string,
  userName: string,
  verificationCode: string,
  verificationUrl: string
) {
  const firstName = userName.split(" ")[0];
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Security Alert: Verify Your CyberLabSec Account`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Identity Verification")}
      ${BODY_START}
        ${heading1(`Identity Verification Required`)}
        ${paragraph(`Hello ${firstName}, a request to authenticate your identity was recently made. Use the secure code below to verify your session.`)}
        
        ${callout("Verification Code", `
          <div style="text-align: center; margin: 10px 0;">
            <code style="background: rgba(112,0,255,0.1); border: 1px solid rgba(112,0,255,0.3); padding: 15px 25px; border-radius: 8px; color: #00f0ff; font-size: 28px; font-weight: 900; letter-spacing: 5px;">${verificationCode}</code>
          </div>
        `, 'info')}

        ${callout("⚠️ Security Warning", `
          If you did not request this verification, your credentials may be compromised. Please contact security operations immediately.
        `, 'danger')}

        ${btn("Verify Identity", verificationUrl)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}

// ─── 12. Applicant OTP Email ─────────────────────────────────────────────────
export async function sendApplicantOTPEmail(toEmail: string, verificationCode: string) {
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `CyberLabSec Application - Verification Code`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Identity Verification")}
      ${BODY_START}
        ${heading1(`Verification Code`)}
        ${paragraph(`Please use the code below to verify your email address and continue with your application.`)}
        
        ${callout("Verification Code", `
          <div style="text-align: center; margin: 10px 0;">
            <code style="background: rgba(112,0,255,0.1); border: 1px solid rgba(112,0,255,0.3); padding: 15px 25px; border-radius: 8px; color: #00f0ff; font-size: 28px; font-weight: 900; letter-spacing: 5px;">${verificationCode}</code>
          </div>
        `, 'info')}

        ${paragraph(`This code expires in 10 minutes. Do not share this code with anyone.`)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}
