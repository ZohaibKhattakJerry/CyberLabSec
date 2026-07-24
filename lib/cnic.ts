import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getKey(): Buffer {
  const keyStr = process.env.CNIC_ENCRYPTION_KEY || "default-key-please-change-32char";
  // Pad or truncate to exactly 32 bytes
  return Buffer.from(keyStr.padEnd(32, "0").slice(0, 32), "utf8");
}

export function encryptCNIC(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptCNIC(ciphertext: string): string {
  const key = getKey();
  const [ivHex, encryptedHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function hashCNIC(cnic: string): string {
  // Normalize CNIC: remove dashes, lowercase
  const normalized = cnic.replace(/-/g, "").toLowerCase();
  return crypto.createHash("sha256").update(normalized + "cyberlabsec-salt").digest("hex");
}
