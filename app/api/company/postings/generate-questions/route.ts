import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { title, department, description, requirements, niceToHave, whatYouGain, experienceLevel, count, openCount } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || "dummy";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const totalMcq = count || 5;
    const totalOpen = openCount || 2;

    const prompt = `You are an expert technical recruiter and assessor. Generate an assessment test for the following job posting.
    
Job Title: ${title}
Department: ${department || "N/A"}
Experience Level: ${experienceLevel}
Description: ${description}
Requirements & Qualifications: ${requirements || "N/A"}
Nice to Have: ${niceToHave || "N/A"}
What You'll Gain: ${whatYouGain || "N/A"}

Please generate EXACTLY ${totalMcq} Multiple Choice Questions (MCQs) and EXACTLY ${totalOpen} Open-Ended (Scenario/Technical) Questions.

Return ONLY a valid JSON array containing both types of questions. Each object in the array must follow this exact structure:

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
}

Ensure the questions are highly relevant to the specific technologies and responsibilities mentioned in the job context.
Do not use markdown blocks like \`\`\`json. Output raw JSON array.`;

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
  } catch (error) {
    console.error("AI Generation error:", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
