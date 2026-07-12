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

  // Seed Default Questions
  const defaultQuestions = [
    { type: "open", category: "Web Security", difficulty: "Medium", prompt: "Explain how Cross-Site Request Forgery (CSRF) works and describe two effective ways to mitigate it.", rubric: "Must mention user session, forged request, Anti-CSRF tokens, SameSite cookie attributes.", points: 10 },
    { type: "open", category: "Networking", difficulty: "Medium", prompt: "Describe the TCP three-way handshake process. What flags are used?", rubric: "SYN, SYN-ACK, ACK. Must explain client-server state transitions.", points: 10 },
    { type: "open", category: "Linux", difficulty: "Easy", prompt: "How do you find all files with SUID bit set on a Linux system?", rubric: "find / -perm -4000 -type f 2>/dev/null", points: 10 },
    { type: "open", category: "General", difficulty: "Hard", prompt: "If you find a Server-Side Request Forgery (SSRF) vulnerability on an AWS-hosted application, what is your immediate next step to demonstrate impact?", rubric: "Query the AWS metadata service (169.254.169.254) to extract IAM credentials.", points: 10 },
    { type: "open", category: "OSINT", difficulty: "Easy", prompt: "What is Google Dorking? Give an example query to find exposed configuration files.", rubric: "Using advanced search operators. Example: ext:env OR filetype:conf", points: 10 },
    
    // Web Security MCQs
    { type: "mcq", category: "Web Security", difficulty: "Easy", prompt: "Which of the following is NOT a valid HTTP method?", options: JSON.stringify(["GET", "POST", "UPDATE", "OPTIONS"]), correctOption: 2, points: 2 },
    { type: "mcq", category: "Web Security", difficulty: "Medium", prompt: "What does CORS stand for?", options: JSON.stringify(["Cross-Origin Resource Sharing", "Centralized Open Routing System", "Cross-Object Request Scripting", "Core Object Resource Security"]), correctOption: 0, points: 2 },
    { type: "mcq", category: "Web Security", difficulty: "Hard", prompt: "Which HTTP header is primarily used to prevent Clickjacking?", options: JSON.stringify(["X-XSS-Protection", "Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security"]), correctOption: 2, points: 2 },
    
    // Networking MCQs
    { type: "mcq", category: "Networking", difficulty: "Easy", prompt: "What port does DNS typically run on?", options: JSON.stringify(["21", "22", "53", "80"]), correctOption: 2, points: 2 },
    { type: "mcq", category: "Networking", difficulty: "Medium", prompt: "Which Nmap flag performs a SYN stealth scan?", options: JSON.stringify(["-sT", "-sU", "-sV", "-sS"]), correctOption: 3, points: 2 },
    { type: "mcq", category: "Networking", difficulty: "Hard", prompt: "In a typical corporate network, what protocol does 802.1X utilize for authentication?", options: JSON.stringify(["RADIUS", "Kerberos", "NTLM", "LDAP"]), correctOption: 0, points: 2 },
    
    // Linux MCQs
    { type: "mcq", category: "Linux", difficulty: "Easy", prompt: "Which command reveals the current user's UID and GID?", options: JSON.stringify(["whoami", "id", "groups", "finger"]), correctOption: 1, points: 2 },
    { type: "mcq", category: "Linux", difficulty: "Medium", prompt: "What directory traditionally holds system-wide configuration files in Linux?", options: JSON.stringify(["/bin", "/var", "/etc", "/opt"]), correctOption: 2, points: 2 },
    { type: "mcq", category: "Linux", difficulty: "Hard", prompt: "If a file has permissions 755, what can the file owner do?", options: JSON.stringify(["Read, Write, Execute", "Read, Execute", "Read, Write", "Only Execute"]), correctOption: 0, points: 2 },
    
    // General / Cryptography MCQs
    { type: "mcq", category: "Cryptography", difficulty: "Easy", prompt: "Which of these is a hashing algorithm, NOT an encryption algorithm?", options: JSON.stringify(["AES", "RSA", "SHA-256", "DES"]), correctOption: 2, points: 2 },
    { type: "mcq", category: "Cryptography", difficulty: "Medium", prompt: "In asymmetric encryption, what key is used to verify a digital signature?", options: JSON.stringify(["Sender's Public Key", "Sender's Private Key", "Receiver's Public Key", "Receiver's Private Key"]), correctOption: 0, points: 2 },
    
    // More General MCQs
    { type: "mcq", category: "General", difficulty: "Easy", prompt: "What does the 'A' stand for in the CIA triad?", options: JSON.stringify(["Authentication", "Authorization", "Availability", "Accountability"]), correctOption: 2, points: 2 },
    { type: "mcq", category: "General", difficulty: "Medium", prompt: "Which vulnerability occurs when user input is executed directly in a database query?", options: JSON.stringify(["XSS", "SQL Injection", "CSRF", "SSRF"]), correctOption: 1, points: 2 },
    { type: "mcq", category: "General", difficulty: "Hard", prompt: "In Windows Active Directory, what is the default port for Global Catalog?", options: JSON.stringify(["389", "636", "3268", "88"]), correctOption: 2, points: 2 },
    { type: "mcq", category: "General", difficulty: "Easy", prompt: "Which phase of a penetration test comes first?", options: JSON.stringify(["Reconnaissance", "Scanning", "Exploitation", "Reporting"]), correctOption: 0, points: 2 },
  ];

  const existingCount = await prisma.questionBank.count();
  if (existingCount === 0) {
    for (const q of defaultQuestions) {
      await prisma.questionBank.create({ data: q });
    }
    console.log(`Seeded ${defaultQuestions.length} default questions.`);
  }

  console.log("✅ Seed complete!");
  console.log("\nAdmin credentials:");
  console.log("  Employee Code: CyberLabSec");
  console.log("  Password: ZohaibSadiq");
  console.log("\n⚠️  CHANGE THE ADMIN PASSWORD IMMEDIATELY after first login!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
