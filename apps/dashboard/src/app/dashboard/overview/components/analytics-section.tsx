"use client";

import { BarChart3, TrendingUp, Lock, ArrowUpRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import Link from "next/link";
import { DashboardStats } from "../types";

interface AnalyticsSectionProps {
  data: DashboardStats | null;
  loading: boolean;
}

const CURRENCY_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  LTC: "#bfbbbb",
  USDT_ERC20: "#26a17b",
  USDT_POLYGON: "#8247e5",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="border-border/50 bg-background/95 rounded-lg border p-3 shadow-xl backdrop-blur-sm">
        <p className="text-muted-foreground mb-1 text-xs font-semibold">
          {label}
        </p>
        <p className="text-foreground text-sm font-bold">
          $
          {payload[0].value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </p>
      </div>
    );
  }
  return null;
};

function PlanGate({ plan }: { plan: string }) {
  return (
    <div className="border-border/40 bg-muted/10 flex h-full min-h-[200px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
        <Lock className="size-5 text-amber-500" />
      </div>
      <div>
        <p className="text-foreground text-sm font-semibold">
          {plan === "starter" ? "Professional" : "Enterprise"} Feature
        </p>
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          Upgrade your plan to unlock advanced analytics, conversion tracking,
          and currency breakdowns.
        </p>
      </div>
      <Button asChild size="sm" className="gap-1.5 text-xs">
        <Link href="/dashboard/billing" prefetch={false}>
          Upgrade Plan <ArrowUpRight className="size-3" />
        </Link>
      </Button>
    </div>
  );
}

export function AnalyticsSection({ data, loading }: AnalyticsSectionProps) {
  const isPro =
    data?.currentPlan === "professional" || data?.currentPlan === "enterprise";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Conversion Rate Card */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-[10px] font-black tracking-widest uppercase">
              Conversion Rate
            </CardDescription>
            <TrendingUp className="text-muted-foreground/50 size-3.5" />
          </div>
          {loading ? (
            <div className="bg-muted/30 h-8 w-24 animate-pulse rounded" />
          ) : (
            <CardTitle className="text-3xl font-black tracking-tighter">
              {data?.successRate ?? "—"}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">
            {loading
              ? "..."
              : `${data?.confirmedInvoices ?? 0} confirmed / ${data?.activeInvoices ?? 0} total`}
          </p>
        </CardContent>
      </Card>

      {/* Fees Paid Card */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-[10px] font-black tracking-widest uppercase">
              Fees Paid (Total)
            </CardDescription>
            <BarChart3 className="text-muted-foreground/50 size-3.5" />
          </div>
          {loading ? (
            <div className="bg-muted/30 h-8 w-24 animate-pulse rounded" />
          ) : (
            <CardTitle className="text-3xl font-black tracking-tighter">
              ${(data?.feesAccrued?.usd ?? 0).toFixed(2)}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">
            At {((data?.currentFeeRate ?? 0.015) * 100).toFixed(2)}% rate
          </p>
        </CardContent>
      </Card>

      {/* Pending Invoices Card */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-[10px] font-black tracking-widest uppercase">
              Pending
            </CardDescription>
          </div>
          {loading ? (
            <div className="bg-muted/30 h-8 w-16 animate-pulse rounded" />
          ) : (
            <CardTitle className="text-3xl font-black tracking-tighter">
              {data?.pendingInvoices ?? 0}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground/60 text-[10px] font-bold tracking-widest uppercase">
            Awaiting customer payment
          </p>
        </CardContent>
      </Card>

      {/* Currency Breakdown Chart — Pro+ only */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-md lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">
                Revenue by Currency
              </CardTitle>
              <CardDescription className="text-xs">
                Breakdown of confirmed settlement volume per asset.
              </CardDescription>
            </div>
            {!isPro && (
              <Badge
                variant="secondary"
                className="gap-1 border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-500"
              >
                <Lock className="size-3" /> Pro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="h-[220px]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="bg-muted/20 h-full w-full animate-pulse rounded" />
            </div>
          ) : !isPro ? (
            <PlanGate plan={data?.currentPlan ?? "starter"} />
          ) : data?.topCurrencies && data.topCurrencies.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.topCurrencies}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="hsl(var(--muted-foreground))"
                  opacity={0.08}
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="currency"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  width={90}
                  tickFormatter={(v) =>
                    v.replace("_ERC20", "").replace("_POLYGON", " (Poly)")
                  }
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    fill: "hsl(var(--muted-foreground))",
                    opacity: 0.04,
                  }}
                />
                <Bar dataKey="volume" radius={[0, 6, 6, 0]}>
                  {data.topCurrencies.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CURRENCY_COLORS[entry.currency] ?? "hsl(var(--primary))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted-foreground/50 flex h-full items-center justify-center text-sm font-medium">
              No confirmed settlements yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings Summary — Pro+ only */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">
                Fee Savings vs Starter
              </CardTitle>
              <CardDescription className="text-xs">
                How much you save by being on a higher plan.
              </CardDescription>
            </div>
            {!isPro && (
              <Badge
                variant="secondary"
                className="gap-1 border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-500"
              >
                <Lock className="size-3" /> Pro
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="h-[220px]">
          {!isPro ? (
            <PlanGate plan={data?.currentPlan ?? "starter"} />
          ) : (
            <div className="flex h-full flex-col justify-center gap-4">
              {data?.currentPlan === "professional" ||
              data?.currentPlan === "enterprise"
                ? (() => {
                    const starterRate = 0.015;
                    const currentRate = data.currentFeeRate;
                    const savings =
                      (starterRate - currentRate) * data.totalVolume;
                    return (
                      <div className="space-y-3">
                        <div className="border-border/30 bg-muted/10 flex items-center justify-between rounded-lg border p-3">
                          <span className="text-muted-foreground text-xs font-semibold">
                            Your rate
                          </span>
                          <span className="text-foreground text-sm font-bold">
                            {(currentRate * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="border-border/30 bg-muted/10 flex items-center justify-between rounded-lg border p-3">
                          <span className="text-muted-foreground text-xs font-semibold">
                            Starter rate
                          </span>
                          <span className="text-muted-foreground text-sm font-bold">
                            1.50%
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                          <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase">
                            Total Saved
                          </span>
                          <span className="text-sm font-black text-emerald-500">
                            ${savings > 0 ? savings.toFixed(2) : "0.00"}
                          </span>
                        </div>
                      </div>
                    );
                  })()
                : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
