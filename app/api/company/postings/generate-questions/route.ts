import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { title, type, department, location, deadline, description, requirements, niceToHave, whatYouGain, experienceLevel, openings, duration, weeklyHours, universityRequired, autoShortlist, stipend, count, openCount } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "dummy") {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing. Please add a valid API key in your Vercel Environment Variables." }, { status: 401 });
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const totalMcq = count || 5;
    const totalOpen = openCount || 2;

    const prompt = `You are the question-generation engine for a cybersecurity job posting system.

Your job is to generate screening questions only from the information provided in the job posting form and the job bank settings. Do not use any external API, model name, or vendor-specific dependency in the output. Do not mention Gemini, Google, OpenAI, or any other service.

Use the following inputs:
1) Job Title: ${title}
2) Position Type: ${type || "N/A"}
3) Department: ${department || "N/A"}
4) Location: ${location || "N/A"}
5) Application Deadline: ${deadline || "N/A"}
6) Job Description & Responsibilities: ${description}
7) Requirements & Qualifications: ${requirements || "N/A"}
8) Nice to Have: ${niceToHave || "N/A"}
9) What You’ll Gain: ${whatYouGain || "N/A"}
10) Experience Level: ${experienceLevel}
11) Number of Openings: ${openings || "1"}
12) Duration: ${duration || "N/A"}
13) Weekly Hours: ${weeklyHours || "N/A"}
14) University Degree Required: ${universityRequired ? "Yes" : "No"}
15) Auto-Shortlist / AI Interview Immediately: ${autoShortlist ? "Yes" : "No"}
16) Stipend / Salary: ${stipend || "N/A"}
17) MCQ count requested by the user: ${totalMcq}
18) Open-ended / scenario question count requested by the user: ${totalOpen}

Rules:
- Generate questions only from the provided form fields.
- The number of MCQs must exactly match ${totalMcq}.
- The number of open-ended / scenario questions must exactly match ${totalOpen}.
- Make the questions highly relevant to the job title, role level, department, responsibilities, and qualifications.
- For cybersecurity/offensive security internships, focus on safe, job-relevant topics such as networking basics, Linux, web security, OWASP Top 10, Burp Suite, Nmap, reconnaissance, reporting, vulnerability identification, and ethical hacking fundamentals.
- Keep difficulty appropriate for the selected experience level.
- If the role is internship-level or beginner-friendly, do not make the questions overly advanced.
- Make MCQs practical and realistic, with 4 options each and only one correct answer.
- Make open-ended questions professional, screening-oriented, and suitable for evaluating mindset, learning ability, communication, and role fit.
- You must include the correct answer for MCQs and a grading rubric for open-ended questions so the system can auto-grade the applicant.
- Do not generate generic questions that are not tied to the job data.
- Do not include unsafe, illegal, or harmful instructions.
- Do not mention policies or internal reasoning.
- Return ONLY a valid JSON array.

Output format must be a flat JSON array of objects. Each object must follow this exact structure:

For MCQs:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": "string (must exactly match one of the options)",
  "type": "MCQ"
}

For Open-Ended Questions:
{
  "question": "string",
  "rubric": "string (A detailed grading rubric or expected answer key for the evaluator)",
  "type": "OPEN"
}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const text = result.response.text().trim();
    
    let questions;
    try {
      questions = JSON.parse(text);
    } catch (e) {
      // Fallback manual parse if JSON.parse still fails
      const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) questions = JSON.parse(match[0]);
      else throw e;
    }

    return NextResponse.json(questions);
  } catch (error: any) {
    console.error("Failed to generate assessment:", error);
    const msg = error?.message || "Failed to generate assessment. Please check your API key.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
