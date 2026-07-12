import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_BASE = path.join(process.cwd(), "uploads");

type UploadCategory = "cv" | "photo" | "task" | "attachment";

const ALLOWED_TYPES: Record<UploadCategory, string[]> = {
  cv: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  photo: ["image/jpeg", "image/png", "image/webp"],
  task: ["application/pdf", "image/jpeg", "image/png", "application/zip", "application/x-zip-compressed", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  attachment: ["application/pdf", "application/zip", "application/x-zip-compressed", "image/jpeg", "image/png"],
};

const MAX_SIZES: Record<UploadCategory, number> = {
  cv: 5 * 1024 * 1024, // 5MB
  photo: 2 * 1024 * 1024, // 2MB
  task: 50 * 1024 * 1024, // 50MB
  attachment: 50 * 1024 * 1024, // 50MB
};

export function validateFileUpload(
  file: File,
  category: UploadCategory
): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES[category].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES[category].join(", ")}`,
    };
  }
  if (file.size > MAX_SIZES[category]) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_SIZES[category] / 1024 / 1024}MB`,
    };
  }
  return { valid: true };
}

export async function saveFile(
  file: File,
  namespace: string,
  category: UploadCategory
): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  
  // Return a data URI (bypasses Vercel's read-only file system)
  return `data:${file.type};base64,${base64}`;
}

export function getFilePath(relativePath: string): string {
  if (relativePath.startsWith("data:")) return relativePath;
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(UPLOAD_BASE, normalized);
}

export function fileExists(relativePath: string): boolean {
  if (relativePath.startsWith("data:")) return true;
  return fs.existsSync(getFilePath(relativePath));
}

export function deleteFile(relativePath: string): void {
  if (relativePath.startsWith("data:")) return; // Nothing to delete from disk
  const fp = getFilePath(relativePath);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

/**
 * Extract text from a PDF file
 */
export async function extractPdfText(fileUrl: string): Promise<string> {
  let buffer: Buffer;

  if (fileUrl.startsWith("data:")) {
    const base64Data = fileUrl.split(",")[1];
    if (!base64Data) return "";
    buffer = Buffer.from(base64Data, "base64");
  } else {
    const fp = getFilePath(fileUrl);
    if (!fs.existsSync(fp)) return "";
    buffer = fs.readFileSync(fp);
  }
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch {
    return "[CV text could not be extracted — please review the file manually]";
  }
}

