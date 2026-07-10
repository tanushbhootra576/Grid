import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
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
        const pdfData = await pdfParse(buffer);
        finalResumeText = pdfData.text;
      } catch (err) {
        console.error("PDF Parsing Error:", err);
        return NextResponse.json({ error: "Failed to extract text from PDF locally." }, { status: 400 });
      }
    }

    // Return the extracted text to the client so the WebAssembly LLM can process it
    return NextResponse.json({ extractedText: finalResumeText }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error in roast API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract resume text" },
      { status: 500 }
    );
  }
}
