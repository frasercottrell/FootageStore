import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { renameClientFolder, deleteClientFolder } from "@/lib/gdrive";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clientId } = await params;
  const body = await request.json();
  const name = body.name?.trim();
  const displayName = body.displayName !== undefined
    ? (body.displayName?.trim() || null)
    : undefined;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Generate new slug
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check for duplicates (excluding current client)
  const existing = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.slug, slug))
    .limit(1);

  if (existing.length > 0 && existing[0].id !== clientId) {
    return NextResponse.json({ error: "A client with this name already exists" }, { status: 409 });
  }

  const updateData: Record<string, unknown> = { name, slug, updatedAt: new Date() };
  if (displayName !== undefined) updateData.displayName = displayName;

  const [updated] = await db
    .update(clients)
    .set(updateData)
    .where(eq(clients.id, clientId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Rename the Google Drive folder if it exists
  if (updated.driveFolderId) {
    try {
      await renameClientFolder(updated.driveFolderId, name);
    } catch (err) {
      console.error("Failed to rename Google Drive folder:", err);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clientId } = await params;

  // Look up the client first to get the Drive folder ID
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Delete from DB (cascades to clips)
  await db.delete(clients).where(eq(clients.id, clientId));

  // Delete the Google Drive folder if it exists
  if (client.driveFolderId) {
    try {
      await deleteClientFolder(client.driveFolderId);
    } catch (err) {
      console.error("Failed to delete Google Drive folder:", err);
    }
  }

  return NextResponse.json({ success: true });
}
