import { db } from "@/lib/db";
import { clients, clips } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import ClientsGrid from "@/components/clients/ClientsGrid";

async function getClients() {
  return db
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
      <ClientsGrid clients={clientList} />
    </div>
  );
}
