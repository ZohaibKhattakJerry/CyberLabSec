import { NextResponse } from "next/server";

const CYBER_MCQS = [
  {
    question: "What is the primary purpose of a Web Application Firewall (WAF)?",
    options: ["To encrypt database traffic", "To filter and monitor HTTP traffic", "To manage internal IP routing", "To act as a VPN gateway"],
    correctAnswer: "To filter and monitor HTTP traffic",
    tags: ["web", "owasp", "network"]
  },
  {
    question: "Which OWASP Top 10 vulnerability occurs when user-supplied input is executed as code in the browser?",
    options: ["SQL Injection", "Cross-Site Scripting (XSS)", "Insecure Direct Object Reference", "CSRF"],
    correctAnswer: "Cross-Site Scripting (XSS)",
    tags: ["web", "owasp"]
  },
  {
    question: "In the context of Nmap, what does the '-sS' flag signify?",
    options: ["SYN Stealth Scan", "UDP Scan", "Ping Scan", "Version Detection Scan"],
    correctAnswer: "SYN Stealth Scan",
    tags: ["network", "nmap"]
  },
  {
    question: "Which Linux command is used to change file permissions?",
    options: ["chown", "chmod", "passwd", "ps"],
    correctAnswer: "chmod",
    tags: ["linux", "fundamentals"]
  },
  {
    question: "What does the Principle of Least Privilege (PoLP) dictate?",
    options: ["Give users max access temporarily", "Give users minimum access required to do their job", "Only admins should use passwords", "Disable all network ports"],
    correctAnswer: "Give users minimum access required to do their job",
    tags: ["general", "compliance"]
  },
  {
    question: "Which of the following is considered a symmetric encryption algorithm?",
    options: ["RSA", "Diffie-Hellman", "AES", "ECC"],
    correctAnswer: "AES",
    tags: ["crypto"]
  },
  {
    question: "What is the main function of an Intrusion Detection System (IDS)?",
    options: ["To block malicious traffic automatically", "To encrypt network traffic", "To monitor network traffic for suspicious activity", "To host a honeypot"],
    correctAnswer: "To monitor network traffic for suspicious activity",
    tags: ["network", "soc"]
  },
  {
    question: "What HTTP header is commonly used to defend against Cross-Site Request Forgery (CSRF)?",
    options: ["Content-Security-Policy", "X-Frame-Options", "SameSite attribute in Cookies", "X-XSS-Protection"],
    correctAnswer: "SameSite attribute in Cookies",
    tags: ["web"]
  },
  {
    question: "If a penetration tester finds a directory traversal vulnerability, what are they likely trying to achieve?",
    options: ["Execute remote commands", "Access unauthorized files on the server", "Crash the application", "Hijack a user session"],
    correctAnswer: "Access unauthorized files on the server",
    tags: ["web", "pentesting"]
  },
  {
    question: "In Active Directory, what is the golden ticket attack targeting?",
    options: ["The domain controller's KRBTGT account", "The local administrator hash", "The SAM database", "The DNS server"],
    correctAnswer: "The domain controller's KRBTGT account",
    tags: ["windows", "active directory"]
  }
];

const CYBER_OPEN = [
  {
    question: "Explain the difference between a False Positive and a False Negative in the context of a SIEM. Which one is generally considered more dangerous and why?",
    rubric: "Candidate should explain that False Positive is an alert for non-malicious activity, while False Negative is a missed malicious activity. False Negatives are more dangerous because real attacks go undetected.",
    tags: ["soc", "general"]
  },
  {
    question: "Walk us through the steps you would take to secure a newly deployed Ubuntu Linux server exposed to the internet.",
    rubric: "Candidate should mention: changing default SSH port, disabling root login, setting up SSH keys, configuring a firewall (UFW/iptables), keeping packages updated, and installing fail2ban.",
    tags: ["linux", "sysadmin"]
  },
  {
    question: "How would you explain a SQL Injection vulnerability to a non-technical manager, and what mitigation strategies would you recommend to a developer?",
    rubric: "Explanation should be simple (e.g., 'tricking the database into giving up info'). Mitigation must mention Prepared Statements or Parameterized Queries, and input validation.",
    tags: ["web", "communication"]
  },
  {
    question: "Describe your methodology for conducting an initial network reconnaissance on a target scope. What tools and techniques do you use?",
    rubric: "Candidate should mention passive recon (OSINT, DNS enumeration, WHOIS) and active recon (Nmap, port scanning, service enumeration).",
    tags: ["network", "pentesting"]
  },
  {
    question: "If you discover a high-severity vulnerability during a red team engagement that could take down a critical production system, what is your immediate course of action?",
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
    const { title, description, count, openCount } = await req.json();

    const totalMcq = count || 5;
    const totalOpen = openCount || 2;

    // We can do naive keyword matching based on the job title/description to prefer certain tags
    const textLower = (title + " " + description).toLowerCase();
    
    const rankQuestions = (qBank: any[]) => {
      return qBank.map(q => {
        let score = 0;
        q.tags.forEach((tag: string) => {
          if (textLower.includes(tag)) score += 2;
        });
        // Add random jitter so we don't always pick the same questions
        return { ...q, score: score + Math.random() };
      }).sort((a, b) => b.score - a.score);
    };

    const rankedMcqs = rankQuestions(CYBER_MCQS);
    const rankedOpen = rankQuestions(CYBER_OPEN);

    // Pick top requested amounts, falling back to all available if requested > available
    let selectedMcqs = rankedMcqs.slice(0, totalMcq);
    let selectedOpen = rankedOpen.slice(0, totalOpen);

    // If they asked for more than we have, just duplicate or return max (we'll just return what we have)
    
    // Format to exactly what the frontend expects
    const flatQuestions: any[] = [];
    
    selectedMcqs.forEach(mcq => {
      flatQuestions.push({
        type: "MCQ",
        question: mcq.question,
        options: shuffle(mcq.options),
        correctAnswer: mcq.correctAnswer
      });
    });

    selectedOpen.forEach(open => {
      flatQuestions.push({
        type: "OPEN",
        question: open.question,
        rubric: open.rubric
      });
    });

    return NextResponse.json(flatQuestions);
  } catch (error: any) {
    console.error("Failed to generate assessment:", error);
    return NextResponse.json({ error: "Failed to generate assessment internally." }, { status: 500 });
  }
}
