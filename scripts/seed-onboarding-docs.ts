import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Seeding OnboardingDocument records...");

  const docs = [
    {
      title: "Employment Contract",
      subtitle: "Formal Employment Agreement",
      bodyText: `This Employment Contract ("Agreement") is entered into as of the date of onboarding, by and between CyberLab Security ("Company") and the Employee named herein ("Employee").

1. POSITION & DUTIES
The Employee is engaged in the position specified in their offer letter. The Employee shall perform all duties as assigned by their reporting authority with diligence, professionalism, and the highest standard of conduct.

2. COMPENSATION & BENEFITS
Compensation, benefits, and any applicable equity or stipend arrangements are governed exclusively by the terms specified in the Official Offer Letter issued prior to this Agreement. Any amendments must be made in writing and signed by both parties.

3. TERM
This Agreement commences on the Employee's official start date and continues until terminated by either party in accordance with the notice period specified in the Offer Letter.

4. CONFIDENTIALITY
The Employee agrees to maintain strict confidentiality of all proprietary information, client data, internal communications, and operational methodologies during and after the term of employment.

5. INTELLECTUAL PROPERTY
All work product, code, reports, tools, and discoveries created by the Employee in the course of employment are the sole intellectual property of CyberLab Security.

6. CODE OF CONDUCT
The Employee agrees to abide by CyberLab Security's Code of Conduct, Acceptable Use Policy, and all applicable security policies as amended from time to time.

7. TERMINATION
Either party may terminate this Agreement with the notice period specified in the Offer Letter. The Company reserves the right to terminate immediately for cause, including but not limited to gross misconduct, breach of confidentiality, or violation of security policies.

8. GOVERNING LAW
This Agreement shall be governed by the laws applicable in the jurisdiction of CyberLab Security's principal place of business.`,
      appliesToRoles: JSON.stringify(["Employee", "Contract"]),
    },
    {
      title: "Internship Agreement",
      subtitle: "Official Internship Engagement Agreement",
      bodyText: `This Internship Agreement ("Agreement") is entered into as of the date of onboarding, by and between CyberLab Security ("Company") and the Intern named herein ("Intern").

1. INTERNSHIP POSITION & OBJECTIVES
The Intern is engaged in the position specified in their offer letter. The primary objective of this internship is to provide practical, hands-on experience in cybersecurity operations under the guidance of CyberLab Security's technical team.

2. DURATION
The internship shall commence on the date specified in the Offer Letter and continue for the duration specified therein, unless terminated earlier by either party.

3. STIPEND & BENEFITS
Any stipend or benefits applicable to this internship are specified in the Official Offer Letter issued prior to this Agreement.

4. LEARNING OBJECTIVES
The Company agrees to provide the Intern with meaningful work assignments, mentorship, and exposure to real-world cybersecurity challenges. The Intern agrees to participate actively, complete assigned tasks diligently, and maintain a professional attitude.

5. CONFIDENTIALITY
The Intern acknowledges that they may have access to confidential information and agrees to maintain strict confidentiality during and after the internship period.

6. INTELLECTUAL PROPERTY
All work produced by the Intern during the course of this internship is the intellectual property of CyberLab Security.

7. CONDUCT & COMPLIANCE
The Intern agrees to comply with all CyberLab Security policies, including but not limited to the Code of Conduct, Acceptable Use Policy, and all cybersecurity protocols.

8. TERMINATION
Either party may terminate this Agreement with reasonable notice. The Company reserves the right to terminate immediately for cause.`,
      appliesToRoles: JSON.stringify(["Intern"]),
    },
    {
      title: "NDA",
      subtitle: "Non-Disclosure Agreement",
      bodyText: `This Non-Disclosure Agreement ("Agreement") is entered into as of the date of onboarding, by and between CyberLab Security ("Company") and the signatory herein ("Recipient").

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" includes all non-public information disclosed by the Company to the Recipient, whether in oral, written, electronic, or any other form, including but not limited to: client identities, security vulnerabilities, penetration test reports, internal tooling, source code, business strategies, employee data, financial information, and any other information designated as confidential.

2. OBLIGATIONS OF CONFIDENTIALITY
The Recipient agrees to:
(a) Hold all Confidential Information in strict confidence.
(b) Not disclose any Confidential Information to any third party without prior written consent from the Company.
(c) Use Confidential Information solely for the purpose of fulfilling their role at CyberLab Security.
(d) Take all reasonable precautions to prevent unauthorized disclosure.

3. EXCLUSIONS
This Agreement does not apply to information that: (a) is or becomes publicly available through no fault of the Recipient; (b) was independently developed by the Recipient; (c) is required to be disclosed by law, provided the Company is given prior notice.

4. NON-COMPETE & NON-SOLICITATION
During the term of this Agreement and for a period of 12 months after its termination, the Recipient shall not:
(a) Directly or indirectly work for or establish a competing cybersecurity organization.
(b) Solicit any client, partner, or employee of CyberLab Security.

5. DATA SECURITY
The Recipient agrees to report any actual or suspected breach of Confidential Information immediately to the Company's security team.

6. REMEDIES
The Recipient acknowledges that a breach of this Agreement would cause irreparable harm for which monetary damages would be inadequate. The Company shall be entitled to seek equitable relief, including injunctions, in addition to any other legal remedies available.

7. TERM
This Agreement remains in effect indefinitely with respect to Confidential Information received during the Recipient's tenure at CyberLab Security.`,
      appliesToRoles: JSON.stringify(["Employee", "Intern", "Contract"]),
    },
    {
      title: "Code of Conduct",
      subtitle: "Company Code of Conduct Policy",
      bodyText: `This Code of Conduct ("Policy") governs the professional behavior and ethical standards expected of all personnel at CyberLab Security ("Company").

1. PROFESSIONAL CONDUCT
All personnel are expected to conduct themselves with the utmost professionalism, integrity, and respect in all interactions — whether with colleagues, clients, partners, or the public. Harassment, discrimination, or bullying of any kind will not be tolerated.

2. INFORMATION SECURITY COMPLIANCE
Given the sensitive nature of CyberLab Security's work, all personnel must:
(a) Strictly adhere to all security protocols and operational procedures.
(b) Never access systems, networks, or data beyond the scope of their assigned tasks.
(c) Immediately report any security incidents, suspicious activity, or policy violations.
(d) Never use company credentials, tools, or access for personal gain or unauthorized purposes.

3. RESPONSIBLE DISCLOSURE
Personnel engaged in security research or penetration testing must operate strictly within the defined scope of engagements. Any vulnerabilities discovered must be reported exclusively through official channels and must never be exploited for personal benefit.

4. INTELLECTUAL PROPERTY & ATTRIBUTION
Personnel shall not share, distribute, or claim ownership of work product, tools, or methodologies developed during their tenure at CyberLab Security.

5. SOCIAL MEDIA & PUBLIC COMMUNICATION
Personnel must not publicly discuss, post, or disclose any information about clients, ongoing engagements, internal operations, or security findings without explicit written approval from management.

6. CONFLICTS OF INTEREST
Personnel must disclose any potential conflicts of interest to management immediately. Accepting gifts, commissions, or secondary employment that conflicts with the Company's interests is prohibited.

7. ZERO TOLERANCE POLICY
The following will result in immediate termination and potential legal action:
- Unauthorized disclosure of Confidential Information
- Unauthorized access to systems outside assigned scope
- Any form of fraud, theft, or misconduct
- Violation of client data privacy

8. REPORTING VIOLATIONS
Personnel are encouraged to report any suspected violations of this Code of Conduct to hr@cyberlabsec.tech. All reports will be treated with confidentiality.

By signing this document, the signatory acknowledges that they have read, understood, and agree to comply with this Code of Conduct in its entirety.`,
      appliesToRoles: JSON.stringify(["Employee", "Intern", "Contract"]),
    },
  ];

  for (const doc of docs) {
    const existing = await prisma.onboardingDocument.findFirst({
      where: { title: doc.title },
    });

    if (existing) {
      await prisma.onboardingDocument.update({
        where: { id: existing.id },
        data: {
          subtitle: doc.subtitle,
          bodyText: doc.bodyText,
          appliesToRoles: doc.appliesToRoles,
          version: existing.version + 1,
        },
      });
      console.log(`✅ Updated: ${doc.title}`);
    } else {
      await prisma.onboardingDocument.create({ data: doc });
      console.log(`✨ Created: ${doc.title}`);
    }
  }

  console.log("\n✅ Done! OnboardingDocument records seeded successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
