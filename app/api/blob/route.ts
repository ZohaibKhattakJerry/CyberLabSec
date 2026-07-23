import { get } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("url");
  if (!pathname) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Ensure it's a blob URL
  if (!pathname.includes(".blob.vercel-storage.com")) {
    return NextResponse.redirect(pathname); // If it's something else, just redirect to it
  }

  try {
    const result = await get(pathname, {
      access: "private",
    });
    if (result === null) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.redirect(result.blob.downloadUrl);
  } catch (error) {
    console.error("Vercel Blob GET error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
