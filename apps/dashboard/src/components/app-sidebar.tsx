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
  Activity,
  Puzzle,
  Users,
  Zap,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { MerchantSwitcher } from "./merchant-switcher";
import { usePathname } from "next/navigation";
import packageJson from "../../package.json";

const navGroups = [
  {
    label: "Core",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: CreditCard, label: "Payments", href: "/dashboard/payments" },
      { icon: Activity, label: "Activity Log", href: "/dashboard/activity" },
      { icon: Wallet, label: "Balances", href: "/dashboard/balances" },
      { icon: Coins, label: "Billing", href: "/dashboard/billing" },
    ],
  },
  {
    label: "Network",
    items: [
      { icon: Zap, label: "Staking", href: "/dashboard/staking" },
      { icon: Puzzle, label: "Ecosystem", href: "/dashboard/ecosystem" },
      { icon: Users, label: "Referrals", href: "/dashboard/referrals" },
      { icon: Code2, label: "Developers", href: "/dashboard/developers" },
    ],
  },
  {
    label: "Management",
    items: [
      { icon: Settings, label: "Settings", href: "/dashboard/settings" },
      { icon: LifeBuoy, label: "Help & Support", href: "/dashboard/support" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0!">
      <SidebarHeader className="border-border/50 flex h-(--header-height) flex-col justify-center border-b px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <MerchantSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-4 overflow-hidden px-2 pb-4 group-data-[collapsible=icon]:px-0">
        <ScrollArea className="h-full pb-4">
          <div className="space-y-4">
            {navGroups.map((group) => (
              <SidebarGroup key={group.label} className="py-0">
                <SidebarGroupLabel className="text-muted-foreground/30 mb-2 truncate px-4 text-[10px] font-bold tracking-wider uppercase group-data-[collapsible=icon]:hidden">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          tooltip={item.label}
                          className="h-9 font-medium"
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
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-border/50 border-t p-3">
        <div className="text-muted-foreground/15 mt-1 truncate text-center text-[10px] font-bold tracking-widest uppercase group-data-[collapsible=icon]:hidden">
          Build v{packageJson.version}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
