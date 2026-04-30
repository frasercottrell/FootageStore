import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "FootageStore",
  description: "Internal footage library for Fraggell Productions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.className} h-full antialiased`}>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </head>
      <body className="min-h-full">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
