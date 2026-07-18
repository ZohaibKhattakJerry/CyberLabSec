import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { title, description, experienceLevel, count } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || "dummy";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Generate ${count || 5} multiple choice questions for a job posting.
Job Title: ${title}
Experience Level: ${experienceLevel}
Description: ${description}

Return ONLY a valid JSON array. Each object in the array must have the following structure:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correctAnswer": "string (must match one of the options)",
  "type": "MCQ"
}

Do not use markdown blocks like \`\`\`json. Output raw JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const questions = JSON.parse(cleanText);

    return NextResponse.json(questions);
  } catch (error) {
    console.error("AI Generation error:", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
