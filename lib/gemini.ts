import { prisma } from "@/lib/prisma";

export interface ScreeningResult {
  fitScore: number; // 0-100
  reasoning: string;
  strengths: string[];
  gaps: string[];
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string;
  type: "open" | "mcq";
  prompt: string;
  options?: string[]; // MCQ only
  correctOption?: number; // MCQ only, 0-indexed
  rubric?: string; // Open-ended grading guide
  points: number;
}

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function screenApplicant(
  cvText: string,
  applicantName: string,
  jobTitle: string,
  jobDescription: string,
  jobRequirements: string,
  postingType: "Job" | "Internship"
): Promise<ScreeningResult> {
  const textLower = cvText.toLowerCase() + " " + jobTitle.toLowerCase() + " " + jobDescription.toLowerCase();
  
  // Categorize applicant based on keywords
  const categoryScores: Record<string, number> = {
    web: 0, network: 0, linux: 0, windows: 0, cloud: 0, crypto: 0, soc_ir: 0, malware: 0, general: 1
  };
  
  const keywords = {
    web: ["web", "owasp", "xss", "sql", "burp", "frontend", "backend", "api", "rest", "php", "javascript", "idor", "csrf", "ssrf"],
    network: ["network", "tcp", "ip", "cisco", "router", "switch", "wireshark", "nmap", "firewall", "ids", "ips"],
    linux: ["linux", "ubuntu", "bash", "shell", "kernel", "centos", "debian", "redhat", "unix", "suid"],
    windows: ["windows", "active directory", "ad ", "powershell", "kerberos", "ntlm", "smb", "sysinternals", "mimikatz", "bloodhound"],
    cloud: ["cloud", "aws", "azure", "gcp", "s3", "ec2", "iam", "kubernetes", "docker", "terraform"],
    crypto: ["crypto", "encryption", "aes", "rsa", "hash", "ssl", "tls", "pki", "certificate"],
    soc_ir: ["soc", "incident response", "siem", "splunk", "qradar", "hunting", "blue team", "forensics", "yara"],
    malware: ["malware", "reverse engineering", "ghidra", "ida", "disassembly", "sandbox", "ransomware", "virus", "trojan"]
  };

  for (const [cat, words] of Object.entries(keywords)) {
    for (const word of words) {
      // Use boundary regex to avoid partial matches
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(textLower)) {
        categoryScores[cat] += 2; // Weight hits heavily
      }
    }
  }

  // Sort categories by score descending
  const topCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .map(x => x[0]);

  // Select questions from DB
  const dbQuestions = await prisma.questionBank.findMany();
  
  const poolOpen = shuffle(dbQuestions.filter(q => q.type === "open"));
  const poolMcq = shuffle(dbQuestions.filter(q => q.type === "mcq"));

  const openQuestions = [];
  const mcqQuestions = [];

  // Pick 5 Open
  for (const cat of topCategories) {
    if (openQuestions.length >= 5) break;
    const qs = poolOpen.filter(q => q.category.toLowerCase() === cat && !openQuestions.find(o => o.id === q.id));
    if (qs.length > 0) openQuestions.push(qs[0]);
  }
  for (const q of poolOpen) {
    if (openQuestions.length >= 5) break;
    if (!openQuestions.find(o => o.id === q.id)) openQuestions.push(q);
  }

  // Pick 15 MCQ
  for (const cat of topCategories) {
    if (mcqQuestions.length >= 15) break;
    const qs = poolMcq.filter(q => q.category.toLowerCase() === cat && !mcqQuestions.find(m => m.id === q.id));
    if (qs.length > 0) {
      mcqQuestions.push(qs[0]);
      if (qs[1] && mcqQuestions.length < 15) mcqQuestions.push(qs[1]);
      if (qs[2] && mcqQuestions.length < 15) mcqQuestions.push(qs[2]);
    }
  }
  for (const q of poolMcq) {
    if (mcqQuestions.length >= 15) break;
    if (!mcqQuestions.find(m => m.id === q.id)) mcqQuestions.push(q);
  }

  // Format correctly
  const finalQuestions: InterviewQuestion[] = [
    ...openQuestions.map((q, i) => ({
      id: q.id, type: q.type as "open", prompt: q.prompt, rubric: q.rubric || "", points: q.points
    })),
    ...mcqQuestions.map((q, i) => ({
      id: q.id, type: q.type as "mcq", prompt: q.prompt, options: JSON.parse(q.options), correctOption: q.correctOption || 0, points: q.points
    }))
  ];

  // Advanced fit score calculation
  const totalHits = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  let fitScore = 40 + (totalHits * 3);
  if (fitScore > 98) fitScore = 98;
  if (cvText.length < 150) fitScore = 15;

  let strengths = ["Relevant keywords matched"];
  if (topCategories[0] !== "general") strengths.push(`Strong background in ${topCategories[0].toUpperCase()}`);
  if (topCategories[1] !== "general") strengths.push(`Good exposure to ${topCategories[1].toUpperCase()}`);

  let reasoning = `Profile parsed successfully. Matches found for ${topCategories.slice(0,2).join(" and ")} roles.`;

  // Profanity/Junk check
  const profanity = ["fuck", "shit", "bitch", "asshole", "cunt", "randi", "chutiya", "test test test"];
  for (const word of profanity) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(textLower)) {
      fitScore = 0;
      reasoning = "Application automatically rejected: Inappropriate or junk content detected.";
      strengths = [];
      break;
    }
  }

  return {
    fitScore,
    reasoning,
    strengths,
    gaps: ["Advanced semantic evaluation not available"],
    questions: finalQuestions
  };
}

export async function gradeOpenAnswer(
  questionText: string,
  rubric: string,
  answer: string,
  maxPoints: number,
  passMark: number
): Promise<{ score: number; feedback: string; aiLikelihood: number }> {
  const ansLower = answer.toLowerCase();
  
  const dbQuestion = await prisma.questionBank.findFirst({ where: { prompt: questionText } });
  let keywords = dbQuestion && dbQuestion.keywords ? JSON.parse(dbQuestion.keywords) : rubric.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  
  let matchCount = 0;
  for (const kw of keywords) {
    // Regex boundary to prevent substring matches (e.g., "win" matching "windows")
    const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
    if (regex.test(ansLower)) {
      matchCount++;
    } else {
      // Allow slight pluralizations or suffixes
      const fuzzyRegex = new RegExp(`\\b${kw.toLowerCase()}(s|es|ed|ing)?\\b`, 'i');
      if (fuzzyRegex.test(ansLower)) {
        matchCount += 0.8; // partial point for fuzzy match
      }
    }
  }

  const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0.5;
  
  // Base percentage based on keywords hit
  let scorePercent = matchRatio * 100;
  
  // Length bounds
  if (answer.trim().length < 20) scorePercent -= 50; // Too short
  else if (answer.trim().length < 50) scorePercent -= 20; 
  if (answer.length > 250) scorePercent += 10; // Thorough answer bonus
  
  // Strictness modifier based on the Job's Pass Mark
  // If PassMark is 80 (Strict), we penalize heavily. If PassMark is 40 (Lenient), we boost.
  const strictnessModifier = (passMark - 50) / 1.5; 
  scorePercent -= strictnessModifier;

  if (scorePercent > 100) scorePercent = 100;
  if (scorePercent < 0) scorePercent = 0;

  let finalScore = Math.round((scorePercent / 100) * maxPoints);

  // Profanity Check
  const profanity = ["fuck", "shit", "bitch", "asshole", "cunt", "randi", "chutiya"];
  for (const word of profanity) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(ansLower)) {
      finalScore = 0;
      break;
    }
  }

  let feedback = "Answer lacked key required concepts or was too brief.";
  if (finalScore >= maxPoints * 0.8) feedback = "Excellent, comprehensive answer covering all necessary technical points.";
  else if (finalScore >= maxPoints * 0.5) feedback = "Good answer covering some key points, but lacked deeper technical detail.";
  else if (finalScore > 0) feedback = "Partial answer. Missed several core concepts outlined in the rubric.";
  
  if (finalScore === 0) feedback = "Answer was completely irrelevant, too short, or contained inappropriate language.";

  // Detect likely cheating/pasting based on length & perfect match ratio
  let aiLikelihood = 0.0;
  if (answer.length > 600 && matchRatio >= 1) {
    aiLikelihood = 0.7; // Very long and perfectly hits all keywords
  } else if (answer.length > 1000) {
    aiLikelihood = 0.9; // Suspiciously long for a timed test
  }

  return {
    score: finalScore,
    feedback,
    aiLikelihood
  };
}

export async function enhanceReport(rawContent: string): Promise<string> {
  const sections = [
    "1. Executive Summary",
    "2. Scope & Methodology",
    "3. Findings & Vulnerabilities",
    "4. Risk Summary Table",
    "5. Recommendations"
  ];
  
  let out = "=== CYBERLAB PENETRATION TEST REPORT (AUTO-FORMATTED) ===\n\n";
  for (const sec of sections) {
    out += `${sec}\n----------------------------------------------------\n`;
    if (sec.includes("Findings")) {
      out += rawContent + "\n\n";
    } else {
      out += "[Section content logically derived and reserved for final draft]\n\n";
    }
  }
  
  return out;
}
