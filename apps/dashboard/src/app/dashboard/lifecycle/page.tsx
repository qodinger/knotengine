"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Webhook,
  Database,
  ShieldCheck,
  Zap,
  Filter,
  Download,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MOCK_EVENTS = [
  {
    id: "evt_1",
    type: "webhook.sent",
    status: "success",
    description: "Payment confirmation sent to merchant endpoint",
    source: "System Core",
    timestamp: "2024-02-18T10:45:00Z",
    resourceId: "inv_9k2m...x91",
  },
  {
    id: "evt_2",
    type: "settlement.initiated",
    status: "pending",
    description: "Cold storage sweep initiated to Treasury Wallet",
    source: "Liquidity Engine",
    timestamp: "2024-02-18T10:30:12Z",
    resourceId: "wlt_main_01",
  },
  {
    id: "evt_3",
    type: "security.audit",
    status: "success",
    description: "New API Key provisioned with scoped permissions",
    source: "Auth Module",
    timestamp: "2024-02-18T09:15:45Z",
    resourceId: "key_live_...4f2",
  },
  {
    id: "evt_4",
    type: "system.alert",
    status: "warning",
    description: "Spike in network fees detected on Ethereum Mainnet",
    source: "Chain Watcher",
    timestamp: "2024-02-18T08:00:00Z",
    resourceId: "net_eth_01",
  },
  {
    id: "evt_5",
    type: "invoice.created",
    status: "success",
    description: "Dynamic payment request generated for checkout session",
    source: "API Interface",
    timestamp: "2024-02-18T07:45:30Z",
    resourceId: "inv_z01p...a7b",
  },
];

export default function LifecyclePage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            System Lifecycle
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Real-time operational audit log and event streaming.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2"
          >
            <Download className="size-3" />
            Export Audit
          </Button>
          <Button
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
          >
            <Activity className="size-3" />
            Live Stream
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Throughput",
            value: "142 req/s",
            icon: Zap,
            color: "text-blue-500",
          },
          {
            label: "Event Health",
            value: "99.98%",
            icon: ShieldCheck,
            color: "text-emerald-500",
          },
          {
            label: "DB Latency",
            value: "12ms",
            icon: Database,
            color: "text-amber-500",
          },
          {
            label: "Active Hooks",
            value: "1,204",
            icon: Webhook,
            color: "text-purple-500",
          },
        ].map((metric) => (
          <Card
            key={metric.label}
            className="bg-background/20 border-border/50 shadow-none"
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg bg-background/50 border border-border/30",
                    metric.color,
                  )}
                >
                  <metric.icon className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {metric.label}
                  </p>
                  <p className="text-xl font-bold tracking-tight">
                    {metric.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-none bg-background/50 border overflow-hidden">
        <CardHeader className="border-b bg-muted/10 pb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                placeholder="Filter by event type, ID, or source..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 border-none transition-all hover:bg-background/80"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 font-bold uppercase text-[10px] tracking-widest"
            >
              <Filter className="size-3" />
              Advanced Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {MOCK_EVENTS.map((event) => (
              <div
                key={event.id}
                className="p-4 hover:bg-muted/10 transition-colors flex items-start gap-4 group"
              >
                <div
                  className={cn(
                    "mt-1 size-8 rounded-full flex items-center justify-center shrink-0 border border-border/50",
                    event.status === "success"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : event.status === "warning"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-primary/10 text-primary",
                  )}
                >
                  {event.status === "success" ? (
                    <CheckCircle2 className="size-4" />
                  ) : event.status === "warning" ? (
                    <AlertCircle className="size-4" />
                  ) : (
                    <Clock className="size-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold uppercase tracking-wider py-0 px-2 h-4 border-muted/50 text-muted-foreground bg-muted/10"
                      >
                        {event.type}
                      </Badge>
                      <span className="text-xs font-bold font-mono text-primary/80 group-hover:text-primary transition-colors cursor-pointer">
                        {event.id}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground/90 mb-1 truncate">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                      <Database className="size-3" />
                      {event.source}
                    </div>
                    {event.resourceId && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium cursor-pointer hover:text-primary transition-colors">
                        <ArrowRight className="size-3 text-primary/40" />
                        Ref: {event.resourceId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardHeader className="border-t bg-muted/5 py-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            Load More History
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
