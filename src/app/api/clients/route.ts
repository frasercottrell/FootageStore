import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients, clips } from "@/lib/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { createClientFolder } from "@/lib/gdrive";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select({
      id: clients.id,
      name: clients.name,
      slug: clients.slug,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
      clipCount: count(clips.id),
    })
    .from(clients)
    .leftJoin(clips, eq(clients.id, clips.clientId))
    .groupBy(clients.id)
    .orderBy(clients.name);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  try {
    // Create folder in Google Drive
    let driveFolderId: string | null = null;
    try {
      driveFolderId = await createClientFolder(name.trim());
    } catch (driveErr) {
      console.error("Failed to create Google Drive folder:", driveErr);
    }

    const [client] = await db
      .insert(clients)
      .values({ name: name.trim(), slug, driveFolderId })
      .returning();

    return NextResponse.json(client, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "A client with that name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
