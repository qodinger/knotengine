"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Zap,
  Filter,
  Download,
  Search,
  Database,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  status: "pending" | "confirmed" | "expired" | "partially_paid";
  confirmations: number;
  required_confirmations: number;
  tx_hash: string | null;
  created_at: string;
  paid_at: string | null;
}

export default function LifecyclePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await api.get("/v1/invoices", {
        params: { limit: 50 },
      });
      setInvoices(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch lifecycle data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Derive metrics from real data
  const confirmedCount = invoices.filter(
    (inv) => inv.status === "confirmed",
  ).length;
  const pendingCount = invoices.filter(
    (inv) => inv.status === "pending",
  ).length;
  const successRate =
    invoices.length > 0
      ? ((confirmedCount / invoices.length) * 100).toFixed(1)
      : "0.0";

  // Convert invoices into lifecycle events
  const events = invoices
    .map((inv) => {
      const eventType =
        inv.status === "confirmed"
          ? "invoice.confirmed"
          : inv.status === "expired"
            ? "invoice.expired"
            : inv.status === "partially_paid"
              ? "invoice.partial"
              : "invoice.created";

      const description =
        inv.status === "confirmed"
          ? `Invoice settled for $${inv.amount_usd.toFixed(2)} (${inv.crypto_amount} ${inv.crypto_currency})`
          : inv.status === "expired"
            ? `Invoice expired — $${inv.amount_usd.toFixed(2)} ${inv.crypto_currency} not received`
            : inv.status === "partially_paid"
              ? `Partial payment received for $${inv.amount_usd.toFixed(2)} invoice`
              : `Invoice created for $${inv.amount_usd.toFixed(2)} in ${inv.crypto_currency}`;

      return {
        id: inv.invoice_id,
        type: eventType,
        status:
          inv.status === "confirmed"
            ? "success"
            : inv.status === "expired"
              ? "error"
              : inv.status === "partially_paid"
                ? "warning"
                : "pending",
        description,
        source: inv.crypto_currency,
        timestamp: inv.paid_at || inv.created_at,
        resourceId: inv.invoice_id,
        txHash: inv.tx_hash,
      };
    })
    .filter(
      (event) =>
        event.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Invoice Lifecycle
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Chronological view of all invoice state changes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2"
            disabled
          >
            <Download className="size-3" />
            Export (Coming Soon)
          </Button>
          <Button
            size="sm"
            className="font-bold uppercase text-[10px] tracking-widest gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
            onClick={fetchInvoices}
          >
            <Activity className="size-3" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Events",
            value: invoices.length.toString(),
            icon: Zap,
            color: "text-blue-500",
          },
          {
            label: "Confirmed",
            value: confirmedCount.toString(),
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
          {
            label: "Pending",
            value: pendingCount.toString(),
            icon: Clock,
            color: "text-amber-500",
          },
          {
            label: "Success Rate",
            value: `${successRate}%`,
            icon: Activity,
            color: "text-primary",
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
                    {loading ? (
                      <span className="text-muted-foreground/30">—</span>
                    ) : (
                      metric.value
                    )}
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
                placeholder="Filter by invoice ID, type, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background/50 border-none transition-all hover:bg-background/80"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 font-bold uppercase text-[10px] tracking-widest"
              disabled
            >
              <Filter className="size-3" />
              Advanced Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="size-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-medium text-muted-foreground/60">
                {loading
                  ? "Loading lifecycle events..."
                  : searchTerm
                    ? "No events match your filter"
                    : "No lifecycle events yet"}
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1">
                {!searchTerm &&
                  !loading &&
                  "Create and process invoices to see their lifecycle here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {events.map((event) => (
                <div
                  key={event.id + event.timestamp}
                  className="p-4 hover:bg-muted/10 transition-colors flex items-start gap-4 group"
                >
                  <div
                    className={cn(
                      "mt-1 size-8 rounded-full flex items-center justify-center shrink-0 border border-border/50",
                      event.status === "success"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : event.status === "error"
                          ? "bg-rose-500/10 text-rose-500"
                          : event.status === "warning"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-primary/10 text-primary",
                    )}
                  >
                    {event.status === "success" ? (
                      <CheckCircle2 className="size-4" />
                    ) : event.status === "error" ? (
                      <XCircle className="size-4" />
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
                          {event.resourceId}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {format(new Date(event.timestamp), "MMM d, HH:mm:ss")}
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
                      {event.txHash && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium cursor-pointer hover:text-primary transition-colors">
                          <ArrowRight className="size-3 text-primary/40" />
                          TX: {event.txHash.slice(0, 10)}...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {events.length > 0 && (
          <CardHeader className="border-t bg-muted/5 py-4 text-center">
            <p className="text-[10px] text-muted-foreground font-medium">
              Showing {events.length} of {invoices.length} events
            </p>
          </CardHeader>
        )}
      </Card>
    </div>
  );
}
