import Link from "next/link";
import { db } from "@/lib/db";
import { clients, clips } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

interface Client {
  id: string;
  name: string;
  slug: string;
  displayName: string | null;
  clipCount: number;
}

async function getClients(): Promise<Client[]> {
  const result = await db
    .select({
      id: clients.id,
      name: clients.name,
      slug: clients.slug,
      displayName: clients.displayName,
      clipCount: count(clips.id),
    })
    .from(clients)
    .leftJoin(clips, eq(clients.id, clips.clientId))
    .groupBy(clients.id)
    .orderBy(clients.name);

  return result;
}

export default async function ClientsPage() {
  const clientList = await getClients();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-fg)" }}>Clients</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
          {clientList.length} client{clientList.length !== 1 ? "s" : ""}
        </p>
      </div>

      {clientList.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-surface)" }}>
            <svg className="w-8 h-8" style={{ color: "var(--color-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p style={{ color: "var(--color-muted)" }}>No clients yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientList.map((client) => {
            const label = client.displayName || client.name;
            return (
              <Link key={client.id} href={`/clients/${client.slug}`} className="fg-tile">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <span className="fg-tile-mark">{label[0].toUpperCase()}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-muted)" }}>
                    {client.clipCount} clip{client.clipCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.015em", margin: 0, lineHeight: 1.2, color: "var(--color-fg)" }}>
                    {label}
                  </p>
                  {client.displayName && (
                    <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "4px 0 0" }}>
                      {client.name}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--color-border)", marginTop: 16 }}>
                  <span className="fg-tile-arrow">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
