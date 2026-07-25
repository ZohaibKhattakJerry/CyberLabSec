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

const FROM = "CyberLabSec <contact@cyberlabsec.tech>";

const GLOBAL_HEAD = `
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <style>
      body { font-family: 'Inter', Helvetica, Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; background-color: #050505 !important; color: #e4e4e7 !important; }
      table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      a { text-decoration: none; }
      .bg-body { background-color: #050505 !important; }
      .card-bg { background-color: #0a0a0a !important; border: 1px solid #1f1f22 !important; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8) !important; overflow: hidden; }
      .header-cell { background: linear-gradient(135deg, #09090b 0%, #120b22 100%); padding: 50px 40px 40px; border-bottom: 1px solid #1f1f22; }
      .body-cell { background-color: #0a0a0a !important; padding: 45px 40px; color: #a1a1aa !important; }
      .footer-cell { background-color: #050505 !important; border-top: 1px solid #1f1f22 !important; padding: 35px 40px; }
      .footer-text { color: #52525b !important; font-size: 13px; margin: 0 0 12px 0; line-height: 1.6; }
      h1 { color: #ffffff !important; font-size: 28px; font-weight: 900; margin: 0 0 16px 0; letter-spacing: -0.03em; }
      p { color: #a1a1aa !important; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; font-weight: 400; }
      strong { color: #ffffff !important; font-weight: 700; }
      .info-label { color: #71717a !important; border-bottom: 1px solid #1f1f22 !important; padding: 16px 0; font-size: 14px; font-weight: 600; width: 140px; vertical-align: top; text-transform: uppercase; letter-spacing: 0.05em; }
      .info-value { color: #ffffff !important; border-bottom: 1px solid #1f1f22 !important; padding: 16px 0; font-size: 15px; vertical-align: top; font-weight: 500; }
      .code-box { background: #000000 !important; border: 1px solid #27272a !important; padding: 8px 12px; border-radius: 6px; color: #a855f7 !important; font-size: 16px; font-weight: 700; letter-spacing: 0.05em; display: inline-block; }
      .divider { height: 1px; background: #1f1f22 !important; margin: 35px 0; }
      @media (max-width: 600px) {
        .wrap-cell { padding: 15px 10px !important; }
        .responsive-table { width: 100% !important; border-radius: 12px !important; }
        .header-cell { padding: 40px 25px 30px !important; }
        .body-cell { padding: 35px 25px !important; }
        .footer-cell { padding: 30px 25px !important; }
        h1 { font-size: 24px !important; }
      }
    </style>
  </head>
`;

const HTML_START = `<!DOCTYPE html><html>${GLOBAL_HEAD}<body style="background-color: #050505; margin: 0; padding: 0;">`;
const HTML_END = `</body></html>`;

const WRAP_START = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-body" style="width: 100%; background-color: #050505;">
    <tr>
      <td class="wrap-cell" align="center" style="padding: 40px 20px;">
        <table class="responsive-table card-bg" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #0a0a0a; border: 1px solid #1f1f22; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
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
      <div style="display: inline-block; padding: 4px; background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2)); border-radius: 12px; margin-bottom: 16px;">
        <div style="background: #000; border: 1px solid rgba(124,58,237,0.3); border-radius: 8px; padding: 10px 20px;">
          <span style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.04em; background: linear-gradient(to right, #ffffff, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CyberLabSec</span>
        </div>
      </div>
      <p style="color: #a855f7; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin: 0; padding: 0;">${subtitle}</p>
    </td>
  </tr>
`;

const footerSection = (extra: string = "") => `
  <tr>
    <td class="footer-cell" align="center">
      <p class="footer-text">
        ${extra ? extra + "<br/><br/>" : ""}
        © ${new Date().getFullYear()} CyberLabSec · Elite Offensive Security & Pentesting Operations<br/>
        <a href="https://cyberlabsec.tech" style="color: #a855f7; text-decoration: none; font-weight: 600;">cyberlabsec.tech</a>
        &nbsp;|&nbsp; <a href="mailto:contact@cyberlabsec.tech" style="color: #71717a; text-decoration: none;">contact@cyberlabsec.tech</a>
      </p>
      <p style="color: #3f3f46; font-size: 13px; margin-top: 30px; font-weight: 500;">
        You can track your application status anytime using your reference ID on our <a href="${process.env.NEXT_PUBLIC_APP_URL}/careers" style="color: #3b82f6; text-decoration: none;">careers portal</a>.
      </p>
    </td>
  </tr>
`;

const BODY_START = `<tr><td class="body-cell">`;
const BODY_END = `</td></tr>`;

const callout = (title: string, content: string, type: 'info' | 'danger' | 'success' = 'info') => {
  const colors = {
    info: { border: '#7c3aed', bg: 'rgba(124,58,237,0.05)', text: '#a855f7', content: '#e4e4e7' },
    danger: { border: '#ef4444', bg: 'rgba(239,68,68,0.05)', text: '#f87171', content: '#e4e4e7' },
    success: { border: '#10b981', bg: 'rgba(16,185,129,0.05)', text: '#34d399', content: '#e4e4e7' },
  };
  const c = colors[type];
  return `
    <div style="background: ${c.bg}; border: 1px solid rgba(255,255,255,0.05); border-left: 4px solid ${c.border}; border-radius: 8px; padding: 24px; margin-bottom: 28px; color: ${c.content};">
      ${title ? `<p style="color: ${c.text}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0; padding: 0;">${title}</p>` : ''}
      <div style="font-size: 15px; line-height: 1.7; font-weight: 400;">${content}</div>
    </div>
  `;
};

const btn = (text: string, url: string) => `
  <div style="text-align: center; margin: 40px 0 20px 0;">
    <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%); color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 800; font-size: 15px; letter-spacing: 0.03em; box-shadow: 0 8px 25px rgba(124,58,237,0.3); border: 1px solid rgba(255,255,255,0.1);">
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
    <td class="info-value">${value}</td>
  </tr>
`;
const pipeline = (activeStage: 'Reviewing' | 'Interview' | 'Decision') => {
  const s = (stage: string) => activeStage === stage ? `
    <td align="center" style="width: 33.33%;">
      <div style="background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.15)); border: 1px solid rgba(124,58,237,0.4); color: #c084fc; border-radius: 30px; padding: 8px 16px; font-size: 12px; font-weight: 800; display: inline-block; box-shadow: 0 0 15px rgba(124,58,237,0.2);">
        ${stage}
      </div>
    </td>
  ` : `
    <td align="center" style="width: 33.33%;">
      <div style="background: rgba(255,255,255,0.03); color: #52525b; border-radius: 30px; padding: 8px 16px; font-size: 12px; font-weight: 600; display: inline-block; border: 1px solid rgba(255,255,255,0.05);">
        ${stage}
      </div>
    </td>
  `;
  return `
    <div style="margin: 35px 0 30px 0; padding: 25px 20px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.03); border-radius: 12px;">
      <p style="text-align: center; font-size: 11px; font-weight: 800; color: #52525b; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 16px 0;">Application Progress</p>
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
  const firstName = applicantName;
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `You've Been Shortlisted! Technical Assessment for ${jobTitle} | CyberLabSec`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Technical Assessment Invitation")}
      \${BODY_START}
        \${heading1(\`Congratulations, \${firstName}! 🎉\`)}
        \${paragraph(\`Your application for the <strong>\${jobTitle}</strong> role truly stood out to our executive hiring team. Out of hundreds of applicants, we were highly impressed by your background and are thrilled to invite you to the most critical stage of our elite selection process.\`)}
        \${paragraph(\`At CyberLabSec, we operate at the bleeding edge of offensive security. To guarantee we only onboard the absolute best, we have prepared a specialized, highly advanced AI-proctored technical assessment exclusively for you.\`)}
        \${callout("Assessment Details", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Role", \`<strong>\${jobTitle}</strong>\`)}
            \${infoRow("Format", \`<strong>AI-Proctored Technical Challenge</strong>\`)}
            \${infoRow("Link Expires", \`<strong>Strictly in \${expiryHours} hours</strong>\`)}
            \${infoRow("Max Attempts", \`<strong>Strictly 3 attempts allowed</strong>\`)}
          </table>
        \`, 'info')}
        \${paragraph(\`<strong>Critical Notice:</strong> You have exactly <strong>3 attempts</strong> to pass this assessment. If you fail to meet our stringent passing criteria after 3 attempts, or if our AI security systems detect any integrity violations, the link will permanently expire.\`)}
        \${paragraph(\`Prepare yourself. Ensure you are in a quiet, distraction-free environment with a highly stable connection. Once initiated, the challenge cannot be paused.\`)}
        \${btn("Initialize Technical Assessment", interviewLink)}
        \${paragraph(\`We are incredibly excited to see what you are truly capable of. Best of luck.<br/><br/>Warm regards,<br/><strong>The CyberLabSec Talent Acquisition Team</strong>\`)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendDeclineEmail(toEmail: string, applicantName: string, jobTitle: string) {
  const firstName = applicantName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Application Update: \${jobTitle} | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Candidacy Update" )}
      \${BODY_START}
        \${heading1(\`Update on your Application\`)}
        \${paragraph(\`Dear \${firstName},\`)}
        \${paragraph(\`Thank you for taking the time to apply for the <strong>\${jobTitle}</strong> position. We recognize the time and effort invested in your application, and we sincerely appreciate your interest in joining the elite ranks of CyberLabSec.\`)}
        \${paragraph(\`Our standards are incredibly high, and after a rigorous and meticulous review of your profile, we have decided to move forward with other candidates whose expertise more precisely aligns with our immediate operational requirements.\`)}
        \${paragraph(\`Please know that this decision does not diminish your skills or potential. We will retain your profile in our highly secured talent database and may reach out if a suitable mission arises in the future.\`)}
        \${paragraph(\`We wish you the absolute best in your continued professional endeavors.<br/><br/>Sincerely,<br/><strong>CyberLabSec Executive Human Resources</strong>\`)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendEmployeeCredentials(toEmail: string, employeeName: string, employeeCode: string, temporaryPassword: string, portalUrl: string, offerLetterPdfBase64?: string, customMessage?: string) {
  const firstName = employeeName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Welcome to the Elite Team, \${firstName}! 🚀 — Your CyberLabSec Offer and Next Steps\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Welcome to CyberLabSec")}
      \${BODY_START}
        \${heading1(\`Welcome Aboard, \${firstName}! 🌟\`)}
        \${paragraph(\`Congratulations! We are absolutely thrilled to officially welcome you to the CyberLabSec family. Out of an incredibly competitive pool of talent, your technical brilliance, relentless passion for cybersecurity, and perfect alignment with our core operational values made you the undeniable choice.\`)}
        \${paragraph(\`You are now part of an elite task force dedicated to offensive security and cutting-edge threat defense. We cannot wait to witness the massive impact you will make here.\`)}
        
        \${callout("Official Offer Enclosed", \`
          Please find your <strong>Official Offer Letter</strong> attached to this encrypted transmission as a PDF. Review the details closely, as it outlines your critical role, premium compensation package, and upcoming operational responsibilities.
        \`, 'success')}
        
        \${customMessage ? callout("A Personal Note", customMessage, "info") : ""}
        
        \${callout("Your Secure Portal Access", \`
          To finalize your onboarding protocol, you must access our highly secured internal employee portal using the credentials provisioned below. <strong>You will be mandatorily required to update your temporary passphrase immediately upon your initial login.</strong>
          <br/><br/>
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Employee ID", \`<code class="code-box">\${employeeCode}</code>\`)}
            \${infoRow("Temp Password", \`<code class="code-box">\${temporaryPassword}</code>\`)}
          </table>
        \`, 'info')}
        
        \${callout("Next Steps", \`
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Authenticate into the portal using the secure credentials provided above.</li>
            <li>Review and digitally execute your Offer Letter within the secure environment.</li>
            <li>Complete your profile to unlock your official onboarding schedule and operational clearance.</li>
          </ul>
        \`, 'info')}

        \${btn("Initialize Secure Portal Access", portalUrl)}
        
        \${paragraph(\`If you require any assistance before your official deployment date, do not hesitate to contact our HR department immediately.\`)}
        \${paragraph(\`Once again, welcome to CyberLabSec. Let's reshape the future of security together!<br/><br/>Warmly,<br/><strong>The CyberLabSec Executive Leadership Team</strong>\`)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
    attachments: offerLetterPdfBase64 ? [{ filename: "CyberLabSec_Official_Offer.pdf", content: Buffer.from(offerLetterPdfBase64, "base64"), contentType: "application/pdf" }] : [],
  });
}

export async function sendTerminationLetter(toEmail: string, employeeName: string, terminationLetterPdfBase64: string) {
  const firstName = employeeName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Confidential: Employment Status Notification | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Official Notice")}
      \${BODY_START}
        \${heading1(\`Employment Status Notification\`)}
        \${paragraph(\`Dear \${firstName},\`)}
        \${paragraph(\`This transmission serves as official and final notice regarding your employment status at CyberLabSec. Please find your detailed Employment Status Notification letter securely attached for your permanent records.\`)}
        \${callout("Access Revocation Notice", \`As a mandatory protocol of this transition, your authorization to access all internal CyberLabSec systems, platforms, and operational data has been completely revoked, effective immediately.\`, 'danger')}
        \${paragraph(\`If you have any questions regarding your final settlement, benefits, or the transition protocol, please reply directly to this email to coordinate with our HR department.\`)}
        \${paragraph(\`We wish you well in your future endeavors.<br/><br/>Sincerely,<br/><strong>CyberLabSec Human Resources</strong>\`)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
    attachments: [{ filename: "CyberLabSec_Employment_Status.pdf", content: Buffer.from(terminationLetterPdfBase64, "base64"), contentType: "application/pdf" }],
  });
}

export async function sendAnnouncement(toEmails: string[], subject: string, message: string, senderName: string) {
  await transporter.sendMail({
    from: FROM, to: toEmails.join(","), subject: \`[CyberLabSec] \${subject}\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Internal Communication")}
      \${BODY_START}
        \${heading1(subject)}
        \${callout("", \`<div style="white-space: pre-wrap;">\${message}</div>\`, 'info')}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
  await transporter.sendMail({
    from: FROM, to, subject,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Secure Transmission")}
      \${BODY_START}\${html}\${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
    attachments,
  });
}

export async function sendCombinedShortlistEmail(toEmail: string, applicantName: string, jobTitle: string, referenceId: string, interviewLink: string, expiryHours: number = 48) {
  const firstName = applicantName;
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: \`Application Shortlisted — Elite Technical Interview for \${jobTitle} | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Technical Assessment Invitation")}
      \${BODY_START}
        \${heading1(\`Amazing news, \${firstName}!\`)}
        \${paragraph(\`Your profile has been rigorously reviewed by our senior engineers, and you have been officially <strong>shortlisted</strong> for the technical assessment for the <strong>\${jobTitle}</strong> role.\`)}
        \${paragraph(\`This is your moment to prove your expertise. Our assessments are designed to push you to your absolute limits and identify top-tier talent.\`)}
        \${callout("Assessment Details", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Role", \`<strong>\${jobTitle}</strong>\`)}
            \${infoRow("Link Expires", \`<strong>In exactly \${expiryHours} hours</strong>\`)}
          </table>
        \`, 'info')}
        \${btn("Initiate Technical Assessment", interviewLink)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendApplicationReceivedEmail(toEmail: string, applicantName: string, jobTitle: string, referenceId: string, trackingUrl: string) {
  const firstName = applicantName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Application Confirmed: \${jobTitle} | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Application Confirmation")}
      \${BODY_START}
        \${heading1(\`We've Received Your Application, \${firstName}! 🚀\`)}
        \${paragraph(\`Thank you for applying to the <strong>\${jobTitle}</strong> position at CyberLabSec. We know that applying for elite roles takes immense dedication, and we sincerely appreciate your drive to join our mission in dominating offensive security.\`)}
        \${paragraph(\`Our highly specialized recruitment task force is currently conducting a deep review of your profile, resume, and credentials. We are relentlessly searching for passionate individuals who shatter the boundaries of cybersecurity, and we are excited to evaluate what you bring to the table.\`)}
        \${pipeline('Reviewing')}
        \${callout("Application Summary", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Role", \`<strong>\${jobTitle}</strong>\`)}
            \${infoRow("Reference ID", \`<code class="code-box">\${referenceId}</code>\`)}
            \${infoRow("Status", \`<strong>Awaiting Executive Review</strong>\`)}
          </table>
        \`, 'info')}
        \${paragraph(\`You will receive an encrypted notification via email as soon as there is a status update on your candidacy. In the meantime, you can track your application live through our secure applicant portal.\`)}
        \${btn("Track Application Status", "https://cyberlabsec.tech/careers")}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendStatusUpdateEmail(toEmail: string, applicantName: string, jobTitle: string, status: string, trackingUrl: string) {
  const firstName = applicantName;
  let pipelineStage: 'Reviewing' | 'Interview' | 'Decision' = 'Decision';
  if (status === 'Reviewing') pipelineStage = 'Reviewing';
  else if (status.includes('Interview')) pipelineStage = 'Interview';

  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Status Notification: \${jobTitle} | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Candidacy Update" )}
      \${BODY_START}
        \${heading1(\`Update on your Application, \${firstName}\`)}
        \${paragraph(\`There has been a critical update regarding your application for the <strong>\${jobTitle}</strong> position.\`)}
        \${pipeline(pipelineStage)}
        \${callout("Current Status", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Position", \`<strong>\${jobTitle}</strong>\`)}
            \${infoRow("Status", \`<strong>\${status}</strong>\`)}
          </table>
        \`, ['rejected', 'failed', 'interview failed'].includes(status.toLowerCase()) ? 'danger' : 'success')}
        \${btn("Track Application Status", "https://cyberlabsec.tech/careers")}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendInterviewCompleteEmail(toEmail: string, applicantName: string, jobTitle: string, status: string) {
  const firstName = applicantName;
  const isPass = status === "Selected – Waiting for Approval";
  const isCheat = status === "Cheating" || status === "Rejected";
  
  const headline = isPass ? \`Outstanding Performance, \${firstName}!\` : (isCheat ? \`Interview Terminated\` : \`Interview Results Finalized\`);
  const subtitle = isPass ? "Technical Interview Passed" : (isCheat ? "Security Violation" : "Technical Interview Failed");
  const stage = isPass ? 'Decision' : 'Interview';
  const calloutType = isPass ? 'success' : 'danger';
  
  const messageBody = isPass
    ? paragraph(\`Congratulations! You have successfully dominated the technical assessment for the <strong>\${jobTitle}</strong> role. Your unparalleled performance has advanced your application to the final executive decision stage. Our leadership team will review your complete profile and be in touch with a final decision imminently.\`)
    : (isCheat
        ? paragraph(\`Critical Alert: Irregular activity was detected by our AI-proctoring systems during your technical assessment for the <strong>\${jobTitle}</strong> role. Due to a zero-tolerance policy on integrity violations, your interview has been permanently terminated and your application has been blacklisted from moving forward.\`)
        : paragraph(\`Thank you for completing the grueling technical assessment for the <strong>\${jobTitle}</strong> role. Unfortunately, after exhausting all available attempts, your score did not meet the exceptional passing criteria demanded for this specific elite position.\`));

  await transporter.sendMail({
    from: FROM, to: toEmail, subject: isPass ? \`Action Required: Final Review for \${jobTitle} | CyberLabSec\` : \`Technical Assessment Results: \${jobTitle} | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection(subtitle)}
      \${BODY_START}
        \${pipeline(stage)}
        \${heading1(headline)}
        \${messageBody}
        \${callout("Final Decision", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Position", \`<strong>\${jobTitle}</strong>\`)}
            \${infoRow("Status", \`<strong>\${status}</strong>\`)}
          </table>
        \`, calloutType)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendInterviewRetryEmail(toEmail: string, applicantName: string, jobTitle: string, score: number, attemptsLeft: number) {
  const firstName = applicantName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Interview Attempt Failed — Retry Available | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Assessment Retry")}
      \${BODY_START}
        \${pipeline('Interview')}
        \${heading1(\`Keep Going, \${firstName}\`)}
        \${paragraph(\`You did not pass the technical assessment on this attempt for the <strong>\${jobTitle}</strong> role. At CyberLabSec, we demand perfection, but we also encourage immense resilience. You still have remaining attempts to prove your worth.\`)}
        \${callout("Attempt Summary", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Position", \`<strong>\${jobTitle}</strong>\`)}
            \${infoRow("Previous Score", \`<strong>\${score}%</strong>\`)}
            \${infoRow("Attempts Left", \`<strong>\${attemptsLeft}</strong>\`)}
          </table>
        \`, 'danger')}
        \${paragraph(\`Log in immediately with your Reference ID to retry the assessment. A brand new, highly complex set of questions will be dynamically generated for your next attempt.\`)}
        \${btn("Initiate Retry Sequence", "https://cyberlabsec.tech/careers")}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendMeetingInvite(toEmail: string, participantName: string, meetingTitle: string, meetingTime: string, meetingLink: string) {
  const firstName = participantName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Meeting Scheduled: \${meetingTitle} | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Secure Meeting Details")}
      \${BODY_START}
        \${heading1(\`Hello \${firstName},\`)}
        \${callout("Meeting Details", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Topic", \`<strong>\${meetingTitle}</strong>\`)}
            \${infoRow("Schedule", \`<strong>\${meetingTime}</strong>\`)}
          </table>
        \`, 'info')}
        \${btn("Join Secure Meeting", meetingLink)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendTaskAssigned(toEmail: string, assigneeName: string, taskTitle: string, priority: string, taskUrl: string) {
  const firstName = assigneeName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`New Mission Assigned: \${taskTitle} | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Mission Deployment")}
      \${BODY_START}
        \${heading1(\`Mission Assigned: \${firstName}\`)}
        \${paragraph(\`You have been deployed a new operational task requiring your immediate attention and expertise. Review the intelligence briefing provided in your secure workspace.\`)}
        \${callout("Mission Details", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Objective", \`<strong>\${taskTitle}</strong>\`)}
            \${infoRow("Priority", \`<strong>\${priority.toUpperCase()}</strong>\`)}
          </table>
        \`, priority.toLowerCase() === 'high' || priority.toLowerCase() === 'critical' ? 'danger' : 'info')}
        \${btn("Access Mission Briefing", taskUrl)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendVerificationEmail(toEmail: string, userName: string, verificationCode: string, verificationUrl: string) {
  const firstName = userName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Action Required: Verify Your CyberLabSec Identity\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Security Clearance")}
      \${BODY_START}
        \${heading1(\`Identity Verification Required\`)}
        \${paragraph(\`Hello \${firstName}, a secure request to authenticate your identity was recently initiated on our servers.\`)}
        \${callout("Verification Code", \`<div style="text-align: center;"><code class="code-box" style="font-size: 28px; padding: 12px 24px;">\${verificationCode}</code></div>\`, 'info')}
        \${btn("Verify Identity Now", verificationUrl)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendApplicantOTPEmail(toEmail: string, verificationCode: string) {
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Secure Authentication Code | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Security Clearance")}
      \${BODY_START}
        \${heading1(\`Verification Code\`)}
        \${paragraph(\`Please use the highly secure, one-time passcode below to verify your email address and proceed with your application.\`)}
        \${callout("Verification Code", \`<div style="text-align: center;"><code class="code-box" style="font-size: 28px; padding: 12px 24px;">\${verificationCode}</code></div>\`, 'info')}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendOfferLetter(toEmail: string, applicantName: string, jobTitle: string, offerUrl: string, expiresInDays: number) {
  const firstName = applicantName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Official Job Offer: \${jobTitle} | CyberLabSec\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Official Documentation")}
      \${BODY_START}
        \${heading1(\`Congratulations, \${firstName}!\`)}
        \${paragraph(\`After an incredibly rigorous selection process and a brutal technical evaluation, we are exceptionally proud to formally extend an offer for the <strong>\${jobTitle}</strong> position at CyberLabSec.\`)}
        \${paragraph(\`Your demonstrated aptitude in offensive security, flawless problem-solving, and sheer technical acumen made an undeniable impression on our executive team. We firmly believe your expertise will be a formidable, world-class asset to our operations.\`)}
        
        \${callout("Offer Details", \`
          <table style="width: 100%; border-collapse: collapse;">
            \${infoRow("Position", \`<strong>\${jobTitle}</strong>\`)}
            \${infoRow("Organization", \`<strong>CyberLabSec Elite Task Force</strong>\`)}
            \${infoRow("Action Required", \`Please deeply review and digitally sign the attached official offer.\`)}
          </table>
        \`, 'success')}
        
        \${btn("View & Execute Official Offer", offerUrl)}
        
        \${callout("Time Sensitive Alert", \`
          Please be highly advised that this offer is exclusively valid for exactly <strong>\${expiresInDays} days</strong> from the precise date of this transmission. Should you require any clarification regarding the terms, do not hesitate to reach out to leadership.
        \`, 'danger')}
        
        \${paragraph(\`We look forward to welcoming you to the elite team.\`)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}

export async function sendHiredEmail(toEmail: string, applicantName: string, jobTitle: string) {
  const firstName = applicantName;
  await transporter.sendMail({
    from: FROM, to: toEmail, subject: \`Welcome to CyberLabSec! You're Hired — \${jobTitle}\`,
    html: \`
      \${HTML_START}
      \${WRAP_START}
      \${headerSection("Welcome to the Team")}
      \${BODY_START}
        \${pipeline('Decision')}
        \${heading1(\`Congratulations, \${firstName}! 🎉\`)}
        \${paragraph(\`We are profoundly thrilled to officially welcome you to the CyberLabSec team as our newest <strong>\${jobTitle}</strong>.\`)}
        \${paragraph(\`Your performance throughout the gauntlet of our interviews and technical assessments was nothing short of spectacular. We are incredibly excited about the unmatched value, extreme dedication, and elite expertise you will bring to our operations.\`)}
        
        \${callout("What's Next?", \`
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Our executive HR team will reach out imminently with your official onboarding documents.</li>
            <li>You will securely receive your company credentials and high-end equipment details.</li>
            <li>We will schedule a strategic kickoff meeting to introduce you to the core team.</li>
          </ul>
        \`, 'success')}
        
        \${paragraph(\`Once again, welcome aboard. Prepare to achieve greatness and dominate the security space with us.\`)}
      \${BODY_END}
      \${footerSection()}
      \${WRAP_END}
      \${HTML_END}
    \`,
  });
}
