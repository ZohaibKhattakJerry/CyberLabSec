import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export async function screenApplicant(
  cvText: string,
  applicantName: string,
  jobTitle: string,
  jobDescription: string,
  jobRequirements: string,
  postingType: "Job" | "Internship"
): Promise<ScreeningResult> {
  const model = genai.models;
  
  const prompt = `You are a senior cybersecurity hiring manager at CyberLab, an offensive security company.

ROLE: ${jobTitle} (${postingType})
JOB DESCRIPTION: ${jobDescription}
REQUIREMENTS: ${jobRequirements}

CANDIDATE: ${applicantName}
CV/RESUME TEXT:
${cvText}

Evaluate this candidate for the role. Return ONLY valid JSON (no markdown, no explanations outside JSON):

{
  "fitScore": <integer 0-100>,
  "reasoning": "<2-3 sentences explaining the score>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "questions": [
    {
      "id": "q1",
      "type": "open",
      "prompt": "<question text tailored to their CV>",
      "rubric": "<what a good answer includes>",
      "points": 10
    },
    {
      "id": "q2",
      "type": "mcq",
      "prompt": "<technical question>",
      "options": ["A. option", "B. option", "C. option", "D. option"],
      "correctOption": <0-3>,
      "points": 5
    }
  ]
}

- Rules:
- fitScore: 0 = completely unqualified, 100 = perfect match
- Generate exactly 10 questions: 3 open-ended, 7 MCQ
- For Internship postings: questions should be foundational (concepts, basic tools)
- For Job postings: questions should be advanced (real exploits, tool configs, pentest methodology)
- Do not be excessively strict. Evaluate the candidate fairly based on their actual background. Do not reject a candidate purely because they lack experience if applying for an internship.
- MCQ correctOption is the index (0-based) of the correct option in the options array
- Questions must be highly specific to cybersecurity and to THIS candidate's background
- Never generate generic interview questions
- CRITICAL RULE: If the CV/Resume text contains profanity, abusive language, swear words (e.g., "fuck", "shit"), or consists of obvious garbage/trolling, you MUST set fitScore to 0 and explain why in the reasoning. However, YOU MUST STILL always generate exactly 10 valid questions based on the job requirements so the system does not crash.`;

  try {
    const response = await model.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    return JSON.parse(text) as ScreeningResult;
  } catch (error) {
    console.error("Gemini API Error (screenApplicant):", error);
    // If the API fails (e.g., rate limit or safety filters), return fallback questions to ensure the candidate can still take the interview.
    return {
      fitScore: 50,
      reasoning: "Application could not be processed automatically due to an API error. Using standard fallback assessment.",
      strengths: ["Unknown (System fallback)"],
      gaps: ["Unknown (System fallback)"],
      questions: [
        {
          id: "fb_open1",
          type: "open",
          prompt: "Describe your experience with cybersecurity principles and how you stay updated with the latest threats.",
          rubric: "Candidate should mention continuous learning, specific resources (e.g., CVEs, blogs, forums), and foundational principles like CIA triad.",
          points: 10
        },
        {
          id: "fb_open2",
          type: "open",
          prompt: "Explain the difference between a vulnerability assessment and a penetration test.",
          rubric: "Vulnerability assessment is automated scanning to find flaws; penetration testing is exploiting them to determine impact.",
          points: 10
        },
        {
          id: "fb_open3",
          type: "open",
          prompt: "If you discovered a critical vulnerability in our production environment, what would be your immediate steps?",
          rubric: "Verify the vulnerability, report it immediately to the security team/manager, do not exploit further, document findings.",
          points: 10
        },
        {
          id: "fb_mcq1",
          type: "mcq",
          prompt: "What does XSS stand for in web security?",
          options: ["A. Extensible Style Sheets", "B. Cross-Site Scripting", "C. XML Syntax Signature", "D. Cross-Site Signature"],
          correctOption: 1,
          points: 5
        },
        {
          id: "fb_mcq2",
          type: "mcq",
          prompt: "Which of the following ports is commonly used for SSH?",
          options: ["A. 21", "B. 22", "C. 23", "D. 80"],
          correctOption: 1,
          points: 5
        },
        {
          id: "fb_mcq3",
          type: "mcq",
          prompt: "What is the primary purpose of a firewall?",
          options: ["A. Encrypt data at rest", "B. Filter network traffic based on rules", "C. Scan for malware on a host", "D. Manage passwords"],
          correctOption: 1,
          points: 5
        },
        {
          id: "fb_mcq4",
          type: "mcq",
          prompt: "In the CIA Triad, what does the 'I' stand for?",
          options: ["A. Identity", "B. Integrity", "C. Isolation", "D. Interoperability"],
          correctOption: 1,
          points: 5
        },
        {
          id: "fb_mcq5",
          type: "mcq",
          prompt: "Which tool is standard for network packet capture and analysis?",
          options: ["A. Metasploit", "B. Nmap", "C. Wireshark", "D. Burp Suite"],
          correctOption: 2,
          points: 5
        },
        {
          id: "fb_mcq6",
          type: "mcq",
          prompt: "What type of attack involves overwhelming a server with traffic?",
          options: ["A. Phishing", "B. SQL Injection", "C. Man-in-the-Middle", "D. DDoS"],
          correctOption: 3,
          points: 5
        },
        {
          id: "fb_mcq7",
          type: "mcq",
          prompt: "Which command lists the contents of a directory in Linux?",
          options: ["A. cd", "B. ls", "C. pwd", "D. grep"],
          correctOption: 1,
          points: 5
        }
      ]
    };
  }
}

export async function gradeOpenAnswer(
  question: string,
  rubric: string,
  answer: string,
  maxPoints: number,
  passMark: number
): Promise<{ score: number; feedback: string; aiLikelihood: number }> {
  const model = genai.models;

  const prompt = `You are grading a cybersecurity interview answer.

QUESTION: ${question}
GRADING RUBRIC: ${rubric}
MAX POINTS: ${maxPoints}
CANDIDATE ANSWER: ${answer}

The required strictness (Interview Pass Mark) for this job is ${passMark}%.
Use this to calibrate your grading. If the passMark is high (e.g., 80-100), be extremely strict and critical of vague answers. If it is lower (e.g., 40-60), be more lenient with minor mistakes.

Return ONLY valid JSON:
{
  "score": <integer 0 to ${maxPoints}>,
  "feedback": "<brief explanation of score>",
  "aiLikelihood": <float 0.0 to 1.0 — probability this was AI-generated or copied, not genuinely typed by a human answering this specific question>
}

For aiLikelihood:
- 0.0 = clearly genuine human answer with natural imperfections
- 0.5 = ambiguous
- 1.0 = near-certain AI-generated or directly copied text
Consider: vocabulary sophistication vs. apparent background, perfectly structured paragraphs, lack of personal framing, implausibly comprehensive coverage for the question specificity.

CRITICAL RULE: If the answer contains abusive language, swear words, or blatant trolling (e.g., "fuck", "shit", fake nonsense), you MUST assign a score of 0, regardless of any other content.`;

  try {
    const response = await model.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error (gradeOpenAnswer):", error);
    return {
      score: Math.floor(maxPoints * (passMark / 100)), // Fallback: give them passing score if API fails
      feedback: "Automated grading unavailable due to system limits. Default score applied.",
      aiLikelihood: 0.0 // Do not falsely accuse of cheating
    };
  }
}

export async function enhanceReport(rawContent: string): Promise<string> {
  const model = genai.models;

  const prompt = `You are a senior cybersecurity report editor at CyberLab.

CRITICAL INSTRUCTION: You must preserve EVERY technical fact, vulnerability name, severity rating, CVE number, CVSS score, and finding EXACTLY as submitted. Do NOT invent, alter, add, or remove any technical content. Only restructure and improve the language and formatting.

RAW SUBMISSION:
${rawContent}

Restructure this into a professional penetration test report with these sections:
1. Executive Summary
2. Scope & Methodology  
3. Findings (each with: Name, Severity, CVSS Score if provided, Description, Evidence, Recommendation)
4. Risk Summary Table
5. Recommendations

Return the formatted report as plain text (no markdown headers with #, use plain section labels).`;

  try {
    const response = await model.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return response.text || rawContent;
  } catch (error) {
    console.error("Gemini API Error (enhanceReport):", error);
    return rawContent; // Fallback to raw content if API fails
  }
}
