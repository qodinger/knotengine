import type { Metadata } from "next";
import "./globals.css";

import { Sidebar } from "@/components/Sidebar";
import { CyberpunkBackground } from "@/components/CyberpunkBackground";

export const metadata: Metadata = {
  title: "TyePay | Merchant Console",
  description: "Manage your agentic payment infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground flex min-h-screen overflow-hidden">
        <CyberpunkBackground />
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative p-8">{children}</main>
      </body>
    </html>
  );
}
