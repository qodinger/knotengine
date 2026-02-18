"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
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
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api, getAuthHeaders } from "@/lib/api";

interface DashboardStats {
  totalVolume: number;
  successRate: string;
  chartData: Array<{ name: string; volume: number }>;
}

export default function DashboardOverview() {
  const [, setLoading] = useState(true);
  const [data, setData] = useState<DashboardStats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/v1/merchants/me/stats", {
        headers: getAuthHeaders(),
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const apiKey =
      typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null;
    if (apiKey) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [fetchStats]);

  if (!mounted) return null;

  const stats = [
    {
      label: "Total Volume",
      value: data
        ? `$${(data.totalVolume as number).toLocaleString()}`
        : "$0.00",
      description: "Trending up this month",
      trend: "+12.5%",
      icon: TrendingUp,
    },
    {
      label: "Active Accounts",
      value: "45,678",
      description: "Strong user retention",
      trend: "+12.5%",
      icon: Users,
    },
    {
      label: "Growth Rate",
      value: "4.5%",
      description: "Steady performance increase",
      trend: "+0.2%",
      icon: Activity,
    },
    {
      label: "Success Rate",
      value: data ? (data.successRate as string) : "0.0%",
      description: "Verification completed",
      trend: "+0.5%",
      icon: CheckCircle2,
    },
  ];

  const apiKey =
    typeof window !== "undefined" ? localStorage.getItem("tp_api_key") : null;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Session Locked</CardTitle>
            <CardDescription>
              Authenticate to access the console.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Authenticate
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/20 text-[10px] font-bold"
                >
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                  {stat.trend}
                </Badge>
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
                <CardTitle>Total Volume</CardTitle>
                <CardDescription>
                  Processed volume in the last 3 months.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Last 3 months
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chartData || []}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
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
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
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
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events from your infrastructure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <ActivityItem
                name="Olivia Martin"
                email="olivia.martin@email.com"
                amount="+$1,999.00"
                initials="OM"
              />
              <ActivityItem
                name="Jackson Lee"
                email="jackson.lee@email.com"
                amount="+$39.00"
                initials="JL"
              />
              <ActivityItem
                name="Isabella Nguyen"
                email="isabella.nguyen@email.com"
                amount="+$299.00"
                initials="IN"
              />
              <ActivityItem
                name="William Kim"
                email="will@email.com"
                amount="+$99.00"
                initials="WK"
              />
              <ActivityItem
                name="Sofia Davis"
                email="sofia.davis@email.com"
                amount="+$39.00"
                initials="SD"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full justify-between" asChild>
              <Link href="/dashboard/lifecycle">
                View all activity
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Network status and performance metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Blockchain Sync</span>
                <span className="font-medium">100%</span>
              </div>
              <Progress value={100} className="h-1 bg-emerald-500/10" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Latency</span>
                <span className="font-medium text-emerald-500">
                  Optimal (42ms)
                </span>
              </div>
              <Progress value={92} className="h-1 bg-emerald-500/10" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Node Stability</span>
                <span className="font-medium">99.9%</span>
              </div>
              <Progress value={99.9} className="h-1 bg-emerald-500/10" />
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Active processing parameters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3 font-medium text-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  Production
                </div>
                <Badge variant="outline">Live</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3 font-medium text-sm">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Testnet
                </div>
                <Badge variant="secondary">Maintenance</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ActivityItem({
  name,
  email,
  amount,
  initials,
}: {
  name: string;
  email: string;
  amount: string;
  initials: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-9 w-9">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium leading-none">{name}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="ml-auto font-medium text-sm">{amount}</div>
    </div>
  );
}
