import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports (587 uses STARTTLS)
  auth: {
    user: process.env.SMTP_USER || "mrzohaibkhattak@gmail.com",
    pass: process.env.SMTP_PASSWORD || "jccq fhij hxxb qlzj",
  },
});

const FROM = `CyberLabSec <contact@cyberlabsec.tech>`;

const BASE_STYLE = `font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; padding: 40px 20px; text-align: center; margin: 0;`;
const CONTAINER_STYLE = `max-width: 600px; margin: 0 auto; background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 48px; text-align: left; box-shadow: 0 10px 40px -10px rgba(168, 85, 247, 0.15);`;
const HEADER_STYLE = `color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em;`;
const SUBHEADER_STYLE = `color: #a855f7; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 32px 0;`;
const TEXT_STYLE = `color: #a1a1aa; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0;`;
const CARD_STYLE = `background-color: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 24px; margin: 32px 0;`;
const BUTTON_STYLE = `display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px; text-align: center; margin: 12px 0 32px 0; border: 1px solid rgba(255,255,255,0.1);`;
const FOOTER_STYLE = `color: #71717a; font-size: 12px; line-height: 1.6; margin: 40px 0 0 0; text-align: center; border-top: 1px solid #27272a; padding-top: 32px;`;

export async function sendInterviewInvite(
  toEmail: string,
  applicantName: string,
  jobTitle: string,
  interviewLink: string,
  expiryHours: number = 48
) {
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `🔐 CyberLabSec — Technical Interview Invitation`,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <h1 style="${HEADER_STYLE}">CyberLabSec</h1>
          <p style="${SUBHEADER_STYLE}">Offensive Security & Pentesting</p>
          
          <p style="${TEXT_STYLE}">Hi <strong style="color: #ffffff;">${applicantName}</strong>,</p>
          <p style="${TEXT_STYLE}">
            Congratulations! Your application for the <strong style="color: #a855f7;">${jobTitle}</strong> position has been shortlisted for the next stage. 
            We would like to invite you to complete our proprietary technical assessment.
          </p>
          
          <div style="${CARD_STYLE}">
            <p style="color: #c084fc; margin: 0 0 12px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">⏰ Critical Instructions</p>
            <p style="color: #a1a1aa; margin: 0; font-size: 14px; line-height: 1.6;">
              This unique, secure interview link will expire in <strong>${expiryHours} hours</strong>. 
              The assessment is heavily proctored by our AI engines and cannot be paused once started. Please ensure you have a stable and uninterrupted internet connection.
              <br/><br/>
              <strong style="color: #ffffff;">Note:</strong> You have a maximum of <strong>3 attempts</strong> to pass this technical screening. Any irregular activity (e.g., tab switching, rapid copy-pasting, unauthorized tools) will instantly terminate the session and flag your application.
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${interviewLink}" style="${BUTTON_STYLE}">Start Assessment →</a>
          </div>
          
          <p style="${FOOTER_STYLE}">
            If you did not apply for this position, please disregard this email.<br/><br/>
            Secure Link: <a href="${interviewLink}" style="color: #a855f7; text-decoration: none;">${interviewLink}</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendDeclineEmail(
  toEmail: string,
  applicantName: string,
  jobTitle: string
) {
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `CyberLabSec — Application Update: ${jobTitle}`,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <h1 style="${HEADER_STYLE}">CyberLabSec</h1>
          <p style="${SUBHEADER_STYLE}">Application Status</p>
          
          <p style="${TEXT_STYLE}">Hi <strong style="color: #ffffff;">${applicantName}</strong>,</p>
          <p style="${TEXT_STYLE}">Thank you for taking the time to apply for the <strong style="color: #a855f7;">${jobTitle}</strong> position at CyberLabSec.</p>
          <p style="${TEXT_STYLE}">After a thorough review of your application and technical assessment, we have decided to move forward with other candidates whose profiles more closely align with our highly specific current requirements.</p>
          <p style="${TEXT_STYLE}">We were deeply impressed by your background and strongly encourage you to re-apply for future openings as our operations continue to scale globally.</p>
          
          <p style="${FOOTER_STYLE}">The CyberLabSec Hiring Team</p>
        </div>
      </div>
    `,
  });
}

export async function sendEmployeeCredentials(
  toEmail: string,
  employeeName: string,
  employeeCode: string,
  temporaryPassword: string,
  portalUrl: string,
  offerLetterPdfBase64?: string,
  customMessage?: string
) {
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `🎉 Welcome to CyberLabSec — Your Portal Access`,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <h1 style="${HEADER_STYLE}">Welcome Aboard!</h1>
          <p style="${SUBHEADER_STYLE}">CyberLabSec Internal Systems</p>
          
          <p style="${TEXT_STYLE}">Hi <strong style="color: #ffffff;">${employeeName}</strong>,</p>
          <p style="${TEXT_STYLE}">Congratulations! Your offer has been officially approved by the executive board. We are thrilled to welcome you to the CyberLabSec team.</p>
          
          ${customMessage ? `
            <div style="background-color: #18181b; border-left: 4px solid #a855f7; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
               <p style="color: #e4e4e7; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${customMessage}</p>
            </div>
          ` : ''}
          
          <p style="${TEXT_STYLE}">Below are your highly secure, exclusive credentials to access the CyberLabSec Employee Operations Portal:</p>
          
          <div style="${CARD_STYLE}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; color: #a1a1aa; font-size: 14px; width: 140px; border-bottom: 1px solid #27272a;">Employee ID:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #27272a;"><code style="background: #27272a; padding: 6px 10px; border-radius: 4px; color: #c084fc; font-size: 16px; font-weight: 600; letter-spacing: 1px;">${employeeCode}</code></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #a1a1aa; font-size: 14px;">Temporary Pass:</td>
                <td style="padding: 10px 0;"><code style="background: #27272a; padding: 6px 10px; border-radius: 4px; color: #c084fc; font-size: 16px; font-weight: 600; letter-spacing: 1px;">${temporaryPassword}</code></td>
              </tr>
            </table>
          </div>
          
          <p style="color: #ef4444; font-size: 13px; margin-bottom: 32px; text-align: center; font-weight: 600;">
            ⚠️ SECURE YOUR ACCOUNT: You will be mandated to change this password immediately upon your first login.
          </p>
          
          <div style="text-align: center;">
            <a href="${portalUrl}" style="${BUTTON_STYLE}">Access Secure Portal →</a>
          </div>
          
          <p style="${FOOTER_STYLE}">
            ${offerLetterPdfBase64 ? 'Please find your official offer letter attached to this email.<br/><br/>' : ''}
            CyberLabSec IT & Operations
          </p>
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

export async function sendTerminationLetter(
  toEmail: string,
  employeeName: string,
  terminationLetterPdfBase64: string
) {
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `CyberLabSec — Employment Status Update`,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <h1 style="${HEADER_STYLE}">CyberLabSec</h1>
          <p style="${SUBHEADER_STYLE}">Employment Update</p>
          
          <p style="${TEXT_STYLE}">Hi <strong style="color: #09090b;">${employeeName}</strong>,</p>
          <p style="${TEXT_STYLE}">Please find your employment status update letter attached. Your internal portal access and operational privileges have been deactivated effective immediately.</p>
          <p style="${TEXT_STYLE}">If you have any questions regarding your final settlement or documentation, please contact the HR department directly.</p>
          
          <p style="${FOOTER_STYLE}">CyberLabSec HR Operations</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: "CyberLabSec_Employment_Update.pdf",
        content: Buffer.from(terminationLetterPdfBase64, "base64"),
        contentType: "application/pdf",
      },
    ],
  });
}

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
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <h1 style="${HEADER_STYLE}">Global Announcement</h1>
          <p style="${SUBHEADER_STYLE}">CyberLabSec Internal Communications</p>
          
          <div style="${CARD_STYLE}; border-left: 4px solid #a855f7;">
            <p style="color: #09090b; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">${subject}</p>
            <p style="color: #3f3f46; font-size: 15px; line-height: 1.7; white-space: pre-wrap; margin: 0;">${message}</p>
          </div>
          
          <p style="${TEXT_STYLE}; text-align: right; color: #52525b; font-style: italic;">
            — Sent by ${senderName}
          </p>
          
          <p style="${FOOTER_STYLE}">
            This is an automated internal broadcast. Do not reply directly to this email.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendEmail({ to, subject, html, attachments }: { to: string; subject: string; html: string; attachments?: any[] }) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          ${html}
        </div>
      </div>
    `,
    attachments,
  });
}

export async function sendApplicationReceivedEmail(
  toEmail: string,
  applicantName: string,
  jobTitle: string,
  referenceId: string,
  trackingUrl: string
) {
  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `CyberLabSec — Application Received (${referenceId})`,
    html: `
      <div style="${BASE_STYLE}">
        <div style="${CONTAINER_STYLE}">
          <h1 style="${HEADER_STYLE}">CyberLabSec</h1>
          <p style="${SUBHEADER_STYLE}">Application Received</p>
          
          <p style="${TEXT_STYLE}">Hi <strong style="color: #ffffff;">${applicantName}</strong>,</p>
          <p style="${TEXT_STYLE}">
            Thank you for applying for the <strong style="color: #a855f7;">${jobTitle}</strong> position. 
            We have successfully received your application (Ref: <strong>${referenceId}</strong>).
          </p>
          
          <p style="${TEXT_STYLE}">
            Our AI-powered screening engines are currently reviewing your profile and security credentials. 
            You can track the live status of your application at any time using your secure tracking link below.
          </p>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${trackingUrl}" style="${BUTTON_STYLE}">Track Application Status →</a>
          </div>
          
          <p style="${FOOTER_STYLE}">
            The CyberLabSec Recruitment Team<br/><br/>
            Secure Tracking URL: <a href="${trackingUrl}" style="color: #a855f7; text-decoration: none;">${trackingUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}
