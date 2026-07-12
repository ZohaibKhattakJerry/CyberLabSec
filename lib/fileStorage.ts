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
  const dir = path.join(UPLOAD_BASE, namespace, category);
  fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
  const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  const filepath = path.join(dir, filename);

  const bytes = await file.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(bytes));

  // Return relative path (never the full server path)
  return `${namespace}/${category}/${filename}`;
}

export function getFilePath(relativePath: string): string {
  // Sanitize to prevent path traversal
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(UPLOAD_BASE, normalized);
}

export function fileExists(relativePath: string): boolean {
  return fs.existsSync(getFilePath(relativePath));
}

export function deleteFile(relativePath: string): void {
  const fp = getFilePath(relativePath);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

/**
 * Extract text from a PDF file (basic - reads as buffer, returns text if possible)
 * For richer extraction, use pdf-parse in a separate worker
 */
export async function extractPdfText(relativePath: string): Promise<string> {
  const fp = getFilePath(relativePath);
  if (!fs.existsSync(fp)) return "";
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const buffer = fs.readFileSync(fp);
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch {
    // Fallback: return empty string — screening will note lack of parseable CV
    return "[CV text could not be extracted — please review the file manually]";
  }
}
