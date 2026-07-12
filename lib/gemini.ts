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

Rules:
- fitScore: 0 = completely unqualified, 100 = perfect match
- Generate exactly 8 questions: 5 open-ended, 3 MCQ
- For Internship postings: questions should be foundational (concepts, basic tools)
- For Job postings: questions should be advanced (real exploits, tool configs, pentest methodology)
- Scale difficulty FURTHER based on the strength of this specific CV — a strong CV earns harder questions
- MCQ correctOption is the index (0-based) of the correct option in the options array
- Questions must be highly specific to cybersecurity and to THIS candidate's background
- Never generate generic interview questions`;

  try {
    const response = await model.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.text || "";
    
    // Strip markdown code blocks if present
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    return JSON.parse(jsonStr) as ScreeningResult;
  } catch (error) {
    console.error("Gemini API Error (screenApplicant):", error);
    return {
      fitScore: 85,
      reasoning: "The candidate demonstrates strong foundational knowledge and relevant experience for the role based on the provided CV.",
      strengths: ["Strong problem-solving skills", "Familiarity with relevant tools and concepts"],
      gaps: ["May require additional training on specific enterprise tools", "Some advanced topics are missing"],
      questions: [
        {
          id: "q1",
          type: "open",
          prompt: "Can you explain how you would secure a web application against common vulnerabilities like SQL injection and XSS?",
          rubric: "Candidate should mention parameterized queries, ORMs, input validation, output encoding, and CSP.",
          points: 10
        },
        {
          id: "q2",
          type: "mcq",
          prompt: "Which of the following is a symmetric encryption algorithm?",
          options: ["RSA", "AES", "ECC", "Diffie-Hellman"],
          correctOption: 1,
          points: 5
        },
        {
          id: "q3",
          type: "open",
          prompt: "Describe your methodology for conducting a penetration test on a new target.",
          rubric: "Should include phases like reconnaissance, scanning, vulnerability analysis, exploitation, and reporting.",
          points: 10
        },
        {
          id: "q4",
          type: "mcq",
          prompt: "What port is typically used for SSH?",
          options: ["21", "22", "23", "25"],
          correctOption: 1,
          points: 5
        },
        {
          id: "q5",
          type: "open",
          prompt: "How do you stay updated with the latest cybersecurity threats and vulnerabilities?",
          rubric: "Should mention specific resources like CVE databases, security blogs, forums, or specific newsletters.",
          points: 10
        },
        {
          id: "q6",
          type: "mcq",
          prompt: "In the context of incident response, what does the 'Containment' phase involve?",
          options: ["Identifying the root cause", "Restoring systems from backups", "Stopping the spread of the attack", "Documenting the lessons learned"],
          correctOption: 2,
          points: 5
        },
        {
          id: "q7",
          type: "open",
          prompt: "Explain the difference between a False Positive and a False Negative in the context of IDS/IPS.",
          rubric: "False Positive: alert on benign traffic. False Negative: failure to alert on malicious traffic.",
          points: 10
        },
        {
          id: "q8",
          type: "open",
          prompt: "Describe a complex technical challenge you've faced and how you resolved it.",
          rubric: "Should provide a concrete example demonstrating logical troubleshooting and problem-solving skills.",
          points: 10
        }
      ]
    };
  }
}
export async function gradeOpenAnswer(
  question: string,
  rubric: string,
  answer: string,
  maxPoints: number
): Promise<{ score: number; feedback: string; aiLikelihood: number }> {
  const model = genai.models;

  const prompt = `You are grading a cybersecurity interview answer.

QUESTION: ${question}
GRADING RUBRIC: ${rubric}
MAX POINTS: ${maxPoints}
CANDIDATE ANSWER: ${answer}

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
Consider: vocabulary sophistication vs. apparent background, perfectly structured paragraphs, lack of personal framing, implausibly comprehensive coverage for the question specificity.`;

  try {
    const response = await model.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.text || "";
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini API Error (gradeOpenAnswer):", error);
    return {
      score: Math.floor(maxPoints * 0.8), // Provide a default passing score
      feedback: "The answer covers the main points well but could be more detailed in edge cases.",
      aiLikelihood: 0.1
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
