import { NextResponse } from "next/server";

const CYBER_MCQS = [
  {
    question: "As a {{JOB_TITLE}} in the {{DEPARTMENT}} department, you will often need to secure web applications. What is the primary purpose of a Web Application Firewall (WAF) in this context?",
    options: ["To encrypt database traffic", "To filter and monitor HTTP traffic", "To manage internal IP routing", "To act as a VPN gateway"],
    correctAnswer: "To filter and monitor HTTP traffic",
    tags: ["web", "owasp", "network"]
  },
  {
    question: "Given your {{EXPERIENCE_LEVEL}} experience level, which OWASP Top 10 vulnerability should you immediately recognize when user-supplied input is executed as code in the browser?",
    options: ["SQL Injection", "Cross-Site Scripting (XSS)", "Insecure Direct Object Reference", "CSRF"],
    correctAnswer: "Cross-Site Scripting (XSS)",
    tags: ["web", "owasp"]
  },
  {
    question: "While working your {{WEEKLY_HOURS}} hours a week, you might use Nmap for reconnaissance. What does the '-sS' flag signify?",
    options: ["SYN Stealth Scan", "UDP Scan", "Ping Scan", "Version Detection Scan"],
    correctAnswer: "SYN Stealth Scan",
    tags: ["network", "nmap"]
  },
  {
    question: "You will be dealing with Linux environments. Which Linux command is strictly used to change file permissions?",
    options: ["chown", "chmod", "passwd", "ps"],
    correctAnswer: "chmod",
    tags: ["linux", "fundamentals"]
  },
  {
    question: "To meet our requirement of '{{REQUIREMENTS_SNIPPET}}', what does the Principle of Least Privilege (PoLP) dictate?",
    options: ["Give users max access temporarily", "Give users minimum access required to do their job", "Only admins should use passwords", "Disable all network ports"],
    correctAnswer: "Give users minimum access required to do their job",
    tags: ["general", "compliance", "security"]
  },
  {
    question: "In this {{POSITION_TYPE}} role, you'll work with encryption. Which of the following is considered a symmetric encryption algorithm?",
    options: ["RSA", "Diffie-Hellman", "AES", "ECC"],
    correctAnswer: "AES",
    tags: ["crypto", "encryption"]
  },
  {
    question: "For a {{JOB_TITLE}} monitoring infrastructure, what is the main function of an Intrusion Detection System (IDS)?",
    options: ["To block malicious traffic automatically", "To encrypt network traffic", "To monitor network traffic for suspicious activity", "To host a honeypot"],
    correctAnswer: "To monitor network traffic for suspicious activity",
    tags: ["network", "soc"]
  },
  {
    question: "Working from {{LOCATION}}, you must secure our frontend. What HTTP header is commonly used to defend against Cross-Site Request Forgery (CSRF)?",
    options: ["Content-Security-Policy", "X-Frame-Options", "SameSite attribute in Cookies", "X-XSS-Protection"],
    correctAnswer: "SameSite attribute in Cookies",
    tags: ["web", "frontend"]
  },
  {
    question: "If you find a directory traversal vulnerability during an assessment, what are you likely trying to achieve?",
    options: ["Execute remote commands", "Access unauthorized files on the server", "Crash the application", "Hijack a user session"],
    correctAnswer: "Access unauthorized files on the server",
    tags: ["web", "pentesting"]
  },
  {
    question: "For Windows enterprise environments, what is the golden ticket attack targeting?",
    options: ["The domain controller's KRBTGT account", "The local administrator hash", "The SAM database", "The DNS server"],
    correctAnswer: "The domain controller's KRBTGT account",
    tags: ["windows", "active directory"]
  }
];

const CYBER_OPEN = [
  {
    question: "As a {{JOB_TITLE}}, explain the difference between a False Positive and a False Negative in a SIEM. Which is generally considered more dangerous and why?",
    rubric: "Candidate should explain that False Positive is an alert for non-malicious activity, while False Negative is a missed malicious activity. False Negatives are more dangerous because real attacks go undetected.",
    tags: ["soc", "general"]
  },
  {
    question: "Given your {{EXPERIENCE_LEVEL}} background, walk us through the steps you would take to secure a newly deployed Ubuntu Linux server exposed to the internet for the {{DEPARTMENT}} department.",
    rubric: "Candidate should mention: changing default SSH port, disabling root login, setting up SSH keys, configuring a firewall (UFW/iptables), keeping packages updated, and installing fail2ban.",
    tags: ["linux", "sysadmin"]
  },
  {
    question: "How would you explain a SQL Injection vulnerability to a non-technical manager, and what mitigation strategies would you recommend to a developer to meet our requirement of '{{REQUIREMENTS_SNIPPET}}'?",
    rubric: "Explanation should be simple (e.g., 'tricking the database into giving up info'). Mitigation must mention Prepared Statements or Parameterized Queries, and input validation.",
    tags: ["web", "communication"]
  },
  {
    question: "As a {{POSITION_TYPE}} team member, describe your methodology for conducting an initial network reconnaissance on a target scope. What tools and techniques do you use?",
    rubric: "Candidate should mention passive recon (OSINT, DNS enumeration, WHOIS) and active recon (Nmap, port scanning, service enumeration).",
    tags: ["network", "pentesting"]
  },
  {
    question: "If you discover a high-severity vulnerability that could take down a critical system, what is your immediate course of action to ensure safety before the {{DEADLINE}} deadline?",
    rubric: "Candidate should prioritize communication and safety: stop exploiting, immediately document the finding, and report it to the client/point-of-contact immediately rather than proceeding.",
    tags: ["general", "ethics"]
  }
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

    // Helper to extract a short meaningful snippet from requirements (fallback if empty)
    let reqSnippet = "maintaining strong security practices";
    if (requirements && requirements.length > 5) {
      const words = requirements.split(" ").slice(0, 6);
      reqSnippet = words.join(" ") + (words.length >= 6 ? "..." : "");
    }

    // Keyword matching for relevance
    const textLower = ((title || "") + " " + (description || "") + " " + (requirements || "")).toLowerCase();
    
    const rankQuestions = (qBank: any[]) => {
      return qBank.map(q => {
        let score = 0;
        q.tags.forEach((tag: string) => {
          if (textLower.includes(tag)) score += 2;
        });
        return { ...q, score: score + Math.random() }; // Random jitter for variety
      }).sort((a, b) => b.score - a.score);
    };

    const rankedMcqs = rankQuestions(CYBER_MCQS);
    const rankedOpen = rankQuestions(CYBER_OPEN);

    let selectedMcqs = rankedMcqs.slice(0, totalMcq);
    let selectedOpen = rankedOpen.slice(0, totalOpen);

    const flatQuestions: any[] = [];
    
    // Replace templates with actual job form field data
    const injectTemplates = (text: string) => {
      return text
        .replace(/\{\{JOB_TITLE\}\}/g, title || "Cybersecurity Professional")
        .replace(/\{\{DEPARTMENT\}\}/g, department || "Security")
        .replace(/\{\{EXPERIENCE_LEVEL\}\}/g, experienceLevel || "Mid-Level")
        .replace(/\{\{POSITION_TYPE\}\}/g, type || "Full-Time")
        .replace(/\{\{WEEKLY_HOURS\}\}/g, weeklyHours || "40")
        .replace(/\{\{LOCATION\}\}/g, location || "our office")
        .replace(/\{\{DEADLINE\}\}/g, deadline || "project")
        .replace(/\{\{REQUIREMENTS_SNIPPET\}\}/g, reqSnippet);
    };

    selectedMcqs.forEach(mcq => {
      flatQuestions.push({
        type: "MCQ",
        question: injectTemplates(mcq.question),
        options: shuffle(mcq.options),
        correctAnswer: mcq.correctAnswer
      });
    });

    selectedOpen.forEach(open => {
      flatQuestions.push({
        type: "OPEN",
        question: injectTemplates(open.question),
        rubric: open.rubric
      });
    });

    return NextResponse.json(flatQuestions);
  } catch (error: any) {
    console.error("Failed to generate assessment internally:", error);
    return NextResponse.json({ error: "Failed to generate assessment offline." }, { status: 500 });
  }
}
