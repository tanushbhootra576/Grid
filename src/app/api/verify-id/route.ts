import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { idImageBase64 } = await req.json();

    if (!idImageBase64) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an automated KYC verification system.
The user has uploaded a photo of an ID card. Your job is to verify if it is a valid Student ID Card or College ID.
Check if the name on the card matches "${user.name}".
Respond ONLY with a valid JSON object matching this schema:
{
  "isValidId": boolean,
  "nameMatches": boolean,
  "extractedName": string,
  "extractedCollege": string,
  "confidenceScore": number,
  "reason": string
}`;

    const parts: any[] = [
      { text: systemPrompt },
      {
        inlineData: {
            data: idImageBase64,
            mimeType: "image/jpeg"
        }
      }
    ];

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
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    if (resultJson.isValidId && resultJson.nameMatches) {
        user.verified = true;
        await user.save();
        return NextResponse.json({ success: true, verified: true, data: resultJson }, { status: 200 });
    } else {
        return NextResponse.json({ success: false, verified: false, data: resultJson }, { status: 200 });
    }

  } catch (error: any) {
    console.error("Error in verify-id API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
