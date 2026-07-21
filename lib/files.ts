// Opslag van geüploade documentbestanden.
// - Met BLOB_READ_WRITE_TOKEN (op Vercel automatisch gezet zodra een Blob-store
//   aan het project gekoppeld is): Vercel Blob. De blob-URL wordt in de state
//   bewaard; downloads lopen via /api/docs/[id] zodat de login-check blijft gelden.
// - Zonder token: lokaal .data/uploads/ (development).
import { promises as fs } from "fs";
import path from "path";
import type { DocFile } from "./store";

const UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function safeName(name: string): string {
  return path.basename(name).replace(/[^\w.\-() ]+/g, "_").slice(0, 120) || "bestand";
}

function localPath(docId: string, fileName: string): string {
  return path.join(UPLOAD_DIR, `${docId}-${safeName(fileName)}`);
}

export async function saveUpload(docId: string, file: File): Promise<DocFile> {
  const name = safeName(file.name);
  const type = file.type || "application/octet-stream";
  const uploadedAt = new Date().toISOString();

  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`docs/${docId}/${name}`, file, {
      access: "public", // URL is onraadbaar; het portal serveert 'm alleen na login
      addRandomSuffix: true,
      contentType: type,
    });
    return { name, size: file.size, type, uploadedAt, url: blob.url };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(localPath(docId, name), buffer);
  return { name, size: buffer.length, type, uploadedAt };
}

export async function deleteUpload(docId: string, file: DocFile): Promise<void> {
  if (file.url) {
    if (blobEnabled()) {
      try {
        const { del } = await import("@vercel/blob");
        await del(file.url);
      } catch {
        // blob bestond al niet meer — geen probleem
      }
    }
    return;
  }
  try {
    await fs.unlink(localPath(docId, file.name));
  } catch {
    // bestand bestond al niet meer — geen probleem
  }
}

/** Lokale variant; voor blob-bestanden wordt file.url gestreamd in de download-route. */
export async function readUpload(docId: string, fileName: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(localPath(docId, fileName));
  } catch {
    return null;
  }
}
