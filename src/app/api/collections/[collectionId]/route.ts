import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/collections/[collectionId] — update name/description
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;

  const [updated] = await db
    .update(collections)
    .set(updates)
    .where(eq(collections.id, collectionId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  return NextResponse.json({ collection: updated });
}

// DELETE /api/collections/[collectionId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collectionId } = await params;

  await db.delete(collections).where(eq(collections.id, collectionId));

  return NextResponse.json({ success: true });
}
