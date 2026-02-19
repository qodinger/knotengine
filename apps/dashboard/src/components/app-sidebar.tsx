"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Key,
  Wallet,
  LifeBuoy,
  Activity,
  Target,
  FlaskConical,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ProjectSwitcher } from "./project-switcher";
import { usePathname } from "next/navigation";
import packageJson from "../../package.json";

const navItems = {
  platform: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Activity, label: "Lifecycle", href: "/dashboard/lifecycle" },
    { icon: Target, label: "Analytics", href: "/dashboard/analytics" },
  ],
  infrastructure: [
    { icon: Receipt, label: "Invoices", href: "/dashboard/invoices" },
    { icon: Wallet, label: "Wallets", href: "/dashboard/wallets" },
    { icon: Key, label: "API Keys", href: "/dashboard/keys" },
    { icon: FlaskConical, label: "Simulate", href: "/dashboard/testnet" },
  ],
  support: [
    { icon: LifeBuoy, label: "Get Help", href: "/dashboard/support" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r-0!">
      <SidebarHeader className="h-(--header-height) flex flex-col justify-center border-b border-border/50 px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <ProjectSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-4 space-y-2 overflow-hidden group-data-[collapsible=icon]:px-0 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground/30 mb-2 truncate group-data-[collapsible=icon]:hidden">
            Core
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.platform.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="font-medium h-9"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground/30 mb-2 truncate group-data-[collapsible=icon]:hidden">
            Infrastructure
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.infrastructure.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="font-medium h-9"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.support.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="font-medium h-9"
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        <div className="text-[10px] font-bold text-muted-foreground/15 uppercase tracking-widest group-data-[collapsible=icon]:hidden truncate text-center mt-1">
          Build v{packageJson.version}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
