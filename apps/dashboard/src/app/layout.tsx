import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/site-header";
import React from "react";

export const metadata: Metadata = {
  title: "TyePay | Merchant Console",
  description: "Manage your non-custodial payment infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <TooltipProvider>
          <div className="[--header-height:calc(--spacing(14))]">
            <SidebarProvider>
              <AppSidebar />
              <div className="flex flex-1 flex-col overflow-hidden">
                <SiteHeader />
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                  {children}
                </main>
              </div>
            </SidebarProvider>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
