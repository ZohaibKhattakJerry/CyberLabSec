// @ts-nocheck
import { get } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromCookies();
  if (!auth) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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

    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Disposition": result.blob.contentDisposition || `inline; filename="document"`,
      }
    });
  } catch (error: any) {
    console.error("Vercel Blob GET error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
