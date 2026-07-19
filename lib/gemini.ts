import { prisma } from "@/lib/prisma";
import { GoogleGenAI, Type } from "@google/genai";

const genai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

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


  if (genai) {
    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert technical recruiter evaluating a candidate for the role of ${jobTitle}.
Evaluate this candidate's CV against the job description and requirements.

Job Description: ${jobDescription}
Requirements: ${jobRequirements}

Candidate CV:
${cvText.substring(0, 3000)}

Respond ONLY with a valid JSON object containing:
- fitScore (integer 0-100)
- reasoning (short paragraph)
- strengths (array of strings)
- gaps (array of strings)
`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fitScore: { type: Type.INTEGER },
              reasoning: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });

      const generated = JSON.parse(response.text || "{}");
      if (generated.fitScore !== undefined) {
        return {
          fitScore: generated.fitScore,
          reasoning: generated.reasoning || "",
          strengths: generated.strengths || [],
          gaps: generated.gaps || [],
          questions: [],
        };
      }
    } catch (e) {
      console.error("Failed to generate AI screening:", e);
    }
  }

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
    questions: []
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

  // Profanity Check (Instant 0)
  const profanity = ["fuck", "shit", "bitch", "asshole", "cunt", "randi", "chutiya"];
  for (const word of profanity) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(ansLower)) {
      return { score: 0, feedback: "Inappropriate language detected.", aiLikelihood: 0 };
    }
  }

  // Length Check (Instant 0 if basically empty)
  if (answer.trim().length < 10) {
    return { score: 0, feedback: "Answer is too short to be evaluated.", aiLikelihood: 0 };
  }

  // Try using Gemini AI for grading
  if (genai) {
    try {
      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert technical interviewer grading a candidate's answer.
Question: ${questionText}
Rubric/Expected concepts: ${rubric}
Max Points: ${maxPoints}
Passing Criteria: The candidate needs ${passMark}% overall to pass the interview, so grade fairly but rigorously based on industry standards.

Candidate's Answer:
${answer}

Evaluate the candidate's answer.
- "score": Integer from 0 to ${maxPoints}.
- "feedback": 1 short sentence of feedback.
- "aiLikelihood": Float from 0.0 to 1.0 indicating if the answer seems artificially generated or copy-pasted (0.0 = human, 1.0 = obvious AI).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              feedback: { type: Type.STRING },
              aiLikelihood: { type: Type.NUMBER }
            },
            required: ["score", "feedback", "aiLikelihood"]
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      if (typeof data.score === 'number' && typeof data.feedback === 'string') {
        let finalScore = data.score;
        if (finalScore > maxPoints) finalScore = maxPoints;
        if (finalScore < 0) finalScore = 0;
        return {
          score: finalScore,
          feedback: data.feedback,
          aiLikelihood: data.aiLikelihood || 0
        };
      }
    } catch (e) {
      console.error("Gemini grading failed, falling back to keyword matching", e);
    }
  }

  // Fallback: Keyword matching
  const keywords = rubric.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  
  let matchCount = 0;
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
    if (regex.test(ansLower)) {
      matchCount++;
    } else {
      const fuzzyRegex = new RegExp(`\\b${kw.toLowerCase()}(s|es|ed|ing)?\\b`, 'i');
      if (fuzzyRegex.test(ansLower)) {
        matchCount += 0.8;
      }
    }
  }

  const matchRatio = keywords.length > 0 ? matchCount / keywords.length : (answer.length > 50 ? 0.8 : 0.5);
  let scorePercent = matchRatio * 100;
  
  if (answer.trim().length < 20) scorePercent -= 50; 
  else if (answer.trim().length < 50) scorePercent -= 20; 
  if (answer.length > 250) scorePercent += 10; 
  
  const strictnessModifier = (passMark - 50) / 8; // Very light penalty, max 6.25 points for passMark=100
  scorePercent -= Math.max(0, strictnessModifier); // Only penalise if passMark > 50

  if (scorePercent > 100) scorePercent = 100;
  if (scorePercent < 0) scorePercent = 0;

  let finalScore = Math.round((scorePercent / 100) * maxPoints);

  let feedback = "Answer lacked key required concepts or was too brief.";
  if (finalScore >= maxPoints * 0.8) feedback = "Excellent, comprehensive answer covering all necessary technical points.";
  else if (finalScore >= maxPoints * 0.5) feedback = "Good answer covering some key points, but lacked deeper technical detail.";
  else if (finalScore > 0) feedback = "Partial answer. Missed several core concepts outlined in the rubric.";
  if (finalScore === 0) feedback = "Answer was completely irrelevant or too short.";

  let aiLikelihood = 0.0;
  if (answer.length > 600 && matchRatio >= 1) aiLikelihood = 0.7; 
  else if (answer.length > 1000) aiLikelihood = 0.9; 

  return { score: finalScore, feedback, aiLikelihood };
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
