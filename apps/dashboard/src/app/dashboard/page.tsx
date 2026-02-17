"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
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

const data = [
  { name: "Mon", volume: 2400 },
  { name: "Tue", volume: 1398 },
  { name: "Wed", volume: 9800 },
  { name: "Thu", volume: 3908 },
  { name: "Fri", volume: 4800 },
  { name: "Sat", volume: 3800 },
  { name: "Sun", volume: 4300 },
];

const stats = [
  {
    label: "Total Volume",
    value: "$12,842.50",
    change: "+12.5%",
    icon: TrendingUp,
    color: "text-neon-blue",
  },
  {
    label: "Active Invoices",
    value: "24",
    change: "+3",
    icon: Activity,
    color: "text-neon-purple",
  },
  {
    label: "Total Merchants",
    value: "1",
    change: "0%",
    icon: Users,
    color: "text-neon-pink",
  },
  {
    label: "Success Rate",
    value: "99.2%",
    change: "+0.4%",
    icon: CreditCard,
    color: "text-green-500",
  },
];

export default function DashboardOverview() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">
          Merchant Console
        </h1>
        <p className="text-white/40 text-sm font-medium">
          Welcome back, Admin. System performance is optimal.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-stat gap-6 stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 border-white/5 group hover:neon-border transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                <stat.icon size={20} />
              </div>
              <div
                className={cn(
                  "flex items-center text-[10px] font-black px-2 py-1 rounded-md bg-white/5",
                  stat.change.startsWith("+")
                    ? "text-green-500"
                    : "text-white/40",
                )}
              >
                {stat.change.startsWith("+") ? (
                  <ArrowUpRight size={10} className="mr-1" />
                ) : (
                  <ArrowDownRight size={10} className="mr-1" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <p className="text-2xl font-black">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-8">
            Volume Over Time
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#ffffff05"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#ffffff40", fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#ffffff40", fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0a0a",
                    border: "1px solid #ffffff10",
                    borderRadius: "12px",
                  }}
                  itemStyle={{ color: "#00f2ff", fontWeight: 800 }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#00f2ff"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 bg-neon-purple/5">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 mb-8">
            System Health
          </h3>
          <div className="space-y-6">
            <HealthIndicator
              label="Blockchain Sync"
              status="Degraded"
              value="98%"
              color="text-yellow-500"
            />
            <HealthIndicator
              label="API Latency"
              status="Optimal"
              value="42ms"
              color="text-green-500"
            />
            <HealthIndicator
              label="Webhook Success"
              status="Optimal"
              value="100%"
              color="text-green-500"
            />
            <HealthIndicator
              label="Redis Cache"
              status="Optimal"
              value="0.2ms"
              color="text-green-500"
            />
          </div>

          <div className="mt-12 pt-8 border-t border-white/5">
            <button className="w-full py-3 glass rounded-xl text-[10px] font-black uppercase tracking-widest hover:neon-border transition-all">
              Run Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthIndicator({
  label,
  status,
  value,
  color,
}: {
  label: string;
  status: string;
  value: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-white/40 uppercase">
          {label}
        </span>
        <span className={cn("text-[10px] font-black uppercase", color)}>
          {status}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn("h-full bg-current", color)}
            style={{ width: value }}
          />
        </div>
        <span className="text-xs font-mono font-bold opacity-60">{value}</span>
      </div>
    </div>
  );
}
