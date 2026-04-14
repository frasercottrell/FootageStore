import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUploadUrl } from "@/lib/gdrive";

/**
 * POST /api/upload/init
 * Creates a resumable upload session on Google Drive.
 * Returns the upload URL that the browser can upload directly to.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { clientId, fileName, mimeType } = body;

  if (!clientId || !fileName) {
    return NextResponse.json({ error: "clientId and fileName are required" }, { status: 400 });
  }

  // Look up client's Drive folder
  const [client] = await db
    .select({ driveFolderId: clients.driveFolderId })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client?.driveFolderId) {
    return NextResponse.json({ error: "Client has no Google Drive folder" }, { status: 400 });
  }

  try {
    const uploadUrl = await getUploadUrl(
      client.driveFolderId,
      fileName,
      mimeType || "video/mp4"
    );

    return NextResponse.json({ uploadUrl });
  } catch (err) {
    console.error("Failed to create upload session:", err);
    return NextResponse.json({ error: "Failed to initialize upload" }, { status: 500 });
  }
}
