import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collections, collectionClips } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/collections?clientId=xxx — list collections for a client with clip counts
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const results = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      clientId: collections.clientId,
      createdBy: collections.createdBy,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
      clipCount: sql<number>`(
        SELECT COUNT(*)::int FROM collection_clips
        WHERE collection_clips.collection_id = ${collections.id}
      )`.as("clip_count"),
    })
    .from(collections)
    .where(eq(collections.clientId, clientId))
    .orderBy(collections.name);

  return NextResponse.json({ collections: results });
}

// POST /api/collections — create a new collection
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, clientId, description, clipIds } = body as {
    name: string;
    clientId: string;
    description?: string;
    clipIds?: string[];
  };

  if (!name?.trim() || !clientId) {
    return NextResponse.json({ error: "name and clientId are required" }, { status: 400 });
  }

  const [collection] = await db
    .insert(collections)
    .values({
      name: name.trim(),
      clientId,
      description: description?.trim() || null,
      createdBy: session.user.id,
    })
    .returning();

  // Optionally add initial clips
  if (clipIds && clipIds.length > 0) {
    await db.insert(collectionClips).values(
      clipIds.map((clipId) => ({
        collectionId: collection.id,
        clipId,
      }))
    );
  }

  return NextResponse.json({ collection, clipCount: clipIds?.length || 0 }, { status: 201 });
}
