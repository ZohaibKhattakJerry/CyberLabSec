import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { title, type, department, location, deadline, description, requirements, niceToHave, whatYouGain, experienceLevel, openings, duration, weeklyHours, universityRequired, autoShortlist, stipend, count, openCount } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "dummy") {
      return NextResponse.json({ error: "GEMINI_API_KEY is missing. Please add a valid API key in your Vercel Environment Variables." }, { status: 401 });
    }
    
    // Use the NEW SDK to avoid 404 API version errors!
    const genAI = new GoogleGenAI({ apiKey });

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
- The number of MCQs must exactly match the requested MCQ count.
- The number of open-ended / scenario questions must exactly match the requested open-ended count.
- Make the questions highly relevant to the job title, role level, department, responsibilities, and qualifications.
- For cybersecurity/offensive security internships, focus on safe, job-relevant topics such as networking basics, Linux, web security, OWASP Top 10, Burp Suite, Nmap, reconnaissance, reporting, vulnerability identification, and ethical hacking fundamentals.
- Keep difficulty appropriate for the selected experience level.
- If the role is internship-level or beginner-friendly, do not make the questions overly advanced.
- Make MCQs practical and realistic, with 4 options each and only one correct answer.
- Make open-ended questions professional, screening-oriented, and suitable for evaluating mindset, learning ability, communication, and role fit.
- Do not generate generic questions that are not tied to the job data.
- Do not include unsafe, illegal, or harmful instructions.
- Do not mention policies or internal reasoning.
- Return valid JSON only.

Output format:
{
  "job_title": "",
  "mcqs": [
    {
      "question": "",
      "options": ["", "", "", ""],
      "correctAnswer": "" // Explicitly asked: required for the system to grade
    }
  ],
  "open_ended": [
    {
      "question": "",
      "rubric": "" // Explicitly asked: required for grading criteria
    }
  ]
}

Input data:
Job Details provided in the fields above.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = result.text.trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      // Fallback manual parse if JSON.parse still fails
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsedData = JSON.parse(match[0]);
      else throw e;
    }

    const flatQuestions: any[] = [];
    if (parsedData.mcqs && Array.isArray(parsedData.mcqs)) {
      parsedData.mcqs.forEach((mcq: any) => flatQuestions.push({ ...mcq, type: "MCQ" }));
    }
    if (parsedData.open_ended && Array.isArray(parsedData.open_ended)) {
      parsedData.open_ended.forEach((open: any) => flatQuestions.push({ ...open, type: "OPEN" }));
    }
    
    // Fallback if AI returned a flat array despite instructions
    if (flatQuestions.length === 0 && Array.isArray(parsedData)) {
      parsedData.forEach(q => flatQuestions.push(q));
    }

    return NextResponse.json(flatQuestions);
  } catch (error: any) {
    console.error("Failed to generate assessment:", error);
    const msg = error?.message || "Failed to generate assessment. Please check your API key.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
