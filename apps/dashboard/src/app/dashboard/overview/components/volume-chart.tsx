"use client";

import { ChevronRight } from "lucide-react";
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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardStats, OverviewPeriod } from "../types";

interface VolumeChartProps {
  data: DashboardStats | null;
  period: OverviewPeriod;
  setPeriod: (period: OverviewPeriod) => void;
}

export function VolumeChart({ data, period, setPeriod }: VolumeChartProps) {
  return (
    <Card className="bg-card/40 border-border/50 shadow-sm backdrop-blur-md lg:col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Volume Chart</CardTitle>
            <CardDescription>
              Confirmed settlement volume over time.
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3">
                {period === "24h"
                  ? "24 Hours"
                  : period === "7d"
                    ? "Last 7 Days"
                    : "Last 30 Days"}
                <ChevronRight className="h-3 w-3 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setPeriod("24h")}>
                24 Hours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod("7d")}>
                Last 7 Days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod("30d")}>
                Last 30 Days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="h-[350px] pl-2">
        {data?.chartData && data.chartData.some((d) => d.volume > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData}>
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
          <div className="text-muted-foreground/50 flex h-full items-center justify-center text-sm font-medium">
            No volume data yet. Create and settle invoices to see chart data.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
