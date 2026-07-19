// lib/assessmentEngine.ts

export interface GeneratedQuestion {
  id: string;
  type: "mcq" | "open" | "scenario";
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prompt: string;
  options?: string[]; // Only for MCQ
  points: number;
}

export interface AnswerKeyEntry {
  questionId: string;
  correctOption?: number; // For MCQs
  rubric?: string;        // For open/scenarios
}

export interface AssessmentGenerationResult {
  assessmentBank: GeneratedQuestion[];
  answerKey: AnswerKeyEntry[];
}

export interface JobContext {
  title: string;
  department: string;
  description: string;
  requirements: string;
  experienceLevel: string;
  niceToHave: string;
  type: string;
}

// -------------------------------------------------------------
// Large Static Template Dictionaries (No API Required)
// -------------------------------------------------------------

const PENTEST_MCQ = [
  { prompt: "Which of the following ports is typically used by RDP?", options: ["21", "22", "3389", "443"], correct: 2, diff: "Easy" },
  { prompt: "Which Nmap scan type is known as a SYN scan?", options: ["-sS", "-sT", "-sU", "-sX"], correct: 0, diff: "Medium" },
  { prompt: "What does the 'Pass-the-Hash' attack target in Windows networks?", options: ["Kerberos tickets", "NTLM hashes", "LDAP cleartext", "SMB versions"], correct: 1, diff: "Hard" },
  { prompt: "Which HTTP header is most critical in preventing Clickjacking?", options: ["Content-Security-Policy", "X-Frame-Options", "Strict-Transport-Security", "X-Content-Type-Options"], correct: 1, diff: "Medium" },
  { prompt: "What is a 'Bind Shell'?", options: ["A shell that connects back to the attacker", "A shell that listens on a port on the target machine", "A shell obfuscated with base64", "A web-based terminal"], correct: 1, diff: "Medium" },
  { prompt: "In a Windows Active Directory environment, what attack extracts service account credential hashes from the KDC?", options: ["AS-REP Roasting", "Kerberoasting", "Pass-the-Ticket", "Silver Ticket"], correct: 1, diff: "Hard" },
  { prompt: "Which tool is best suited for dynamic binary instrumentation and reverse engineering?", options: ["Wireshark", "Burp Suite", "Frida", "Nmap"], correct: 2, diff: "Hard" },
  { prompt: "When discovering a Server-Side Template Injection (SSTI), what is usually the primary goal?", options: ["DDoS the server", "Read arbitrary files or Remote Code Execution", "Cross-site scripting", "Bypass CORS"], correct: 1, diff: "Medium" },
];

const SECURITY_MCQ = [
  { prompt: "What does XSS stand for?", options: ["Cross-Site Scripting", "XML Site Security", "Cross-Server Scripting", "X-Site System"], correct: 0, diff: "Easy" },
  { prompt: "Which of the following is a common defense against SQL Injection?", options: ["Prepared Statements", "Base64 Encoding", "MD5 Hashing", "CORS"], correct: 0, diff: "Easy" },
  { prompt: "What does CSRF stand for?", options: ["Cross-Site Request Forgery", "Centralized Security Rules", "Cross-Server Routing", "Client-Side Request Formatting"], correct: 0, diff: "Medium" },
  { prompt: "Which hashing algorithm is widely considered broken for cryptographic purposes due to collisions?", options: ["SHA-256", "bcrypt", "MD5", "Argon2"], correct: 2, diff: "Medium" },
  { prompt: "What is the primary purpose of a Content Security Policy (CSP)?", options: ["To encrypt database passwords", "To prevent XSS and data injection attacks", "To secure API endpoints with JWT", "To validate SSL certificates"], correct: 1, diff: "Medium" },
  { prompt: "Which of the following describes Insecure Direct Object Reference (IDOR)?", options: ["Accessing a database using default credentials", "Manipulating an unvalidated parameter to access another user's data", "Injecting malicious JavaScript into a form", "A buffer overflow leading to RCE"], correct: 1, diff: "Medium" },
  { prompt: "In OAuth 2.0, what is the role of the 'state' parameter?", options: ["To prevent CSRF attacks during the redirect phase", "To store the user's password securely", "To define the token expiration time", "To bypass the consent screen"], correct: 0, diff: "Hard" },
];

const FRONTEND_MCQ = [
  { prompt: "What does the 'useState' hook do in React?", options: ["Fetches data", "Manages state in a functional component", "Updates the DOM directly", "Creates a context"], correct: 1, diff: "Easy" },
  { prompt: "Which CSS property handles Flexbox layout direction?", options: ["justify-content", "align-items", "flex-direction", "flex-wrap"], correct: 2, diff: "Easy" },
  { prompt: "What is Server-Side Rendering (SSR) primarily used for in Next.js?", options: ["Faster initial page load and SEO", "Replacing databases", "Running Python code", "Websocket management"], correct: 0, diff: "Medium" },
  { prompt: "What is the Virtual DOM in React?", options: ["A direct copy of the actual DOM", "An in-memory representation of the UI to optimize rendering", "A database for storing HTML elements", "A tool for rendering 3D graphics"], correct: 1, diff: "Medium" },
  { prompt: "Which of the following causes a memory leak in a React component?", options: ["Using too many components", "Failing to clear intervals/subscriptions in useEffect cleanup", "Using Redux for small apps", "Rendering large images"], correct: 1, diff: "Hard" },
];

const BACKEND_MCQ = [
  { prompt: "What HTTP status code indicates a resource was successfully created?", options: ["200", "201", "204", "400"], correct: 1, diff: "Easy" },
  { prompt: "Which of the following is a NoSQL database?", options: ["PostgreSQL", "MySQL", "MongoDB", "Oracle"], correct: 2, diff: "Easy" },
  { prompt: "What does an ORM do?", options: ["Maps objects to relational databases", "Optimizes routing", "Handles OAuth", "Compiles TypeScript to JavaScript"], correct: 0, diff: "Medium" },
  { prompt: "In a microservices architecture, what is an API Gateway typically used for?", options: ["Storing user passwords", "Routing requests, rate limiting, and authentication", "Replacing Docker containers", "Compiling frontend assets"], correct: 1, diff: "Medium" },
  { prompt: "What is the CAP Theorem?", options: ["Consistency, Availability, Partition Tolerance", "Concurrency, Asynchrony, Parallelism", "Caching, Authorization, Performance", "Compute, Analytics, Processing"], correct: 0, diff: "Hard" },
];

const GENERAL_MCQ = [
  { prompt: "What does API stand for?", options: ["Application Programming Interface", "Advanced Programming Integration", "Automated Process Interface", "Application Process Integration"], correct: 0, diff: "Easy" },
  { prompt: "What is Git used for?", options: ["Database hosting", "Version control", "Writing HTML", "Image editing"], correct: 1, diff: "Easy" },
  { prompt: "What does CI/CD stand for?", options: ["Continuous Integration / Continuous Deployment", "Code Integration / Code Delivery", "Centralized Information / Central Data", "Command Interface / Command Directory"], correct: 0, diff: "Medium" },
];

const SCENARIOS = [
  { category: "pentest", diff: "Hard", prompt: "SCENARIO: You compromised a low-privileged user account on an internal Windows domain. Describe your methodology for escalating privileges to Domain Admin.", rubric: "Look for Active Directory enumeration (BloodHound), Kerberoasting, AS-REP Roasting, checking for unquoted service paths, or vulnerable group policies." },
  { category: "pentest", diff: "Medium", prompt: "Explain how a Server-Side Request Forgery (SSRF) attack works and provide an example of how you would pivot to attack an internal cloud metadata service (e.g., AWS).", rubric: "Mention accessing 169.254.169.254, bypassing input validation, and retrieving IAM role credentials." },
  { category: "security", diff: "Medium", prompt: "A client reports their application is vulnerable to Cross-Site Scripting (XSS). Explain the difference between Reflected, Stored, and DOM-based XSS, and how to mitigate them.", rubric: "Stored = in DB, Reflected = in URL payload, DOM = in client-side JS. Mitigation: Context-aware output encoding, CSP." },
  { category: "frontend", diff: "Hard", prompt: "SCENARIO: Your React application is experiencing severe re-rendering performance issues on a complex data grid. How do you profile and fix this?", rubric: "Mention React Profiler, React.memo, useMemo, useCallback, and avoiding anonymous functions in props." },
  { category: "backend", diff: "Medium", prompt: "Explain how you would design a rate-limiting middleware in Node.js to protect a public API from brute-force attacks.", rubric: "Mention using Redis or in-memory stores, IP-based tracking, sliding window or token bucket algorithms, and returning HTTP 429." },
  { category: "backend", diff: "Hard", prompt: "SCENARIO: Your database is suffering from high CPU usage and slow queries under heavy read load. How do you identify the bottlenecks and scale the system?", rubric: "Mention EXPLAIN ANALYZE, creating indexes, read replicas, query caching (Redis), or connection pooling (PgBouncer)." },
  { category: "general", diff: "Easy", prompt: "Describe your ideal workflow for moving a feature from development into production.", rubric: "Mention local testing, pull requests, code reviews, automated CI/CD pipelines, staging environments, and deployment." }
];

// -------------------------------------------------------------
// Core Engine
// -------------------------------------------------------------

function extractSkills(ctx: JobContext): string[] {
  const combinedText = `${ctx.title} ${ctx.description} ${ctx.requirements} ${ctx.department} ${ctx.niceToHave}`.toLowerCase();
  const skills = new Set<string>(["general"]);

  if (combinedText.includes("secur") || combinedText.includes("cyber") || combinedText.includes("vulnerab") || combinedText.includes("soc") || combinedText.includes("audit") || combinedText.includes("risk") || combinedText.includes("compliance") || combinedText.includes("analyst")) {
    skills.add("security");
  }
  if (combinedText.includes("pentest") || combinedText.includes("hacker") || combinedText.includes("offensive") || combinedText.includes("red team") || combinedText.includes("exploit") || combinedText.includes("malware") || combinedText.includes("reverse engineer")) {
    skills.add("pentest");
  }
  if (combinedText.includes("react") || combinedText.includes("frontend") || combinedText.includes("ui") || combinedText.includes("next") || combinedText.includes("css") || combinedText.includes("html") || combinedText.includes("javascript") || combinedText.includes("web") || combinedText.includes("developer")) {
    skills.add("frontend");
  }
  if (combinedText.includes("node") || combinedText.includes("backend") || combinedText.includes("api") || combinedText.includes("database") || combinedText.includes("sql") || combinedText.includes("python") || combinedText.includes("java") || combinedText.includes("server") || combinedText.includes("engineer")) {
    skills.add("backend");
  }

  if (skills.size === 1) {
    skills.add("security");
  }

  // Ensure cybersecurity defaults if nothing else matches
  if (skills.size === 1 && (combinedText.includes("sec") || ctx.department.toLowerCase().includes("sec"))) {
    skills.add("security");
  }

  return Array.from(skills);
}

function determineDifficultyLimit(experienceLevel: string, type: string): string[] {
  const exp = experienceLevel.toLowerCase();
  const typ = type.toLowerCase();
  
  if (typ.includes("intern") || exp.includes("junior") || exp.includes("entry") || exp.includes("0-1")) {
    return ["Easy", "Medium"];
  }
  if (exp.includes("senior") || exp.includes("lead") || exp.includes("expert") || exp.includes("3+") || exp.includes("5+")) {
    return ["Medium", "Hard"];
  }
  return ["Easy", "Medium", "Hard"];
}

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function generateAssessmentBank(
  ctx: JobContext,
  settings: { mcqCount: number; openCount: number }
): AssessmentGenerationResult {
  const skills = extractSkills(ctx);
  const diffLimits = determineDifficultyLimit(ctx.experienceLevel, ctx.type);
  
  let rawMcqs: any[] = [];
  let rawScenarios: any[] = [];

  // Aggregate questions based on extracted skills
  skills.forEach(skill => {
    if (skill === "pentest") rawMcqs = rawMcqs.concat(PENTEST_MCQ);
    if (skill === "security") rawMcqs = rawMcqs.concat(SECURITY_MCQ);
    if (skill === "frontend") rawMcqs = rawMcqs.concat(FRONTEND_MCQ);
    if (skill === "backend") rawMcqs = rawMcqs.concat(BACKEND_MCQ);
    if (skill === "general") rawMcqs = rawMcqs.concat(GENERAL_MCQ);
    
    const relevantScenarios = SCENARIOS.filter(s => s.category === skill);
    rawScenarios = rawScenarios.concat(relevantScenarios);
  });

  // Filter by difficulty constraints
  rawMcqs = rawMcqs.filter(q => diffLimits.includes(q.diff));
  rawScenarios = rawScenarios.filter(q => diffLimits.includes(q.diff));

  // Shuffle pools
  rawMcqs = shuffleArray(rawMcqs);
  rawScenarios = shuffleArray(rawScenarios);

  // Take requested counts (or max available)
  // Multiply requested counts by 3 to create a larger pool for rotation across attempts/applicants
  const poolMcqCount = settings.mcqCount * 3;
  const poolOpenCount = settings.openCount * 3;
  const selectedMcqs = rawMcqs.slice(0, Math.min(poolMcqCount, rawMcqs.length));
  const selectedScenarios = rawScenarios.slice(0, Math.min(poolOpenCount, rawScenarios.length));

  const assessmentBank: GeneratedQuestion[] = [];
  const answerKey: AnswerKeyEntry[] = [];

  // Format MCQs
  selectedMcqs.forEach((q, idx) => {
    const id = `mcq-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    
    assessmentBank.push({
      id,
      type: "mcq",
      category: "Technical",
      difficulty: q.diff as any,
      prompt: q.prompt,
      options: q.options,
      points: q.diff === "Hard" ? 5 : q.diff === "Medium" ? 3 : 2
    });

    answerKey.push({
      questionId: id,
      correctOption: q.correct
    });
  });

  // Format Scenarios
  selectedScenarios.forEach((s, idx) => {
    const id = `open-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    
    assessmentBank.push({
      id,
      type: "scenario",
      category: s.category.toUpperCase(),
      difficulty: s.diff as any,
      prompt: s.prompt,
      points: s.diff === "Hard" ? 20 : s.diff === "Medium" ? 15 : 10
    });

    answerKey.push({
      questionId: id,
      rubric: s.rubric
    });
  });

  return { assessmentBank, answerKey };
}

// -------------------------------------------------------------
// Unique Applicant Variant Generator
// -------------------------------------------------------------
// When an applicant starts the test, this function selects a subset
// and randomizes option orders to prevent cheating across applicants.

export function generateApplicantVariant(
  bank: GeneratedQuestion[],
  masterAnswerKey: AnswerKeyEntry[],
  settings: { mcqCount: number; openCount: number }
) {
  const mcqs = bank.filter(q => q.type === "mcq");
  const scenarios = bank.filter(q => q.type !== "mcq");

  const selectedMcqs = shuffleArray(mcqs).slice(0, Math.min(settings.mcqCount, mcqs.length));
  const selectedScenarios = shuffleArray(scenarios).slice(0, Math.min(settings.openCount, scenarios.length));

  let selected = shuffleArray([...selectedMcqs, ...selectedScenarios]);
  
  const applicantQuestions: Omit<GeneratedQuestion, "correctOption" | "rubric">[] = [];
  const applicantAnswers: AnswerKeyEntry[] = [];

  selected.forEach(q => {
    if (q.type === "mcq" && q.options) {
      // Shuffle options
      const originalCorrectIndex = masterAnswerKey.find(a => a.questionId === q.id)?.correctOption ?? 0;
      const originalCorrectText = q.options[originalCorrectIndex];
      
      const shuffledOptions = shuffleArray(q.options);
      const newCorrectIndex = shuffledOptions.indexOf(originalCorrectText);

      applicantQuestions.push({
        ...q,
        options: shuffledOptions
      });

      applicantAnswers.push({
        questionId: q.id,
        correctOption: newCorrectIndex
      });
    } else {
      // Open / Scenario
      const rubric = masterAnswerKey.find(a => a.questionId === q.id)?.rubric;
      applicantQuestions.push({ ...q });
      applicantAnswers.push({
        questionId: q.id,
        rubric: rubric
      });
    }
  });

  return { applicantQuestions, applicantAnswers };
}
