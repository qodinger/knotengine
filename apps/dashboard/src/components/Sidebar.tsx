"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Settings,
  Key,
  Wallet,
  LogOut,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import packageJson from "../../package.json";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Receipt, label: "Invoices", href: "/dashboard/invoices" },
  { icon: Wallet, label: "Wallets", href: "/dashboard/wallets" },
  { icon: Key, label: "API Keys", href: "/dashboard/keys" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col pt-8">
      <div className="px-8 mb-12">
        <div className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-purple flex items-center justify-center">
            <Zap size={18} className="text-black fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-neon-purple">Tye</span>
              <span className="opacity-80">Pay</span>
            </div>
            <div className="text-[8px] font-black opacity-30 mt-0.5 tracking-[0.2em]">
              v{packageJson.version}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
              pathname === item.href
                ? "bg-neon-purple/10 text-neon-purple neon-border"
                : "text-white/40 hover:text-white/80 hover:bg-white/5",
            )}
          >
            <item.icon
              size={18}
              className={cn(
                "transition-colors",
                pathname === item.href
                  ? "text-neon-purple"
                  : "group-hover:text-white",
              )}
            />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
