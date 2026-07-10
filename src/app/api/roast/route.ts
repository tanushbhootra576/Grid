import { NextRequest, NextResponse } from "next/server";
import ollama from "ollama";
import { PDFParse } from "pdf-parse";
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

    let finalResumeText = resumeText || "";

    if (pdfBase64 && !finalResumeText) {
      try {
        const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        const buffer = Buffer.from(cleanBase64, 'base64');
        const pdfParser = new PDFParse({ data: buffer });
        const pdfData = await pdfParser.getText();
        finalResumeText = pdfData.text;
      } catch (err) {
        console.error("PDF Parsing Error:", err);
        return NextResponse.json({ error: "Failed to extract text from PDF locally." }, { status: 400 });
      }
    }

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

    const fullPrompt = `${systemPrompt}\n\nHere is the resume:\n${finalResumeText}`;

    try {
        const response = await ollama.chat({
            model: 'llama3.2', // Extremely lightweight SLM (1-3GB)
            messages: [{ role: 'user', content: fullPrompt }],
            format: 'json'
        });

        let resultJson;
        try {
            resultJson = JSON.parse(response.message.content || "{}");
        } catch (e) {
            resultJson = { roast: response.message.content };
        }

        return NextResponse.json(resultJson, { status: 200 });
    } catch (aiError: any) {
        console.error("Ollama Error:", aiError);
        return NextResponse.json({ 
            error: "Failed to connect to local AI. Ensure Ollama is installed and running with 'ollama run llama3.2'." 
        }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("Error in roast API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to roast resume" },
      { status: 500 }
    );
  }
}
