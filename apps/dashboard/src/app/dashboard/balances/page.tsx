"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  Target,
  CreditCard,
  Activity,
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
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import Link from "next/link";

interface MerchantProfile {
  id: string;
  name: string;
  btcXpub: string | null;
  ethAddress: string | null;
  feesAccrued: { usd: number } | null;
}

interface StatsData {
  totalVolume: number;
  activeInvoices: number;
  successRate: string;
  feesAccrued: { usd: number };
  currentFeeRate: number;
}

interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_currency: string;
  status: string;
  created_at: string;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"];

export default function BalancesPage() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [merchantRes, statsRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me"),
        api.get("/v1/merchants/me/stats"),
        api.get("/v1/invoices", { params: { limit: 100 } }),
      ]);
      setMerchant(merchantRes.data);
      setStats(statsRes.data);
      setInvoices(invoicesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyAddress = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const truncate = (addr: string) => {
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  // Analytics derived data
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

  // Daily chart data
  const dailyVolume = invoices.reduce(
    (acc: Record<string, { volume: number; count: number }>, inv) => {
      const date = new Date(inv.created_at).toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (!acc[date]) acc[date] = { volume: 0, count: 0 };
      if (inv.status === "confirmed") acc[date].volume += inv.amount_usd;
      acc[date].count += 1;
      return acc;
    },
    {},
  );
  const chartData = Object.entries(dailyVolume).map(([name, data]) => ({
    name,
    volume: parseFloat(data.volume.toFixed(2)),
  }));

  // Currency breakdown
  const currencyBreakdown = invoices.reduce(
    (acc: Record<string, number>, inv) => {
      if (!acc[inv.crypto_currency]) acc[inv.crypto_currency] = 0;
      acc[inv.crypto_currency] += inv.amount_usd;
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

  // Wallet cards
  const wallets = [];
  if (merchant?.btcXpub) {
    wallets.push({
      id: "btc",
      label: "Bitcoin",
      currency: "BTC / LTC",
      address: merchant.btcXpub,
      type: "HD Wallet (xPub)",
      icon: "₿",
    });
  }
  if (merchant?.ethAddress) {
    wallets.push({
      id: "eth",
      label: "Ethereum",
      currency: "ETH / ERC-20",
      address: merchant.ethAddress,
      type: "Static Address",
      icon: "Ξ",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Balances</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your settlement wallets and performance analytics.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
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
        ].map((stat) => (
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

      {/* Wallets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Settlement Wallets
          </h2>
          <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
            <Link href="/dashboard/settings">Configure</Link>
          </Button>
        </div>

        {wallets.length === 0 ? (
          <Card className="border-dashed border-2 border-border/40">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Wallet className="size-8 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/60 mb-1">
                No wallets configured
              </p>
              <p className="text-xs text-muted-foreground/40 max-w-xs mb-4">
                Add your BTC xPub or ETH address in Settings to receive
                non-custodial payments.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings">Go to Settings</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wallets.map((wallet) => (
              <Card key={wallet.id} className="border shadow-sm group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                        {wallet.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{wallet.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {wallet.currency}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      {wallet.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                    <code className="text-xs font-mono flex-1 truncate text-muted-foreground">
                      {truncate(wallet.address)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => copyAddress(wallet.address, wallet.id)}
                    >
                      {copiedField === wallet.id ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Non-custodial notice */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
          <span>
            Non-custodial — all payments settle directly to your wallets.
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <Card className="lg:col-span-4 border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Settlement Volume
                </CardTitle>
                <CardDescription className="text-xs">
                  Confirmed invoice volume by day
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium">
                {invoices.length} invoices
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="balanceGradient"
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
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#balanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm">
                No volume data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Currency Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Volume by cryptocurrency
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
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
              <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm">
                No invoice data to analyze
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
