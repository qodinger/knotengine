"use client";

import {
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  Target,
  BarChart3,
  Calendar,
  Download,
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

const MOCK_CHART_DATA = [
  { name: "Mon", volume: 4000, conversion: 2400 },
  { name: "Tue", volume: 3000, conversion: 1398 },
  { name: "Wed", volume: 2000, conversion: 9800 },
  { name: "Thu", volume: 2780, conversion: 3908 },
  { name: "Fri", volume: 1890, conversion: 4800 },
  { name: "Sat", volume: 2390, conversion: 3800 },
  { name: "Sun", volume: 3490, conversion: 4300 },
];

const GEO_DATA = [
  { name: "North America", value: 45 },
  { name: "Europe", value: 30 },
  { name: "Asia", value: 15 },
  { name: "Others", value: 10 },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Performance Analytics
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Deep insights into payment conversion and merchant growth.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2"
          >
            <Calendar className="size-3" />
            Custom Range
          </Button>
          <Button
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2"
          >
            <Download className="size-3" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Avg. Ticket Size",
            value: "$420.50",
            trend: "+2.5%",
            icon: CreditCard,
          },
          {
            label: "Conversion Rate",
            value: "88.2%",
            trend: "+5.1%",
            icon: Target,
          },
          { label: "Churn Rate", value: "0.24%", trend: "-0.5%", icon: Users },
          {
            label: "Velocity",
            value: "1.2k/hr",
            trend: "+12.2%",
            icon: Activity,
          },
        ].map((stat) => (
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
                {stat.value}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <span
                  className={
                    stat.trend.startsWith("+")
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }
                >
                  {stat.trend}
                </span>
                <span className="text-muted-foreground/40 uppercase tracking-widest font-medium">
                  vs prev 30d
                </span>
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
                <CardTitle className="text-lg">Conversion Funnel</CardTitle>
                <CardDescription>
                  Visualizing checkout engagement vs successful settlement.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="font-bold uppercase text-[9px] tracking-widest"
              >
                Live Flow
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_CHART_DATA}>
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
                <Area
                  type="monotone"
                  dataKey="conversion"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle className="text-lg">Geographic Density</CardTitle>
            <CardDescription>Top regions by settlement volume.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={GEO_DATA}
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
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {GEO_DATA.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Growth Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Based on the last 90 days of ledger entries, your merchant
              ecosystem is expanding at a rate of
              <span className="font-bold mx-1 text-emerald-500">
                12.5% Month-over-Month
              </span>
              . The primary driver is recurring cross-border settlements in{" "}
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary py-0 h-4 font-bold"
              >
                USDT-Polygon
              </Badge>
              .
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-none bg-background/50 border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Optimization Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Switching your treasury sweep frequency from 24h to 6h during peak
              APAC trading windows could reduce slippage by
              <span className="font-bold mx-1 text-primary underline decoration-primary/30">
                0.45%
              </span>
              . Review your liquidity pool settings in the{" "}
              <span className="font-bold text-foreground">Wallets</span> tab.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
