import { NextResponse } from "next/server";

const ADVANCED_BANK = [
  // Web & App Sec
  { q: "As a {{JOB_TITLE}}, how do you secure web applications against SQL Injection according to the requirements mentioned for this role?", a: "Using Parameterized Queries", opts: ["Using Parameterized Queries", "Encoding HTML", "Using WAF only", "Obfuscating DB names"], tags: ["web", "sql", "application", "developer", "react", "node"] },
  { q: "Given the responsibilities in {{DEPARTMENT}}, what is the most effective defense against Cross-Site Scripting (XSS)?", a: "Context-aware output encoding", opts: ["Network firewalls", "Context-aware output encoding", "Disabling JavaScript", "Using HTTPS"], tags: ["web", "xss", "frontend", "react", "javascript", "application"] },
  { q: "Your role involves web security. How do you prevent Cross-Site Request Forgery (CSRF)?", a: "Using Anti-CSRF tokens and SameSite cookies", opts: ["Using Anti-CSRF tokens and SameSite cookies", "Encrypting passwords", "Using a VPN", "Blocking IP addresses"], tags: ["web", "csrf", "frontend"] },
  // Network & Infra
  { q: "Working in the {{DEPARTMENT}} department, which port and protocol does SSH use by default?", a: "TCP Port 22", opts: ["TCP Port 22", "UDP Port 53", "TCP Port 443", "TCP Port 21"], tags: ["network", "infrastructure", "linux", "sysadmin", "aws", "cloud"] },
  { q: "To fulfill the requirement of network monitoring, what does a SIEM do?", a: "Collects and analyzes security logs from across the network", opts: ["Collects and analyzes security logs from across the network", "Blocks unauthorized physical access", "Encrypts internal communications", "Routes internet traffic"], tags: ["network", "siem", "soc", "analyst", "monitoring", "splunk"] },
  { q: "As a {{JOB_TITLE}}, what is the primary purpose of subnetting?", a: "To divide a large network into smaller, more manageable sub-networks", opts: ["To hide IP addresses", "To divide a large network into smaller, more manageable sub-networks", "To bypass firewalls", "To increase internet speed"], tags: ["network", "cisco", "infrastructure", "routing"] },
  // Pentesting & Offensive
  { q: "During an engagement as a {{JOB_TITLE}}, what is the purpose of a reverse shell?", a: "To force the target machine to initiate a connection back to the attacker", opts: ["To encrypt data at rest", "To force the target machine to initiate a connection back to the attacker", "To bypass web application firewalls", "To crack passwords offline"], tags: ["pentest", "offensive", "red team", "exploit", "hacker"] },
  { q: "When using Nmap for this {{POSITION_TYPE}} position, what does the -sV flag do?", a: "Probes open ports to determine service and version info", opts: ["Probes open ports to determine service and version info", "Performs a stealth SYN scan", "Scans for UDP ports", "Disables ping sweep"], tags: ["pentest", "nmap", "offensive", "red team"] },
  { q: "Which tool is considered the industry standard for intercepting and modifying web traffic?", a: "Burp Suite", opts: ["Burp Suite", "Wireshark", "Metasploit", "Nmap"], tags: ["pentest", "burp", "web", "offensive"] },
  // Cloud & DevOps
  { q: "For a role demanding cloud expertise, what is the shared responsibility model in AWS/Azure?", a: "The cloud provider secures the infrastructure, the customer secures the data and apps", opts: ["The cloud provider secures the infrastructure, the customer secures the data and apps", "The provider handles all security", "The customer handles all security", "It only applies to billing"], tags: ["cloud", "aws", "azure", "devops", "kubernetes", "docker"] },
  { q: "As a {{JOB_TITLE}}, how do you secure a Docker container?", a: "Run containers as non-root and scan images for vulnerabilities", opts: ["Run containers as non-root and scan images for vulnerabilities", "Disable the network interface", "Encrypt the host OS", "Use only public images"], tags: ["cloud", "docker", "kubernetes", "devsecops"] },
  // General Security & Governance
  { q: "To meet the {{EXPERIENCE_LEVEL}} expectations for this role, explain the CIA triad.", a: "Confidentiality, Integrity, Availability", opts: ["Confidentiality, Integrity, Availability", "Control, Identity, Authentication", "Cyber, Intelligence, Analytics", "Compliance, Integrity, Authorization"], tags: ["governance", "compliance", "general", "manager", "auditor"] },
  { q: "What is the Principle of Least Privilege?", a: "Users are granted only the minimum access necessary to perform their job", opts: ["Users are granted only the minimum access necessary to perform their job", "All users get admin access temporarily", "Passwords are not required for internal networks", "Data is encrypted at rest"], tags: ["governance", "iam", "general", "security"] }
];

const ADVANCED_OPEN = [
  // Web
  { q: "As a {{JOB_TITLE}}, how would you design a secure authentication system for a new web application from scratch?", r: "Candidate should mention password hashing (bcrypt/Argon2), MFA/2FA, secure session management, rate limiting, and password policies.", tags: ["web", "developer", "react", "node", "architecture"] },
  // Pentest
  { q: "Describe your methodology for a penetration test on a corporate network. What phases do you follow?", r: "Reconnaissance, Scanning/Enumeration, Exploitation, Post-Exploitation, and Reporting.", tags: ["pentest", "offensive", "red team"] },
  // SOC/IR
  { q: "You receive a critical alert from the SIEM at 2 AM regarding suspicious lateral movement. What is your incident response plan?", r: "Identification/Triage, Containment (isolating hosts), Eradication, Recovery, and Lessons Learned.", tags: ["soc", "ir", "incident", "analyst", "blue team"] },
  // Cloud
  { q: "We host critical data in the cloud. How do you ensure our S3 buckets or Azure Blob Storage are secure against data leaks?", r: "Disable public access, implement strict IAM policies, enable logging/monitoring, and use encryption at rest (KMS).", tags: ["cloud", "aws", "azure", "devops"] },
  // General/Managerial
  { q: "Given your {{EXPERIENCE_LEVEL}} experience, how do you balance strict security compliance with developer productivity in the {{DEPARTMENT}} department?", r: "Candidate should discuss DevSecOps, shifting left, automated security testing in CI/CD, and fostering a security culture rather than acting as a blocker.", tags: ["manager", "governance", "devsecops", "lead"] }
];

function shuffle(array: any[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: Request) {
  try {
    const { title, type, department, location, deadline, description, requirements, niceToHave, whatYouGain, experienceLevel, openings, duration, weeklyHours, universityRequired, autoShortlist, stipend, count, openCount } = await req.json();

    const totalMcq = count || 5;
    const totalOpen = openCount || 2;

    // REAL-TIME ANALYSIS ENGINE (Offline Context Extraction)
    // Combine all fields to analyze the full context
    const fullText = `${title} ${department} ${description} ${requirements} ${niceToHave} ${whatYouGain}`.toLowerCase();
    
    const rankQuestions = (qBank: any[]) => {
      return qBank.map(q => {
        let score = 0;
        let matchedKeywords: string[] = [];
        
        q.tags.forEach((tag: string) => {
          // If the tag exists as a standalone word or within the text, increase score
          if (fullText.includes(tag)) {
            score += 10; // High weight for exact tag matches (e.g., 'react', 'aws', 'pentest')
            matchedKeywords.push(tag);
          }
        });

        // Add a slight random jitter to prevent the exact same questions every time for identical jobs
        return { ...q, score: score + Math.random(), matchedKeywords };
      }).sort((a, b) => b.score - a.score);
    };

    const rankedMcqs = rankQuestions(ADVANCED_BANK);
    const rankedOpen = rankQuestions(ADVANCED_OPEN);

    let selectedMcqs = rankedMcqs.slice(0, totalMcq);
    let selectedOpen = rankedOpen.slice(0, totalOpen);

    const flatQuestions: any[] = [];
    
    // Dynamic Template Injection
    const injectTemplates = (text: string) => {
      return text
        .replace(/\{\{JOB_TITLE\}\}/g, title || "Professional")
        .replace(/\{\{DEPARTMENT\}\}/g, department || "the department")
        .replace(/\{\{EXPERIENCE_LEVEL\}\}/g, experienceLevel || "your")
        .replace(/\{\{POSITION_TYPE\}\}/g, type || "this")
        .replace(/\{\{WEEKLY_HOURS\}\}/g, weeklyHours || "working")
        .replace(/\{\{LOCATION\}\}/g, location || "our office")
        .replace(/\{\{DEADLINE\}\}/g, deadline || "the deadline");
    };

    selectedMcqs.forEach(mcq => {
      flatQuestions.push({
        type: "MCQ",
        question: injectTemplates(mcq.q),
        options: shuffle(mcq.opts),
        correctAnswer: mcq.a
      });
    });

    selectedOpen.forEach(open => {
      flatQuestions.push({
        type: "OPEN",
        question: injectTemplates(open.q),
        rubric: open.r
      });
    });

    return NextResponse.json(flatQuestions);
  } catch (error: any) {
    console.error("Failed to generate offline assessment:", error);
    return NextResponse.json({ error: "Failed to generate assessment internally." }, { status: 500 });
  }
}
