import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { clips } from "@/lib/db/schema";
import { eq, ilike, sql, desc, count, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const offset = (page - 1) * limit;

  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }

  const conditions = [eq(clips.clientId, clientId)];
  if (search) {
    conditions.push(ilike(clips.name, `%${search}%`));
  }

  const where = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(clips)
    .where(where);

  const results = await db
    .select()
    .from(clips)
    .where(where)
    .orderBy(desc(clips.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    clips: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
