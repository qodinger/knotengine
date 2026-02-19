"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DashboardStats {
  totalVolume: number;
  activeInvoices: number;
  successRate: string;
  chartData: Array<{ name: string; volume: number }>;
  feesAccrued: { usd: number };
  currentFeeRate: number;
}

interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  status: "pending" | "confirmed" | "expired" | "partially_paid";
  created_at: string;
}

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me/stats"),
        api.get("/v1/invoices", { params: { limit: 5 } }),
      ]);
      setData(statsRes.data);
      setRecentInvoices(invoicesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  if (!mounted) return null;

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
      label: "Fees Accrued",
      value: data
        ? `$${data.feesAccrued.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "$0.00",
      description: `Platform usage fees (${data ? (data.currentFeeRate * 100).toFixed(2) : "0.50"}%)`,
      icon: DollarSign,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-none shadow-none bg-background/50 border"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-none bg-background/50 border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Volume Chart</CardTitle>
                <CardDescription>
                  Confirmed settlement volume over time.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Weekly
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pl-2">
            {data?.chartData && data.chartData.some((d) => d.volume > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chartData}>
                  <defs>
                    <linearGradient
                      id="colorVolume"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.1}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--muted-foreground))"
                    opacity={0.1}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm font-medium">
                No volume data yet. Create and settle invoices to see chart
                data.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Latest invoices from your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Receipt className="size-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm font-medium text-muted-foreground/60">
                  No invoices yet
                </p>
                <p className="text-xs text-muted-foreground/40 mt-1">
                  Create your first invoice to start tracking activity.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {recentInvoices.map((inv) => (
                  <div key={inv.invoice_id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-8 rounded-full flex items-center justify-center shrink-0",
                        inv.status === "confirmed"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : inv.status === "expired"
                            ? "bg-rose-500/10 text-rose-500"
                            : inv.status === "partially_paid"
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-amber-500/10 text-amber-500",
                      )}
                    >
                      {inv.status === "confirmed" ? (
                        <CheckCircle2 className="size-4" />
                      ) : inv.status === "expired" ? (
                        <XCircle className="size-4" />
                      ) : inv.status === "partially_paid" ? (
                        <AlertCircle className="size-4" />
                      ) : (
                        <Clock className="size-4" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <p className="text-xs font-mono font-medium leading-none truncate">
                        {inv.invoice_id}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-[9px] py-0 px-1.5 h-4 font-bold tracking-wider"
                        >
                          {inv.crypto_currency}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-2.5" />
                          {format(new Date(inv.created_at), "MMM d, HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-sm shrink-0">
                      <span
                        className={cn(
                          inv.status === "confirmed"
                            ? "text-emerald-500"
                            : "text-foreground",
                        )}
                      >
                        {inv.status === "confirmed" ? "+" : ""}$
                        {inv.amount_usd.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full justify-between" asChild>
              <Link href="/dashboard/invoices">
                View all invoices
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
