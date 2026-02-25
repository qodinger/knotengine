"use client";

import { Receipt, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentsStatsProps {
  activeTab: string;
  invoicesCount: number;
  confirmedCount: number;
  pendingCount: number;
  totalVolume: number;
  loading: boolean;
}

export function PaymentsStats({
  activeTab,
  invoicesCount,
  confirmedCount,
  pendingCount,
  totalVolume,
  loading,
}: PaymentsStatsProps) {
  const statItems = [
    {
      label: activeTab === "testnet" ? "All test payments" : "All payments",
      value: invoicesCount,
      icon: Receipt,
      color: activeTab === "testnet" ? "text-amber-500" : "text-blue-500",
    },
    {
      label: activeTab === "testnet" ? "Test succeeded" : "Succeeded",
      value: confirmedCount,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      label: activeTab === "testnet" ? "Test pending" : "Pending",
      value: pendingCount,
      icon: Clock,
      color: "text-amber-500",
    },
    {
      label: activeTab === "testnet" ? "Test volume" : "Volume",
      value: `$${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="border-border/40 bg-card/50 flex items-center gap-3 rounded-xl border p-4"
        >
          <div
            className={cn(
              "bg-muted/50 flex size-9 items-center justify-center rounded-lg",
              stat.color,
            )}
          >
            <stat.icon className="size-4" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium">
              {stat.label}
            </p>
            <p className="mt-0.5 text-lg leading-none font-bold tracking-tight">
              {loading ? (
                <span className="text-muted-foreground/30">—</span>
              ) : (
                stat.value
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
