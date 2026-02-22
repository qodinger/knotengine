"use client";

import { TrendingUp, CreditCard, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsData, Invoice } from "../types";

interface StatsGridProps {
  stats: StatsData | null;
  invoices: Invoice[];
  loading: boolean;
}

export function StatsGrid({ stats, invoices, loading }: StatsGridProps) {
  const confirmedInvoices = invoices.filter(
    (inv) => inv.status === "confirmed",
  );
  const confirmedVolume = confirmedInvoices.reduce(
    (sum, inv) => sum + inv.amount_usd,
    0,
  );
  const avgTicket =
    confirmedInvoices.length > 0
      ? confirmedVolume / confirmedInvoices.length
      : 0;
  const conversionRate =
    invoices.length > 0
      ? ((confirmedInvoices.length / invoices.length) * 100).toFixed(1)
      : "0.0";

  const statItems = [
    {
      label: "Total Volume",
      value: `$${confirmedVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      label: "Avg. Ticket",
      value: `$${avgTicket.toFixed(2)}`,
      icon: CreditCard,
      color: "text-blue-500",
    },
    {
      label: "Conversion",
      value: `${conversionRate}%`,
      icon: Target,
      color: "text-purple-500",
    },
    {
      label: "Platform Fees",
      value: `$${(stats?.feesAccrued?.usd || 0).toFixed(2)}`,
      icon: Activity,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4"
        >
          <div
            className={cn(
              "size-9 rounded-lg flex items-center justify-center bg-muted/50",
              stat.color,
            )}
          >
            <stat.icon className="size-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              {stat.label}
            </p>
            <p className="text-lg font-bold tracking-tight leading-none mt-0.5">
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
