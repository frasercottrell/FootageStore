import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clips } from "@/lib/db/schema";
import { getOriginalPath, ensureDir, getOriginalDir } from "@/lib/storage";
import { getClipQueue } from "@/lib/queue";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("clientId") as string | null;
  const name = formData.get("name") as string | null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const clipId = randomUUID();
  const ext = path.extname(file.name) || ".mp4";
  const originalPath = getOriginalPath(clientId, clipId, ext);

  // Ensure the directory exists
  await ensureDir(getOriginalDir(clientId, clipId));

  // Write the file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(originalPath, buffer);

  // Create clip record
  const [clip] = await db
    .insert(clips)
    .values({
      id: clipId,
      clientId,
      name: name || null,
      originalFilename: file.name,
      mimeType: file.type || "video/mp4",
      fileSize: buffer.length,
      status: "processing",
      originalPath,
      uploadedBy: session.user.id,
    })
    .returning();

  // Enqueue processing job
  const queue = getClipQueue();
  await queue.add("process-clip", { clipId }, { jobId: clipId });

  return NextResponse.json(clip, { status: 201 });
}
