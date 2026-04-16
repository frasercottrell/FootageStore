import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collectionClips } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

// GET /api/collections/[collectionId]/clips — list clip IDs in a collection
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId } = await params;

  const rows = await db
    .select({ clipId: collectionClips.clipId })
    .from(collectionClips)
    .where(eq(collectionClips.collectionId, collectionId));

  return NextResponse.json({ clipIds: rows.map((r) => r.clipId) });
}

// POST /api/collections/[collectionId]/clips — add clips to a collection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId } = await params;
  const body = await request.json();
  const { clipIds } = body as { clipIds: string[] };

  if (!clipIds?.length) {
    return NextResponse.json({ error: "clipIds is required" }, { status: 400 });
  }

  // Get existing clips in the collection to avoid duplicates
  const existing = await db
    .select({ clipId: collectionClips.clipId })
    .from(collectionClips)
    .where(eq(collectionClips.collectionId, collectionId));

  const existingSet = new Set(existing.map((e) => e.clipId));
  const newClipIds = clipIds.filter((id) => !existingSet.has(id));

  if (newClipIds.length > 0) {
    await db.insert(collectionClips).values(
      newClipIds.map((clipId) => ({
        collectionId,
        clipId,
      }))
    );
  }

  return NextResponse.json({ added: newClipIds.length, total: existingSet.size + newClipIds.length });
}

// DELETE /api/collections/[collectionId]/clips — remove clips from a collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId } = await params;
  const body = await request.json();
  const { clipIds } = body as { clipIds: string[] };

  if (!clipIds?.length) {
    return NextResponse.json({ error: "clipIds is required" }, { status: 400 });
  }

  await db
    .delete(collectionClips)
    .where(
      and(
        eq(collectionClips.collectionId, collectionId),
        inArray(collectionClips.clipId, clipIds)
      )
    );

  return NextResponse.json({ removed: clipIds.length });
}
