"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { Session } from "next-auth";

interface DashboardSidebarWrapperProps {
  children: React.ReactNode;
  session: Session | null;
  hasMerchants: boolean;
}

export function DashboardSidebarWrapper({
  children,
  session,
  hasMerchants,
}: DashboardSidebarWrapperProps) {
  return (
    <SidebarProvider
      defaultOpen={hasMerchants}
      className="flex-1 overflow-hidden"
    >
      <SessionProvider session={session}>
        {hasMerchants && <AppSidebar />}
        <SidebarInset className="flex h-full min-w-0 flex-col overflow-hidden">
          {hasMerchants && <SiteHeader />}
          <ScrollArea className="min-h-0 flex-1 [&_[data-radix-scroll-area-viewport]>div]:block!">
            <main className="min-w-0 p-4 md:p-6 lg:p-8">{children}</main>
          </ScrollArea>
        </SidebarInset>
      </SessionProvider>
    </SidebarProvider>
  );
}
