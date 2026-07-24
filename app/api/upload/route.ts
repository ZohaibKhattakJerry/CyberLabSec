import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await getAuthFromCookies();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: "Request body is empty" }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: "private",
    });

    return NextResponse.json({ ...blob, url: `/api/blob?url=${encodeURIComponent(blob.url)}` });
  } catch (error: any) {
    console.error("Vercel Blob upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
