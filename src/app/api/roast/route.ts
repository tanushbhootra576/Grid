import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resumeText, pdfBase64 } = await req.json();

    if (!resumeText && !pdfBase64) {
      return NextResponse.json({ error: "Resume text or PDF is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Gemini API key is not configured in the environment. Please add GEMINI_API_KEY to your .env file." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a ruthless, highly experienced Y Combinator partner and tech recruiter. 
A college student has just handed you their resume. Your job is to ROAST IT.
Do NOT sugarcoat anything. Be brutally honest.

You MUST respond ONLY with a valid JSON object with the following schema, and absolutely no other text, markdown, or backticks:
{
  "score": <number between 1 and 100 representing the resume's ATS/recruiter score>,
  "metrics": [<array of 3 short string bullet points highlighting the biggest red flags>],
  "roast": "<string containing the brutal multi-paragraph markdown roast>",
  "fixes": [<array of 3 highly actionable, strict string bullet points to fix it>],
  "skillsMap": [
    { "subject": "<Skill Area (e.g., Frontend, Backend, ML, DevOps)>", "A": <Score 1-100>, "fullMark": 100 }
  ] // Provide exactly 5 or 6 relevant skill areas based on the resume
}`;

    const parts: any[] = [{ text: systemPrompt }];
    
    if (resumeText) {
        parts.push({ text: "\n\nHere is the resume:\n" + resumeText });
    }
    
    if (pdfBase64) {
        parts.push({
            inlineData: {
                data: pdfBase64,
                mimeType: "application/pdf"
            }
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts }
        ],
        config: {
            responseMimeType: "application/json"
        }
    });

    let resultJson;
    try {
        resultJson = JSON.parse(response.text || "{}");
    } catch (e) {
        resultJson = { roast: response.text };
    }

    return NextResponse.json(resultJson, { status: 200 });
  } catch (error: any) {
    console.error("Error in roast API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to roast resume" },
      { status: 500 }
    );
  }
}
