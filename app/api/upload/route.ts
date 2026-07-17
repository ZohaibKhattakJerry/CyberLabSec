import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
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
  } catch (error) {
    console.error("Vercel Blob upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
