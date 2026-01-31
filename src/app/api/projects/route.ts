import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import "@/models/User";
import { validateContent } from "@/lib/moderation";

function classifyServerError(error: unknown): { code: string; detail?: string } {
  const detail = error instanceof Error ? error.message : String(error);

  if (/MONGODB_URI missing/i.test(detail)) {
    return { code: "DB_NOT_CONFIGURED", detail };
  }

  if (/Schema hasn't been registered for model\s+"User"/i.test(detail)) {
    return { code: "MODEL_USER_NOT_REGISTERED", detail };
  }

  if (/(ECONNREFUSED|ENOTFOUND|ETIMEDOUT|MongoNetworkError|MongooseServerSelectionError)/i.test(detail)) {
    return { code: "DB_CONNECTION_FAILED", detail };
  }

  return { code: "UNKNOWN", detail };
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const query: any = {};
    if (memberId && /^[a-fA-F0-9]{24}$/.test(memberId)) {
      query.teamMembers = memberId;
    }
    const projects = await Project.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .populate("teamMembers", "firebaseUid name email collaborationStatus")
      .lean();
    return NextResponse.json({ projects });
  } catch (error) {
    const { code, detail } = classifyServerError(error);
    console.error("[projects.GET] Error", code, detail);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        code,
        ...(process.env.NODE_ENV !== "production" ? { detail } : null),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Moderation check
    try {
      await validateContent(body.title, "title");
      await validateContent(body.description, "description");
    } catch (modError: any) {
      return NextResponse.json({ error: modError.message }, { status: 400 });
    }

    const project = await Project.create(body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
