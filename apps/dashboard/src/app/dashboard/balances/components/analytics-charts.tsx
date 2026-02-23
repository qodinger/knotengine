"use client";

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
import { Badge } from "@/components/ui/badge";
import { Invoice } from "../types";

interface AnalyticsChartsProps {
  invoices: Invoice[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"];

export function AnalyticsCharts({ invoices }: AnalyticsChartsProps) {
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      <Card className="border shadow-sm lg:col-span-4">
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
            <div className="text-muted-foreground/40 flex h-full items-center justify-center text-sm">
              No volume data yet
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border shadow-sm lg:col-span-3">
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
            <div className="text-muted-foreground/40 flex h-full items-center justify-center text-sm">
              No invoice data to analyze
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
