// Beveiligde download van documentbestanden — voor beheerder én klant.
import { NextRequest, NextResponse } from "next/server";
import { getState } from "@/lib/store";
import { readUpload } from "@/lib/files";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const role = req.cookies.get("portal_role")?.value;
  if (role !== "admin" && role !== "client") {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const { id } = await params;
  const state = await getState();
  const doc = state.docs.find((d) => d.id === id);
  if (!doc?.file) {
    return NextResponse.json({ error: "Geen bestand voor dit document" }, { status: 404 });
  }

  const buffer = await readUpload(doc.id, doc.file.name);
  if (!buffer) {
    return NextResponse.json({ error: "Bestand niet gevonden op de server" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.file.type || "application/octet-stream",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.file.name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
