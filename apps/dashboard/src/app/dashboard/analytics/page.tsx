"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  CreditCard,
  Activity,
  Target,
  Calendar,
  Download,
  Receipt,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_currency: string;
  status: string;
  created_at: string;
}

interface StatsData {
  totalVolume: number;
  activeInvoices: number;
  successRate: string;
  feesAccrued: { usd: number };
  currentFeeRate: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me/stats"),
        api.get("/v1/invoices", { params: { limit: 100 } }),
      ]);
      setStats(statsRes.data);
      setInvoices(invoicesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch analytics data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive analytics from real invoice data
  const confirmedInvoices = invoices.filter(
    (inv) => inv.status === "confirmed",
  );
  const pendingInvoices = invoices.filter((inv) => inv.status === "pending");
  const expiredInvoices = invoices.filter((inv) => inv.status === "expired");

  const avgTicketSize =
    confirmedInvoices.length > 0
      ? confirmedInvoices.reduce((sum, inv) => sum + inv.amount_usd, 0) /
        confirmedInvoices.length
      : 0;

  const conversionRate =
    invoices.length > 0
      ? ((confirmedInvoices.length / invoices.length) * 100).toFixed(1)
      : "0.0";

  const expiredRate =
    invoices.length > 0
      ? ((expiredInvoices.length / invoices.length) * 100).toFixed(2)
      : "0.00";

  // Group invoices by day for chart
  const dailyVolume = invoices.reduce(
    (acc: Record<string, { volume: number; count: number }>, inv) => {
      const date = new Date(inv.created_at).toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (!acc[date]) acc[date] = { volume: 0, count: 0 };
      if (inv.status === "confirmed") {
        acc[date].volume += inv.amount_usd;
      }
      acc[date].count += 1;
      return acc;
    },
    {},
  );

  const chartData = Object.entries(dailyVolume).map(([name, data]) => ({
    name,
    volume: parseFloat(data.volume.toFixed(2)),
    count: data.count,
  }));

  // Group by currency
  const currencyBreakdown = invoices.reduce(
    (acc: Record<string, number>, inv) => {
      const currency = inv.crypto_currency;
      if (!acc[currency]) acc[currency] = 0;
      acc[currency] += inv.amount_usd;
      return acc;
    },
    {},
  );

  const currencyData = Object.entries(currencyBreakdown)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }))
    .sort((a, b) => b.value - a.value);

  const metricCards = [
    {
      label: "Avg. Ticket Size",
      value: `$${avgTicketSize.toFixed(2)}`,
      description: `from ${confirmedInvoices.length} confirmed invoices`,
      icon: CreditCard,
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      description: `${confirmedInvoices.length} of ${invoices.length} invoices`,
      icon: Target,
    },
    {
      label: "Expiry Rate",
      value: `${expiredRate}%`,
      description: `${expiredInvoices.length} expired invoices`,
      icon: Activity,
    },
    {
      label: "Pending",
      value: pendingInvoices.length.toString(),
      description: "invoices awaiting payment",
      icon: Receipt,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Performance Analytics
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Insights derived from your real invoice data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2"
          >
            <Calendar className="size-3" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2"
            disabled
          >
            <Download className="size-3" />
            Export (Coming Soon)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metricCards.map((stat) => (
          <Card
            key={stat.label}
            className="bg-background/20 border-border/50 shadow-none"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight mb-1">
                {loading ? (
                  <span className="text-muted-foreground/30">—</span>
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">
                {stat.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <Card className="lg:col-span-4 border-none shadow-none bg-background/50 border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Settlement Volume</CardTitle>
                <CardDescription>
                  Confirmed invoice volume by day.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="font-bold uppercase text-[9px] tracking-widest"
              >
                {invoices.length} Invoices
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
                    stroke="var(--border)"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      fontSize: "12px",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm font-medium">
                No confirmed invoices yet. Settle invoices to see volume data.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle className="text-lg">Currency Breakdown</CardTitle>
            <CardDescription>
              Volume distribution by cryptocurrency.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {currencyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currencyData}
                  layout="vertical"
                  margin={{ left: -20, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--border)"
                    opacity={0.3}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.1 }}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      fontSize: "12px",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [
                      `$${Number(value ?? 0).toFixed(2)}`,
                      "Volume",
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {currencyData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/50 text-sm font-medium">
                No invoice data to analyze yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Volume Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stats ? (
                <>
                  Your total confirmed settlement volume is{" "}
                  <span className="font-bold text-emerald-500">
                    $
                    {stats.totalVolume.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>{" "}
                  across{" "}
                  <span className="font-bold text-foreground">
                    {confirmedInvoices.length}
                  </span>{" "}
                  confirmed invoices with a conversion rate of{" "}
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary py-0 h-4 font-bold"
                  >
                    {conversionRate}%
                  </Badge>
                  .
                </>
              ) : (
                "Loading analytics summary..."
              )}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Fee Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {stats ? (
                <>
                  Platform fees accrued to date:{" "}
                  <span className="font-bold text-primary">
                    ${stats.feesAccrued.usd.toFixed(2)}
                  </span>{" "}
                  at the standard rate of{" "}
                  <span className="font-bold text-foreground">
                    {(stats.currentFeeRate * 100).toFixed(2)}%
                  </span>{" "}
                  per confirmed settlement. Fees are deducted automatically from
                  each invoice upon confirmation.
                </>
              ) : (
                "Loading fee data..."
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
