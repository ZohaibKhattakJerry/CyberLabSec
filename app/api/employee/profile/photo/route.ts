import { NextResponse } from "next/server";
import { getAuthFromCookies } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/fileStorage";

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 2MB." }, { status: 400 });
    }
    
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Must be an image." }, { status: 400 });
    }

    const { url } = await saveFile(file);

    await prisma.employee.update({
      where: { id: auth.sub },
      data: { photoUrl: url }
    });

    return NextResponse.json({ success: true, photoUrl: url });
  } catch (error: any) {
    console.error("Photo upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload photo" }, { status: 500 });
  }
}
