import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

export async function GET() {
  const result: any = {
    ok: true,
    env: {
      mongoConfigured: Boolean(process.env.MONGODB_URI),
      apiSecretConfigured: Boolean(process.env.API_SECRET),
    },
  };
  try {
    await dbConnect();
    result.db = "connected";
  } catch (e: any) {
    result.db = "error";
    // Keep error message for debugging; should not contain secrets.
    result.dbError = e?.message;
    result.ok = false;
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
