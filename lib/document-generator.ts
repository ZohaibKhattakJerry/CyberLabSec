import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { put } from '@vercel/blob';

export async function generateAndUploadDocument(
  title: string,
  employeeName: string,
  designation: string,
  date: string,
  employeeCode: string,
  contentLines: string[]
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Header
  page.drawText('CyberLabSec', { x: 50, y: height - 50, size: 24, font: boldFont, color: rgb(0.5, 0.1, 0.8) });
  page.drawText(title, { x: 50, y: height - 80, size: 18, font: boldFont });
  
  // Details
  page.drawText(`Date: ${date}`, { x: 50, y: height - 120, size: 12, font });
  page.drawText(`Employee Name: ${employeeName}`, { x: 50, y: height - 140, size: 12, font });
  page.drawText(`Designation: ${designation}`, { x: 50, y: height - 160, size: 12, font });
  page.drawText(`Employee Code: ${employeeCode}`, { x: 50, y: height - 180, size: 12, font });
  
  let y = height - 220;
  for (const line of contentLines) {
    if (y < 50) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
    }
    page.drawText(line, { x: 50, y, size: 11, font, maxWidth: width - 100 });
    // Rough estimate of line height based on wrapping
    const textHeight = font.heightAtSize(11);
    const linesCount = Math.ceil(font.widthOfTextAtSize(line, 11) / (width - 100));
    y -= (textHeight * linesCount) + 15;
  }
  
  // Footer signature
  if (y < 100) {
    page = pdfDoc.addPage([595.28, 841.89]);
    y = height - 100;
  }
  page.drawText('_______________________', { x: 50, y: y - 40, size: 12, font });
  page.drawText('Employee Signature', { x: 50, y: y - 60, size: 12, font });
  
  page.drawText('_______________________', { x: 300, y: y - 40, size: 12, font });
  page.drawText('Authorized Signatory', { x: 300, y: y - 60, size: 12, font });
  
  const pdfBytes = await pdfDoc.save();
  const buffer = Buffer.from(pdfBytes);
  
  const safeTitle = title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  
  const blob = await put(`${safeTitle}-${employeeCode}.pdf`, buffer, {
    access: "private",
    contentType: "application/pdf"
  });
  
  return `/api/blob?url=${encodeURIComponent(blob.url)}`;
}

export function getNDATemplate(companyName: string, role: string) {
  return [
    `NON-DISCLOSURE AGREEMENT (NDA)`,
    `This Agreement is entered into by and between CyberLabSec ("Company") and the Employee.`,
    ``,
    `1. CONFIDENTIAL INFORMATION`,
    `The Employee acknowledges that during the course of employment as ${role}, they may have access to confidential information, including but not limited to source code, security protocols, client data, and proprietary algorithms.`,
    ``,
    `2. OBLIGATIONS OF THE EMPLOYEE`,
    `The Employee agrees to hold all Confidential Information in strict confidence. The Employee shall not disclose, publish, or otherwise reveal any Confidential Information to any third party without the express written consent of the Company.`,
    ``,
    `3. RETURN OF MATERIALS`,
    `Upon termination of employment, the Employee shall return all documents, devices, and materials containing Confidential Information to the Company.`,
    ``,
    `4. GOVERNING LAW`,
    `This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the Company operates.`,
  ];
}

export function getCodeOfConductTemplate() {
  return [
    `CODE OF CONDUCT`,
    `CyberLabSec expects all employees to uphold the highest standards of professional and ethical conduct.`,
    ``,
    `1. PROFESSIONALISM`,
    `Employees must treat all colleagues, clients, and partners with respect and dignity. Harassment, discrimination, and bullying of any kind will not be tolerated.`,
    ``,
    `2. CYBERSECURITY PRACTICES`,
    `As a cybersecurity firm, employees must adhere strictly to internal security policies. Do not share credentials, leave workstations unlocked, or bypass security controls.`,
    ``,
    `3. CONFLICT OF INTEREST`,
    `Employees must avoid situations where personal interests conflict with the interests of the Company. Any potential conflict must be reported to management immediately.`,
    ``,
    `4. COMPLIANCE`,
    `Failure to comply with this Code of Conduct may result in disciplinary action, up to and including termination of employment.`,
  ];
}

export function getInternshipAgreementTemplate(role: string) {
  return [
    `INTERNSHIP AGREEMENT`,
    `This Internship Agreement outlines the terms and conditions of your internship at CyberLabSec.`,
    ``,
    `1. POSITION AND DUTIES`,
    `You are engaged as a ${role}. Your duties will include tasks assigned by your team lead and active participation in our training and operational activities.`,
    ``,
    `2. COMPENSATION AND BENEFITS`,
    `This is a role subject to the terms discussed during your offer. Benefits and stipends are provided in accordance with company policy.`,
    ``,
    `3. AT-WILL EMPLOYMENT`,
    `This internship is at-will, meaning either you or the Company may terminate the relationship at any time, with or without cause or notice.`,
    ``,
    `4. INTELLECTUAL PROPERTY`,
    `Any work, code, or materials created during your internship remain the exclusive property of CyberLabSec.`,
  ];
}

export function getEmploymentContractTemplate(role: string) {
  return [
    `EMPLOYMENT CONTRACT / APPOINTMENT LETTER`,
    `This Employment Contract outlines the terms and conditions of your employment at CyberLabSec.`,
    ``,
    `1. POSITION AND DUTIES`,
    `You are engaged as a ${role}. You agree to perform all duties assigned to you by the Company faithfully and to the best of your abilities.`,
    ``,
    `2. COMPENSATION AND BENEFITS`,
    `Your compensation, bonuses, and benefits are detailed in your offer letter and are subject to Company policies and applicable laws.`,
    ``,
    `3. TERMINATION`,
    `Employment may be terminated by either party with appropriate notice as outlined in the Employee Handbook.`,
    ``,
    `4. INTELLECTUAL PROPERTY`,
    `Any intellectual property created during the course of your employment shall be the sole property of CyberLabSec.`,
  ];
}

export function getFixedTermAgreementTemplate(role: string) {
  return [
    `FIXED-TERM AGREEMENT`,
    `This Agreement governs your fixed-term engagement with CyberLabSec.`,
    ``,
    `1. ENGAGEMENT AND DUTIES`,
    `You are engaged as a ${role} for a specified term. You agree to complete all deliverables and duties assigned to you.`,
    ``,
    `2. TERM OF AGREEMENT`,
    `This engagement is for a fixed duration. It will automatically terminate at the end of the specified term unless extended in writing.`,
    ``,
    `3. COMPENSATION`,
    `Compensation for this fixed-term engagement is as agreed upon in your offer and will be paid according to the Company's standard schedule.`,
    ``,
    `4. CONFIDENTIALITY AND OWNERSHIP`,
    `You agree to maintain confidentiality regarding Company matters and acknowledge that all work products belong to CyberLabSec.`,
  ];
}

export function getHandbookAcknowledgmentTemplate() {
  return [
    `EMPLOYEE HANDBOOK ACKNOWLEDGMENT`,
    `By signing below, I acknowledge that I have received, read, and understand the CyberLabSec Employee Handbook.`,
    ``,
    `1. COMPLIANCE WITH POLICIES`,
    `I agree to comply with all policies, rules, and procedures set forth in the Employee Handbook, as well as any future updates or modifications.`,
    ``,
    `2. AT-WILL EMPLOYMENT`,
    `I understand that the Employee Handbook does not create an employment contract, and my employment remains at-will where applicable by law.`,
    ``,
    `3. REPORTING VIOLATIONS`,
    `I understand my obligation to report any violations of Company policies to HR or management promptly.`,
  ];
}
