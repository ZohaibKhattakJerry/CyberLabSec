import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Seeding CyberLabSec database...");

  // Create admin employee
  const adminHash = await bcrypt.hash("ZohaibSadiq", 12);
  await prisma.employee.upsert({
    where: { employeeCode: "CyberLabSec" },
    update: {
      passwordHash: adminHash,
    },
    create: {
      employeeCode: "CyberLabSec",
      name: "Zohaib Khattak",
      email: "zohaib@cyberlabsec.tech",
      designation: "CEO & Founder",
      employmentType: "Employee",
      startDate: new Date("2024-01-01"),
      status: "Active",
      passwordHash: adminHash,
      mustResetPassword: false,
      policyAcknowledgedAt: new Date(),
    },
  });

  // Create a default company policy
  await prisma.policyDocument.upsert({
    where: { id: "default-policy" },
    update: {},
    create: {
      id: "default-policy",
      title: "CyberLabSec Employee Code of Conduct & Confidentiality Policy",
      body: `# CyberLabSec — Code of Conduct & Confidentiality

## 1. Confidentiality
All work performed at CyberLab, including client names, vulnerabilities discovered, penetration test results, methodologies, and internal communications, is strictly confidential. You must never share this information with anyone outside the company.

**Violation consequences:** Immediate termination and potential legal action.

## 2. Data Handling
- Never store client data on personal devices
- Use company-approved tools and communication channels only
- All reports must be submitted through the employee portal

## 3. Professional Conduct
- Treat all colleagues, clients, and partners with respect
- Report any conflicts of interest to the CEO immediately
- Never perform offensive security work outside of authorized engagements

## 4. Repeated Missed Deadlines
Missing task deadlines more than twice in a 30-day period without prior written communication may result in formal warning or termination.

## 5. Non-Disclosure
This policy extends beyond your employment period. Confidential information must not be disclosed even after leaving CyberLab.

By acknowledging this policy, you agree to abide by all terms outlined above.`,
      version: 1,
    },
  });

  // Sample job posting
  await prisma.jobPosting.upsert({
    where: { id: "sample-pentest-job" },
    update: {},
    create: {
      id: "sample-pentest-job",
      title: "Junior Penetration Tester",
      type: "Job",
      department: "Offensive Security",
      location: "Remote / Karachi",
      description: "Join our red team as a Junior Penetration Tester. You will conduct web application and network penetration tests, write professional vulnerability reports, and collaborate with senior team members on complex engagements.\n\nThis is a hands-on role — you will be doing real pentests from day one.",
      requirements: "- 1+ year of CTF or bug bounty experience\n- Working knowledge of Burp Suite, Nmap, Metasploit\n- Understanding of OWASP Top 10\n- Ability to write clear technical reports\n- CEH, OSCP, or equivalent is a plus\n- Strong communication skills in English",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "Open",
      shortlistThreshold: 50,
      passMark: 60,
    },
  });

  // Sample internship posting
  await prisma.jobPosting.upsert({
    where: { id: "sample-intern" },
    update: {},
    create: {
      id: "sample-intern",
      title: "Security Research Intern",
      type: "Internship",
      department: "Vulnerability Research",
      location: "Remote",
      description: "A 3-month internship program where you will learn professional penetration testing techniques, participate in bug bounty programs, and produce your first real security reports under senior guidance.\n\nPerfect for CS/IT students who want real-world offensive security experience.",
      requirements: "- Currently enrolled in CS, IT, or Cybersecurity program\n- Basic understanding of networking (TCP/IP, HTTP)\n- Familiarity with Linux command line\n- Eagerness to learn — we will teach the rest\n- Minimum semester 4",
      universityRequired: true,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: "Open",
      shortlistThreshold: 40,
      passMark: 50,
    },
  });

  // Admin config
  await prisma.adminConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      data: JSON.stringify({ defaultShortlistThreshold: 50, defaultPassMark: 60 }),
    },
  });

  console.log("✅ Seed complete!");
  console.log("\nAdmin credentials:");
  console.log("  Employee Code: CyberLabSec");
  console.log("  Password: ZohaibSadiq");
  console.log("\n⚠️  CHANGE THE ADMIN PASSWORD IMMEDIATELY after first login!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
