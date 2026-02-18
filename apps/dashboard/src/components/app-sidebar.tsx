"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Key,
  Wallet,
  Zap,
  Plus,
  LifeBuoy,
  Activity,
  Target,
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
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent cursor-default group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shrink-0">
                <Zap className="size-4 fill-current" />
              </div>
              <div className="flex flex-col gap-0.5 group-data-[collapsible=icon]:hidden ml-3 overflow-hidden">
                <span className="font-bold text-sm tracking-tight leading-none text-foreground truncate">
                  TyePay
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-bold tracking-widest leading-none mt-0.5 truncate uppercase">
                  Console
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-4 space-y-2 overflow-hidden group-data-[collapsible=icon]:px-0 px-2">
        <SidebarGroup className="py-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary/5 text-primary hover:bg-primary/10 h-10 shadow-sm transition-all flex items-center gap-2 px-3 border border-primary/10"
              >
                <Plus className="size-4 shrink-0" />
                <span className="font-bold uppercase text-[10px] tracking-widest truncate group-data-[collapsible=icon]:hidden">
                  Quick Create
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

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

      <SidebarFooter className="p-4 border-t-0 flex items-center justify-center">
        <div className="text-[10px] font-bold text-muted-foreground/15 uppercase tracking-widest group-data-[collapsible=icon]:hidden truncate">
          Build v{packageJson.version}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
