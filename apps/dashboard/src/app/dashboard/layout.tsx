import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

import { auth } from "@/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const merchants =
    (session?.user as { merchants?: { id: string; name?: string }[] })
      ?.merchants || [];

  // Get current pathname from headers (since we are in a SC layout)
  // Or, simpler strategy: Just check the merchants count.
  // We can't easily get pathname in SC layout without headers hacks.

  await headers();
  // x-url is often not reliable locally without middleware injection.
  // Instead, let's use a client component wrapper or middleware? No, middleware is best.
  // But since I am here, let's assume if merchants.length === 0, render ONLY onboarding content?
  // No, that messes up the URL structure.

  // Let's use a simple heuristic:
  // If NO merchants, and we render `children`, `children` might be the main dashboard which crashes.
  // So if NO merchants, we should Redirect to /dashboard/onboarding.
  // BUT if we are ALREADY at /dashboard/onboarding, we shouldn't redirect loop.

  // Actually, Middleware is the cleanest place for this.
  // Let's assume I'll add middleware next.
  // For now, I'll just leave the layout as is and focus on the middleware logic?
  // No, user request was "Can't we let user create by their own".
  // The layout wraps everything.

  // Let's modify the layout to conditionally render Sidebar based on merchant existence?
  // If no merchants, maybe hide sidebar?

  const hasMerchants = merchants.length > 0;

  return (
    <div className="flex h-svh flex-col overflow-hidden [--header-height:--spacing(14)]">
      <SidebarProvider
        defaultOpen={hasMerchants}
        className="flex-1 overflow-hidden"
      >
        {hasMerchants && <AppSidebar />}
        <SidebarInset className="flex h-full flex-col overflow-hidden">
          {hasMerchants && <SiteHeader />}
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </ScrollArea>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
