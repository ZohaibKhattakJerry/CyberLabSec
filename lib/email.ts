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
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        You can track your application status anytime using your reference ID on our <a href="${process.env.NEXT_PUBLIC_APP_URL}/careers" style="color: #6a0dad; text-decoration: none;">careers page</a>.
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
const pipeline = (activeStage: 'Reviewing' | 'Interview' | 'Decision') => {
  const s = (stage: string) => activeStage === stage ? `
    <td align="center" style="width: 33.33%;">
      <div style="background: #7c3aed; color: #fff; border-radius: 20px; padding: 6px 12px; font-size: 13px; font-weight: bold; display: inline-block;">${stage}</div>
    </td>
  ` : `
    <td align="center" style="width: 33.33%;">
      <div style="background: #f4f4f5; color: #a1a1aa; border-radius: 20px; padding: 6px 12px; font-size: 13px; font-weight: 600; display: inline-block; border: 1px solid #e4e4e7;">${stage}</div>
    </td>
  `;
  return `
    <div style="margin: 32px 0 24px 0;">
      <p style="text-align: center; font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Application Progress</p>
      <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
        <tr>
          ${s('Reviewing')}
          ${s('Interview')}
          ${s('Decision')}
        </tr>
      </table>
    </div>
  `;
};

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
        ${heading1(`Update on your Application`)}
        ${paragraph(`Dear ${firstName},`)}
        ${paragraph(`Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position and for your interest in joining CyberLabSec. We appreciate the effort you put into your application.`)}
        ${paragraph(`After careful consideration, we have decided to move forward with other candidates whose profiles more closely align with the specific needs of our team at this time.`)}
        ${paragraph(`Please know that this decision does not reflect on your skills or potential. We will keep your resume in our database and may reach out if a suitable opportunity arises in the future.`)}
        ${paragraph(`We wish you the very best in your professional endeavors.<br/><br/>Sincerely,<br/><strong>CyberLabSec Human Resources</strong>`)}
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
    from: FROM, to: toEmail, subject: `Welcome to the Team, ${firstName}! — Your CyberLabSec Offer and Next Steps`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Welcome to CyberLabSec")}
      ${BODY_START}
        ${heading1(`Welcome Aboard, ${firstName}!`)}
        ${paragraph(`Congratulations! We are absolutely thrilled to officially welcome you to the CyberLabSec team. After reviewing your impressive background and technical performance, we are confident that you will be a tremendous addition to our organization.`)}
        ${paragraph(`Please find your <strong>Official Offer Letter</strong> attached to this email. We encourage you to review the details closely as it outlines your role, compensation, and upcoming responsibilities.`)}
        ${customMessage ? callout("Personal Message", customMessage, "success") : ""}
        
        ${callout("Your Secure Portal Access", `
          To proceed, please access our employee portal using the credentials provisioned below. You will be required to update your security password immediately upon logging in.
          <br/><br/>
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Employee ID", `<code class="code-box">${employeeCode}</code>`)}
            ${infoRow("Temp Password", `<code class="code-box">${temporaryPassword}</code>`)}
          </table>
        `, 'info')}
        
        ${callout("Next Steps", `
          <ul style="margin: 0; padding-left: 20px;">
            <li>Log in using the credentials provided above.</li>
            <li>Review and sign your digital Offer Letter within the portal.</li>
            <li>Complete your profile and await your official onboarding schedule.</li>
          </ul>
        `, 'info')}

        ${btn("Initialize Portal Access", portalUrl)}
        
        ${paragraph(`If you have any questions before your start date, please do not hesitate to reach out to our team.`)}
        ${paragraph(`Welcome to CyberLabSec — we look forward to achieving great things together.<br/><br/>Best Regards,<br/><strong>The CyberLabSec Leadership Team</strong>`)}
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
        ${heading1(`Employment Status Notification`)}
        ${paragraph(`Dear ${firstName},`)}
        ${paragraph(`This email serves as official notice regarding your employment status at CyberLabSec. Please find your detailed Employment Status Notification letter attached for your records.`)}
        ${callout("Access Revocation Notice", `As part of this transition, your authorization to access internal CyberLabSec systems and platforms has been revoked, effective immediately.`, 'danger')}
        ${paragraph(`If you have any questions regarding your final settlement, benefits, or the transition process, please reply to this email to coordinate with our HR department.`)}
        ${paragraph(`We wish you well in your future endeavors.<br/><br/>Sincerely,<br/><strong>CyberLabSec Human Resources</strong>`)}
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

export async function sendCombinedShortlistEmail(toEmail: string, applicantName: string, jobTitle: string, referenceId: string, interviewLink: string, expiryHours: number = 48) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `Application Shortlisted — Technical Interview for ${jobTitle} | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Technical Assessment Invitation")}
      ${BODY_START}
        ${heading1(`Amazing news, ${firstName}!`)}
        ${paragraph(`Your profile has been reviewed and you have been <strong>shortlisted</strong> for the technical assessment for the <strong>${jobTitle}</strong> role.`)}
        ${callout("Assessment Details", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Role", `<strong>${jobTitle}</strong>`)}
            ${infoRow("Link Expires", `<strong>In ${expiryHours} hours</strong>`)}
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

export async function sendApplicationReceivedEmail(toEmail: string, applicantName: string, jobTitle: string, referenceId: string, trackingUrl: string) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Application Received — ${jobTitle} at CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Application Received")}
      ${BODY_START}
        ${heading1(`We've Got Your Application, ${firstName}!`)}
        ${paragraph(`Thank you for applying to the <strong>${jobTitle}</strong> position.`)}
        ${pipeline('Reviewing')}
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

export async function sendStatusUpdateEmail(toEmail: string, applicantName: string, jobTitle: string, status: string, trackingUrl: string) {
  const firstName = applicantName.split(" ")[0];
  let pipelineStage: 'Reviewing' | 'Interview' | 'Decision' = 'Decision';
  if (status === 'Reviewing') pipelineStage = 'Reviewing';
  else if (status.includes('Interview')) pipelineStage = 'Interview';

  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Status Update on your Application for ${jobTitle}`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Application Update")}
      ${BODY_START}
        ${heading1(`Update on your Application, ${firstName}`)}
        ${paragraph(`There has been an update regarding your application for the <strong>${jobTitle}</strong> position.`)}
        ${pipeline(pipelineStage)}
        ${callout("Current Status", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Position", `<strong>${jobTitle}</strong>`)}
            ${infoRow("Status", `<strong>${status}</strong>`)}
          </table>
        `, ['rejected', 'failed', 'interview failed'].includes(status.toLowerCase()) ? 'danger' : 'success')}
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
  const isPass = status === "Selected – Waiting for Approval";
  const isCheat = status === "Cheating" || status === "Rejected";
  
  const headline = isPass ? `Outstanding Performance, ${firstName}!` : (isCheat ? `Interview Terminated` : `Interview Results Finalized`);
  const subtitle = isPass ? "Technical Interview Passed" : (isCheat ? "Security Violation" : "Technical Interview Failed");
  const stage = isPass ? 'Decision' : 'Interview';
  const calloutType = isPass ? 'success' : 'danger';
  
  const messageBody = isPass
    ? paragraph(`Congratulations! You have successfully passed the technical assessment for the <strong>${jobTitle}</strong> role. Your application has been advanced to the final decision stage. Our executive team will review your complete profile and be in touch with a final decision very soon.`)
    : (isCheat
        ? paragraph(`Irregular activity was detected during your technical assessment for the <strong>${jobTitle}</strong> role. As a result, your interview has been permanently terminated and your application will not move forward.`)
        : paragraph(`Thank you for completing the technical assessment for the <strong>${jobTitle}</strong> role. Unfortunately, after utilizing all available attempts, your score did not meet our passing criteria for this specific position.`));

  await transporter.sendMail({
    from: FROM, to: toEmail, subject: isPass ? `Interview Passed — Final Review for ${jobTitle} | CyberLabSec` : `Interview Results — ${jobTitle} | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection(subtitle)}
      ${BODY_START}
        ${pipeline(stage)}
        ${heading1(headline)}
        ${messageBody}
        ${callout("Final Decision", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Position", `<strong>${jobTitle}</strong>`)}
            ${infoRow("Status", `<strong>${status}</strong>`)}
          </table>
        `, calloutType)}
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
    from: FROM, to: toEmail, subject: `Interview Attempt Failed — Retry Available | CyberLabSec`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Interview Retry Available")}
      ${BODY_START}
        ${pipeline('Interview')}
        ${heading1(`Keep Going, ${firstName}`)}
        ${paragraph(`You did not pass the technical assessment on this attempt for the <strong>${jobTitle}</strong> role. However, we encourage resilience and you still have remaining attempts.`)}
        ${callout("Attempt Summary", `
          <table style="width: 100%; border-collapse: collapse;">
            ${infoRow("Position", `<strong>${jobTitle}</strong>`)}
            ${infoRow("Previous Score", `<strong>${score}%</strong>`)}
            ${infoRow("Attempts Left", `<strong>${attemptsLeft}</strong>`)}
          </table>
        `, 'danger')}
        ${paragraph(`Please log in with your Reference ID to retry the assessment. A new set of questions will be dynamically generated for you.`)}
        ${btn("Retry Technical Interview", "https://cyberlabsec.tech/careers/status")}
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

export async function sendHiredEmail(toEmail: string, applicantName: string, jobTitle: string) {
  const firstName = applicantName.split(" ")[0];
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: `Welcome to CyberLabSec! You're Hired — ${jobTitle}`,
    html: `
      ${HTML_START}
      ${WRAP_START}
      ${headerSection("Welcome Aboard")}
      ${BODY_START}
        ${pipeline('Decision')}
        ${heading1(`Congratulations, ${firstName}! 🎉`)}
        ${paragraph(`We are thrilled to officially welcome you to the CyberLabSec team as our new <strong>${jobTitle}</strong>.`)}
        ${paragraph(`Your performance throughout the interview and technical assessment was outstanding, and we are incredibly excited about the value and expertise you will bring to our operations.`)}
        
        ${callout("What's Next?", `
          <ul style="margin: 0; padding-left: 20px;">
            <li>Our HR team will reach out shortly with your official onboarding documents.</li>
            <li>You will receive your secure company credentials and equipment details.</li>
            <li>We will schedule a kickoff meeting to introduce you to the team.</li>
          </ul>
        `, 'success')}
        
        ${paragraph(`Once again, welcome aboard. We look forward to achieving great things together.`)}
      ${BODY_END}
      ${footerSection()}
      ${WRAP_END}
      ${HTML_END}
    `,
  });
}
