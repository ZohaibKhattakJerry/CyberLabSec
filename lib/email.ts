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

// Global CSS styles to ensure brand consistency across all emails
const BASE_STYLE = `font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; color: #09090b; padding: 40px 20px; text-align: center;`;
const CONTAINER_STYLE = `max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; padding: 40px; text-align: left; box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.05);`;
const HEADER_STYLE = `color: #09090b; font-size: 26px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.02em;`;
const SUBHEADER_STYLE = `color: #9333ea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 32px 0;`;
const TEXT_STYLE = `color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;`;
const CARD_STYLE = `background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 24px; margin: 32px 0;`;
const BUTTON_STYLE = `display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 4px 14px 0 rgba(147, 51, 234, 0.25); margin: 8px 0 32px 0;`;
const FOOTER_STYLE = `color: #71717a; font-size: 13px; line-height: 1.5; margin: 32px 0 0 0; text-align: center; border-top: 1px solid #e4e4e7; padding-top: 32px;`;

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
          
          <p style="${TEXT_STYLE}">Hi <strong style="color: #09090b;">${applicantName}</strong>,</p>
          <p style="${TEXT_STYLE}">
            Congratulations! Your application for the <strong style="color: #a855f7;">${jobTitle}</strong> position has been shortlisted. 
            We would like to invite you to complete our AI-powered technical assessment.
          </p>
          
          <div style="${CARD_STYLE}">
            <p style="color: #c084fc; margin: 0 0 8px 0; font-size: 14px; font-weight: 700; text-transform: uppercase;">⏰ Important Instructions</p>
            <p style="color: #52525b; margin: 0; font-size: 14px; line-height: 1.6;">
              This unique interview link will expire in <strong>${expiryHours} hours</strong>. 
              The assessment is proctored by our AI and cannot be paused once started. Please ensure you have a stable internet connection.
              <br/><br/>
              <strong style="color: #09090b;">Note:</strong> You have a maximum of <strong>3 attempts</strong> to pass this technical screening. Any irregular activity or use of unauthorized tools will immediately consume an attempt and flag your application.
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${interviewLink}" style="${BUTTON_STYLE}">Start Assessment →</a>
          </div>
          
          <p style="${FOOTER_STYLE}">
            If you did not apply for this position, please disregard this email.<br/>
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
          
          <p style="${TEXT_STYLE}">Hi <strong style="color: #09090b;">${applicantName}</strong>,</p>
          <p style="${TEXT_STYLE}">Thank you for taking the time to apply for the <strong style="color: #a855f7;">${jobTitle}</strong> position.</p>
          <p style="${TEXT_STYLE}">After careful review of your application and assessment, we have decided to move forward with other candidates whose profiles more closely align with our current needs.</p>
          <p style="${TEXT_STYLE}">We were impressed by your background and encourage you to apply for future openings as our team continues to grow.</p>
          
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
          
          <p style="${TEXT_STYLE}">Hi <strong style="color: #09090b;">${employeeName}</strong>,</p>
          <p style="${TEXT_STYLE}">Congratulations! Your offer has been officially approved. We are thrilled to welcome you to the CyberLabSec team.</p>
          
          ${customMessage ? `
            <div style="background-color: #f8fafc; border-left: 4px solid #a855f7; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${customMessage}</p>
            </div>
          ` : ''}
          
          <p style="${TEXT_STYLE}">Below are your exclusive credentials to access the Employee Operations Portal:</p>
          
          <div style="${CARD_STYLE}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #52525b; font-size: 14px; width: 140px;">Employee ID:</td>
                <td style="padding: 8px 0;"><code style="background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; color: #c084fc; font-size: 16px;">${employeeCode}</code></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #52525b; font-size: 14px;">Temporary Pass:</td>
                <td style="padding: 8px 0;"><code style="background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 4px; color: #c084fc; font-size: 16px;">${temporaryPassword}</code></td>
              </tr>
            </table>
          </div>
          
          <p style="color: #52525b; font-size: 14px; margin-bottom: 24px; text-align: center;">
            <em>Note: You will be required to change this password immediately upon your first login.</em>
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
