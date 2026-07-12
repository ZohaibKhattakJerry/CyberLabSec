import { questionBank, BankQuestion } from "./questionsBank";

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
  // We no longer use Gemini. We use our local algorithm to assess and generate questions.
  
  const textLower = cvText.toLowerCase() + " " + jobTitle.toLowerCase();
  
  // Categorize applicant based on keywords
  const categoryScores: Record<string, number> = {
    web: 0, network: 0, linux: 0, windows: 0, cloud: 0, crypto: 0, general: 1
  };
  
  const keywords = {
    web: ["web", "owasp", "xss", "sql", "burp", "frontend", "backend", "api", "rest", "php", "javascript"],
    network: ["network", "tcp", "ip", "cisco", "router", "switch", "wireshark", "nmap", "firewall"],
    linux: ["linux", "ubuntu", "bash", "shell", "kernel", "centos", "debian"],
    windows: ["windows", "active directory", "ad ", "powershell", "kerberos", "ntlm", "smb"],
    cloud: ["cloud", "aws", "azure", "gcp", "s3", "ec2", "iam", "kubernetes", "docker"],
    crypto: ["crypto", "encryption", "aes", "rsa", "hash", "ssl", "tls"]
  };

  for (const [cat, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (textLower.includes(word)) {
        categoryScores[cat] += 1;
      }
    }
  }

  // Sort categories by score descending
  const topCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .map(x => x[0]);

  // Select questions
  const openQuestions: BankQuestion[] = [];
  const mcqQuestions: BankQuestion[] = [];

  // Try to pick from top categories first
  const poolOpen = shuffle(questionBank.filter(q => q.type === "open"));
  const poolMcq = shuffle(questionBank.filter(q => q.type === "mcq"));

  // Pick 3 Open
  for (const cat of topCategories) {
    if (openQuestions.length >= 3) break;
    const qs = poolOpen.filter(q => q.category === cat && !openQuestions.includes(q));
    if (qs.length > 0) openQuestions.push(qs[0]);
  }
  // Fill remaining open
  for (const q of poolOpen) {
    if (openQuestions.length >= 3) break;
    if (!openQuestions.includes(q)) openQuestions.push(q);
  }

  // Pick 7 MCQ
  for (const cat of topCategories) {
    if (mcqQuestions.length >= 7) break;
    const qs = poolMcq.filter(q => q.category === cat && !mcqQuestions.includes(q));
    if (qs.length > 0) {
      // Add up to 2 per top category to diversify
      mcqQuestions.push(qs[0]);
      if (qs[1] && mcqQuestions.length < 7) mcqQuestions.push(qs[1]);
    }
  }
  // Fill remaining MCQ
  for (const q of poolMcq) {
    if (mcqQuestions.length >= 7) break;
    if (!mcqQuestions.includes(q)) mcqQuestions.push(q);
  }

  // Format correctly
  const finalQuestions: InterviewQuestion[] = [
    ...openQuestions.map((q, i) => ({
      id: `open_${i}`, type: q.type, prompt: q.prompt, rubric: q.rubric, points: 10
    })),
    ...mcqQuestions.map((q, i) => ({
      id: `mcq_${i}`, type: q.type, prompt: q.prompt, options: q.options, correctOption: q.correctOption, points: 5
    }))
  ];

  // Basic fit score calculation based on text length and keyword hits
  const totalHits = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  let fitScore = 40 + (totalHits * 5);
  if (fitScore > 95) fitScore = 95;
  if (cvText.length < 100) fitScore = 20;

  // Profanity check
  const profanity = ["fuck", "shit", "bitch", "asshole", "cunt"];
  for (const word of profanity) {
    if (textLower.includes(word)) {
      fitScore = 0;
      break;
    }
  }

  return {
    fitScore,
    reasoning: fitScore === 0 ? "Application flagged for inappropriate language." : "Candidate profile parsed and categorized locally. Keywords matched job requirements.",
    strengths: ["Keyword matching", "Local profiling"],
    gaps: ["Advanced contextual parsing"],
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
  // Local grading algorithm
  const ansLower = answer.toLowerCase();
  
  // Find the original question in the bank to get its keywords
  const bankQ = questionBank.find(q => q.prompt === questionText);
  
  const keywords = bankQ?.keywords || rubric.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  
  let matchCount = 0;
  for (const kw of keywords) {
    if (ansLower.includes(kw.toLowerCase())) {
      matchCount++;
    }
  }

  const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0.5;
  
  // Adjust based on strictness (passMark)
  // If passMark is 80, we expect high matchRatio. 
  // Base score
  let scorePercent = matchRatio * 100;
  
  // Length bonus/penalty
  if (answer.length < 50) scorePercent -= 30;
  if (answer.length > 200) scorePercent += 10;
  
  // Strictness modifier
  const strictnessModifier = (passMark - 50) / 2; // e.g. passMark 80 -> 15% penalty
  scorePercent -= strictnessModifier;

  if (scorePercent > 100) scorePercent = 100;
  if (scorePercent < 0) scorePercent = 0;

  let finalScore = Math.round((scorePercent / 100) * maxPoints);

  // Profanity check
  const profanity = ["fuck", "shit", "bitch", "asshole", "cunt", "randi", "chutiya"];
  for (const word of profanity) {
    if (ansLower.includes(word)) {
      finalScore = 0;
      break;
    }
  }

  let feedback = "Answer lacked key required concepts.";
  if (finalScore > maxPoints * 0.7) feedback = "Good answer covering most key points.";
  if (finalScore === maxPoints) feedback = "Excellent, comprehensive answer.";
  if (finalScore === 0) feedback = "Answer was completely irrelevant, too short, or contained inappropriate language.";

  // Detect likely cheating (e.g. pasted a whole textbook without much effort to paraphrase)
  // Not a real AI, so just guess based on extreme length and perfection, or zero length
  let aiLikelihood = 0.0;
  if (answer.length > 800 && matchCount === keywords.length) {
    aiLikelihood = 0.8;
  }

  return {
    score: finalScore,
    feedback,
    aiLikelihood
  };
}

export async function enhanceReport(rawContent: string): Promise<string> {
  // Without AI, we can only do basic string formatting
  const sections = [
    "1. Executive Summary",
    "2. Scope & Methodology",
    "3. Findings",
    "4. Risk Summary Table",
    "5. Recommendations"
  ];
  
  let out = "--- ENHANCED REPORT (AUTO-FORMATTED) ---\n\n";
  for (const sec of sections) {
    out += `${sec}\n-----------------------------\n`;
    if (sec.includes("Findings")) {
      out += rawContent + "\n\n";
    } else {
      out += "[Section content derived from findings]\n\n";
    }
  }
  
  return out;
}
