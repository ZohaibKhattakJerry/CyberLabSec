import { NextResponse } from "next/server";

export async function GET() {
  const envKeys = Object.keys(process.env);
  const dbUrl = process.env.DATABASE_URL;
  const dbUrlType = typeof dbUrl;
  const dbUrlLen = dbUrl ? dbUrl.length : 0;
  
  // Also check other formats
  const dbUrlBracket = process.env["DATABASE_URL"];
  
  return NextResponse.json({
    envKeys,
    dbUrlType,
    dbUrlLen,
    hasDbUrl: !!dbUrl,
    dbUrlBracket: typeof dbUrlBracket,
    nodeEnv: process.env.NODE_ENV
  });
}
