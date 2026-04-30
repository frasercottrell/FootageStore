"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  {
    href: "/clients",
    label: "Clients",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

const adminItems = [
  {
    href: "/admin/clients",
    label: "Manage Clients",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-56 flex flex-col z-20"
      style={{ background: "#141414", borderRight: "1px solid #232323" }}
    >
      <div className="px-4 py-3.5 flex items-center" style={{ borderBottom: "1px solid #232323" }}>
        <span className="font-display font-semibold leading-none" style={{ fontSize: 17, letterSpacing: "-0.015em", color: "#ffffff" }}>Fraggell</span>
        <span className="font-display font-semibold leading-none" style={{ fontSize: 17, color: "#C60D60" }}>.</span>
        <span className="font-display font-medium leading-none" style={{ fontSize: 17, letterSpacing: "-0.015em", color: "#8F8F8F" }}>footage</span>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <a
          href="https://hub.fraggell.com"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: "#8F8F8F" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; (e.currentTarget as HTMLAnchorElement).style.background = "#1f1f1f"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#8F8F8F"; (e.currentTarget as HTMLAnchorElement).style.background = ""; }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Fraggell Hub
        </a>
        <div style={{ borderTop: "1px solid #232323", margin: "4px 0" }} />
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname.startsWith(item.href)
                ? "text-white"
                : "text-[#8F8F8F] hover:text-white hover:bg-[#1f1f1f]"
            }`}
            style={pathname.startsWith(item.href) ? { background: "#C60D60" } : {}}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <span className="px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#404040" }}>
                Admin
              </span>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname.startsWith(item.href)
                    ? "text-white bg-[#1f1f1f]"
                    : "text-[#8F8F8F] hover:text-white hover:bg-[#1f1f1f]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <button
              onClick={async () => {
                setSyncing(true);
                setSyncResult(null);
                try {
                  const res = await fetch("/api/sync", { method: "POST" });
                  const data = await res.json();
                  const parts = [];
                  if (data.clientsCreated) parts.push(`+${data.clientsCreated} clients`);
                  if (data.clipsCreated) parts.push(`+${data.clipsCreated} clips`);
                  if (data.clientsRemoved) parts.push(`-${data.clientsRemoved} clients`);
                  if (data.clipsRemoved) parts.push(`-${data.clipsRemoved} clips`);
                  setSyncResult(parts.length > 0 ? parts.join(", ") : "Up to date");
                  if (parts.length > 0) window.location.reload();
                  setTimeout(() => setSyncResult(null), 4000);
                } catch {
                  setSyncResult("Sync failed");
                  setTimeout(() => setSyncResult(null), 4000);
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[#1f1f1f] w-full disabled:opacity-50"
              style={{ color: "#8F8F8F" }}
            >
              <svg className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? "Syncing..." : "Sync Drive"}
            </button>
            {syncResult && (
              <div
                className={`mx-1 mt-1 flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs leading-snug ${
                  syncResult === "Sync failed"
                    ? "bg-red-500/10 border border-red-500/20 text-red-300"
                    : syncResult === "Up to date"
                      ? "bg-white/5 border border-white/10 text-neutral-300"
                      : "text-[#C60D60]"
                }`}
                style={syncResult !== "Sync failed" && syncResult !== "Up to date" ? { background: "rgba(198,13,96,0.15)", border: "1px solid rgba(198,13,96,0.3)" } : {}}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {syncResult === "Sync failed" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  )}
                </svg>
                <span className="break-words">{syncResult}</span>
              </div>
            )}
          </>
        )}
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid #232323" }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" style={{ background: "#C60D60" }}>
            {session?.user?.name?.[0] || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name}</p>
            <p className="text-xs truncate capitalize" style={{ color: "#737373" }}>{session?.user?.role}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button onClick={() => signOut()} style={{ color: "#737373" }} className="hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
