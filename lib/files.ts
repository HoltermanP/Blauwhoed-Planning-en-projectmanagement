// Opslag van geüploade documentbestanden.
// Lokaal: .data/uploads/. Let op: op Vercel is het bestandssysteem vluchtig —
// voor productie moet dit naar blob-opslag (bijv. Vercel Blob of S3); zie README.
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

function safeName(name: string): string {
  return path.basename(name).replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "bestand";
}

export function uploadPath(docId: string, fileName: string): string {
  return path.join(UPLOAD_DIR, `${docId}-${safeName(fileName)}`);
}

export async function saveUpload(
  docId: string,
  file: File
): Promise<{ name: string; size: number; type: string; uploadedAt: string }> {
  const name = safeName(file.name);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(uploadPath(docId, name), buffer);
  return {
    name,
    size: buffer.length,
    type: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
  };
}

export async function deleteUpload(docId: string, fileName: string): Promise<void> {
  try {
    await fs.unlink(uploadPath(docId, fileName));
  } catch {
    // bestand bestond al niet meer — geen probleem
  }
}

export async function readUpload(docId: string, fileName: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(uploadPath(docId, fileName));
  } catch {
    return null;
  }
}
