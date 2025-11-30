import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
  const result: any = { ok: true };
  try {
    await dbConnect();
    result.db = 'connected';
  } catch (e: any) {
    result.db = 'error';
    result.dbError = e?.message;
  }
  return NextResponse.json(result);
}
