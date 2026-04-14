import Link from "next/link";
import { db } from "@/lib/db";
import { clients, clips } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

interface Client {
  id: string;
  name: string;
  slug: string;
  clipCount: number;
}

const avatarColors = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-pink-600",
  "bg-teal-600",
  "bg-orange-600",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

async function getClients(): Promise<Client[]> {
  const result = await db
    .select({
      id: clients.id,
      name: clients.name,
      slug: clients.slug,
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
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <p className="text-muted text-sm mt-1">
          {clientList.length} client{clientList.length !== 1 ? "s" : ""}
        </p>
      </div>

      {clientList.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-muted">No clients yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clientList.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.slug}`}
              className="group bg-surface border border-border rounded-xl p-5 hover:bg-surface-hover hover:border-accent/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${getAvatarColor(client.name)} flex items-center justify-center text-white text-lg font-bold shrink-0`}
                >
                  {client.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-medium truncate group-hover:text-accent transition-colors">
                    {client.name}
                  </h3>
                  <p className="text-muted text-sm">
                    {client.clipCount} clip{client.clipCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
