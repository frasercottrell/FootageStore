"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Client {
  id: string;
  name: string;
  slug: string;
  displayName: string | null;
  clipCount: number;
}

type Cols = 2 | 3 | 4;
const LS_KEY = "fg-footage-cols";

export default function ClientsGrid({ clients }: { clients: Client[] }) {
  const [cols, setCols] = useState<Cols>(3);

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored === "2" || stored === "3" || stored === "4") setCols(Number(stored) as Cols);
  }, []);

  function setColsAndStore(n: Cols) {
    setCols(n);
    localStorage.setItem(LS_KEY, String(n));
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--color-surface)" }}>
          <svg className="w-8 h-8" style={{ color: "var(--color-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p style={{ color: "var(--color-muted)" }}>No clients yet</p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 16,
        }}
      >
        {clients.map((client) => {
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

      {/* Layout picker */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--color-border)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-muted)", marginRight: 4 }}>
          Layout
        </span>
        {([2, 3, 4] as Cols[]).map((n) => (
          <button
            key={n}
            onClick={() => setColsAndStore(n)}
            style={{
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: cols === n ? 700 : 400,
              background: cols === n ? "var(--color-fg)" : "transparent",
              color: cols === n ? "var(--color-bg)" : "var(--color-fg)",
              border: `1.5px solid ${cols === n ? "var(--color-fg)" : "var(--color-border)"}`,
              borderRadius: 10,
              cursor: "pointer",
              transition: "background 0.14s, color 0.14s, border-color 0.14s",
            }}
          >
            {n} wide
          </button>
        ))}
      </div>
    </>
  );
}
