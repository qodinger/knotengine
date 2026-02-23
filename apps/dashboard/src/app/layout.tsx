import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import React from "react";

export const metadata: Metadata = {
  title: {
    default: "KnotEngine | Merchant Console",
    template: "%s | KnotEngine",
  },
  description:
    "Non-custodial payment infrastructure for modern commerce. Manage your crypto settlements with ultra-secure HD derivation.",
  keywords: [
    "crypto payments",
    "non-custodial",
    "payment gateway",
    "bitcoin",
    "ethereum",
    "merchant console",
  ],
  authors: [{ name: "KnotEngine Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dashboard.knotengine.com",
    siteName: "KnotEngine Dashboard",
    title: "KnotEngine | Merchant Console",
    description: "Enterprise-grade non-custodial payment infrastructure.",
    images: [
      {
        url: "/og-image.png", // We should probably add this later
        width: 1200,
        height: 630,
        alt: "KnotEngine Merchant Console",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KnotEngine | Merchant Console",
    description: "Non-custodial payment infrastructure for modern commerce.",
    images: ["/og-image.png"],
    creator: "@knotengine",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="bg-background text-foreground min-h-screen antialiased"
        suppressHydrationWarning
      >
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
