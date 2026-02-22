"use client";

import { TrendingUp, Receipt, CheckCircle2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "../types";

interface OverviewStatsProps {
  data: DashboardStats | null;
  loading: boolean;
}

export function OverviewStats({ data, loading }: OverviewStatsProps) {
  const stats = [
    {
      label: "Total Volume",
      value: data
        ? `$${data.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "$0.00",
      description: "Total confirmed settlement volume",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      label: "Total Invoices",
      value: data ? data.activeInvoices.toLocaleString() : "0",
      description: "All invoices created",
      icon: Receipt,
      color: "text-blue-500",
    },
    {
      label: "Success Rate",
      value: data ? data.successRate : "0.0%",
      description: "Confirmed vs total invoices",
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      label: "Credit Balance",
      value: data
        ? `$${(data.creditBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "$0.00",
      description: "Prepaid platform credits",
      icon: DollarSign,
      color:
        data && (data.creditBalance ?? 0) <= 0
          ? "text-rose-500"
          : data && (data.creditBalance ?? 0) < 3
            ? "text-amber-500"
            : "text-emerald-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="bg-card/40 border-border/50 backdrop-blur-md shadow-sm transition-all hover:bg-card/60 hover:border-primary/30 group"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-tight">
              {stat.label}
            </CardTitle>
            <stat.icon
              className={cn("h-4 w-4 text-muted-foreground", stat.color)}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {loading ? (
                <span className="text-muted-foreground/30">—</span>
              ) : (
                stat.value
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
