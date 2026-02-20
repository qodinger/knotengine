"use client";

import * as React from "react";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Code2,
  Coins,
  Settings,
  LifeBuoy,
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
import { StoreSwitcher } from "./store-switcher";
import { usePathname } from "next/navigation";
import packageJson from "../../package.json";

const navItems = {
  core: [
    { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
    { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
    { icon: Wallet, label: "Balances", href: "/dashboard/balances" },
    { icon: Coins, label: "Billing", href: "/dashboard/billing" },
    { icon: Code2, label: "Developers", href: "/dashboard/developers" },
  ],
  manage: [
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    { icon: LifeBuoy, label: "Get Help", href: "/dashboard/support" },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0!">
      <SidebarHeader className="h-(--header-height) flex flex-col justify-center border-b border-border/50 px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <StoreSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-4 space-y-2 overflow-hidden group-data-[collapsible=icon]:px-0 px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 font-bold text-[10px] uppercase tracking-wider text-muted-foreground/30 mb-2 truncate group-data-[collapsible=icon]:hidden">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.core.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
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
              {navItems.manage.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
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
