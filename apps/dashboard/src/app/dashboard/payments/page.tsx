"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ExternalLink,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Copy,
  Check,
  CreditCard,
  TrendingUp,
  Receipt,
  Info,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { api } from "@/lib/api";

type Invoice = {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  pay_address: string;
  status: "pending" | "confirmed" | "expired" | "partially_paid";
  confirmations: number;
  required_confirmations: number;
  tx_hash: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  metadata?: {
    isTestnet?: boolean;
    network?: string;
  };
};

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [timeline, setTimeline] = useState<
    {
      _id?: string;
      title: string;
      description: string;
      createdAt: string;
      type: string;
    }[]
  >([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (activeTab === "testnet") {
        // Show only testnet invoices
        params.include_testnet = "true";
        params.only_testnet = "true";
      } else {
        if (activeTab !== "all") params.status = activeTab;
      }
      const res = await api.get("/v1/invoices", { params });
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchTimeline = async (invoiceId: string) => {
    setLoadingTimeline(true);
    try {
      const res = await api.get("/v1/merchants/me/notifications", {
        params: { invoiceId, limit: 50 },
      });
      setTimeline(res.data.data);
    } catch (err) {
      console.error("Failed to fetch timeline", err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const openInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    fetchTimeline(invoice.invoice_id);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.crypto_currency.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Computed stats
  const totalVolume = invoices
    .filter((inv) => inv.status === "confirmed")
    .reduce((sum, inv) => sum + inv.amount_usd, 0);
  const confirmedCount = invoices.filter(
    (inv) => inv.status === "confirmed",
  ).length;
  const pendingCount = invoices.filter(
    (inv) => inv.status === "pending",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {activeTab === "testnet" ? "Test Payments" : "Payments"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeTab === "testnet"
            ? "View and manage all simulated testnet transactions."
            : "View and manage all incoming payment invoices."}
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label:
              activeTab === "testnet" ? "All test payments" : "All payments",
            value: invoices.length,
            icon: Receipt,
            color: activeTab === "testnet" ? "text-amber-500" : "text-blue-500",
          },
          {
            label: activeTab === "testnet" ? "Test succeeded" : "Succeeded",
            value: confirmedCount,
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
          {
            label: activeTab === "testnet" ? "Test pending" : "Pending",
            value: pendingCount,
            icon: Clock,
            color: "text-amber-500",
          },
          {
            label: activeTab === "testnet" ? "Test volume" : "Volume",
            value: `$${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            icon: TrendingUp,
            color: "text-emerald-500",
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

      {/* Main Table Card */}
      <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="pb-0 pt-4 px-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Status Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full lg:w-auto"
            >
              <TabsList className="bg-muted/30 h-9">
                <TabsTrigger value="all" className="text-xs font-medium px-3">
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="confirmed"
                  className="text-xs font-medium px-3"
                >
                  Succeeded
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="text-xs font-medium px-3"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="expired"
                  className="text-xs font-medium px-3"
                >
                  Expired
                </TabsTrigger>
                <TabsTrigger
                  value="testnet"
                  className="text-xs font-medium px-3 gap-1.5"
                >
                  <span className="size-1.5 rounded-full bg-yellow-500 shrink-0" />
                  Testnet
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-muted/30 border-none text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/30">
                <TableHead className="w-[220px] text-xs font-medium pl-6">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium">
                  Invoice ID
                </TableHead>
                <TableHead className="text-xs font-medium">Currency</TableHead>
                <TableHead className="text-xs font-medium">Date</TableHead>
                <TableHead className="text-right pr-6 text-xs font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/20">
                    <TableCell className="pl-6">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="size-8 text-muted-foreground/20" />
                      <p className="text-sm font-medium text-muted-foreground/60">
                        No payments found
                      </p>
                      <p className="text-xs text-muted-foreground/40">
                        {searchTerm
                          ? "Try adjusting your search query."
                          : "Payments will appear here when invoices are created."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => (
                  <TableRow
                    key={inv.invoice_id}
                    className="border-b border-border/20 hover:bg-muted/5 transition-colors group cursor-pointer"
                    onClick={() => openInvoiceDetails(inv)}
                  >
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          $
                          {inv.amount_usd.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {inv.crypto_amount} {inv.crypto_currency}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {inv.invoice_id}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(inv.invoice_id, inv.invoice_id)
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copiedId === inv.invoice_id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>
                        {inv.metadata?.isTestnet && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 py-0 px-1 border-yellow-500/20 text-yellow-500 bg-yellow-500/5"
                          >
                            TEST
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5 h-5 font-semibold tracking-wide"
                      >
                        {inv.crypto_currency}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {format(new Date(inv.created_at), "MMM d, HH:mm")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              openInvoiceDetails(inv);
                            }}
                          >
                            <Info className="mr-2 h-3.5 w-3.5" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(inv.invoice_id, inv.invoice_id);
                            }}
                          >
                            <Copy className="mr-2 h-3.5 w-3.5" />
                            Copy invoice ID
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `${process.env.NEXT_PUBLIC_CHECKOUT_URL}/checkout/${inv.invoice_id}`,
                                "_blank",
                              );
                            }}
                          >
                            <ExternalLink className="mr-2 h-3.5 w-3.5" />
                            Open checkout
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {filteredInvoices.length > 0 && (
          <CardFooter className="py-3 px-6 border-t flex items-center justify-between bg-muted/5">
            <p className="text-xs text-muted-foreground">
              Showing {filteredInvoices.length} payment
              {filteredInvoices.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="size-7" disabled>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" disabled>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Invoice Details Sheet */}
      <Sheet
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                Invoice Details
              </Badge>
              {selectedInvoice?.metadata?.isTestnet && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px]">
                  TESTNET
                </Badge>
              )}
            </div>
            <SheetTitle className="text-xl font-bold font-mono">
              {selectedInvoice?.invoice_id}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Created on{" "}
              {selectedInvoice &&
                format(new Date(selectedInvoice.created_at), "PPP 'at' HH:mm")}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            {/* Status & Amount summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
                  Status
                </p>
                <StatusBadge status={selectedInvoice?.status || "pending"} />
              </div>
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">
                  Total Amount
                </p>
                <p className="text-lg font-bold">
                  ${selectedInvoice?.amount_usd.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Crypto Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Payment Info
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm p-3 rounded-lg border border-border/50">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-bold">
                    {selectedInvoice?.crypto_currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 rounded-lg border border-border/50">
                  <span className="text-muted-foreground">Crypto Amount</span>
                  <span className="font-mono">
                    {selectedInvoice?.crypto_amount}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/50">
                  <span className="text-xs text-muted-foreground">
                    Destination Address
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono break-all text-foreground/80">
                      {selectedInvoice?.pay_address}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedInvoice)
                          copyToClipboard(
                            selectedInvoice.pay_address,
                            "side-addr",
                          );
                      }}
                    >
                      {copiedId === "side-addr" ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Activity History
              </h3>

              <div className="relative pl-4 border-l border-border/50 ml-2 space-y-6 pb-2">
                {loadingTimeline ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 size-3 rounded-full bg-muted border-2 border-background" />
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  ))
                ) : (
                  <>
                    {/* Real-time events from notifications */}
                    {timeline.map((event, idx) => (
                      <div key={event._id || idx} className="relative">
                        <div
                          className={cn(
                            "absolute -left-[21px] top-1 size-3 rounded-full border-2 border-background",
                            event.type === "success"
                              ? "bg-emerald-500"
                              : event.type === "error"
                                ? "bg-rose-500"
                                : event.type === "warning"
                                  ? "bg-amber-500"
                                  : "bg-primary",
                          )}
                        />
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold">{event.title}</p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(event.createdAt), "HH:mm:ss")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    ))}

                    {/* Initial Creation Event (Always last in timeline, oldest) */}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 size-3 rounded-full bg-muted-foreground/30 border-2 border-background" />
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold">Invoice Created</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {selectedInvoice &&
                            format(
                              new Date(selectedInvoice.created_at),
                              "HH:mm:ss",
                            )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        System generated invoice for $
                        {selectedInvoice?.amount_usd.toFixed(2)} USD.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            {selectedInvoice?.tx_hash && (
              <Button
                asChild
                className="w-full gap-2 h-10 font-bold uppercase tracking-wider text-[11px]"
                variant="secondary"
              >
                <a
                  href={
                    selectedInvoice.crypto_currency === "BTC"
                      ? `https://mempool.space/tx/${selectedInvoice.tx_hash}`
                      : `https://etherscan.io/tx/${selectedInvoice.tx_hash}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-3" />
                  View on Blockchain
                </a>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const configs: Record<
    string,
    {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      className: string;
    }
  > = {
    pending: {
      label: "Pending",
      icon: Clock,
      className:
        "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10",
    },
    confirmed: {
      label: "Succeeded",
      icon: CheckCircle2,
      className:
        "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10",
    },
    expired: {
      label: "Expired",
      icon: XCircle,
      className:
        "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",
    },
    partially_paid: {
      label: "Incomplete",
      icon: AlertCircle,
      className:
        "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10",
    },
  };

  const config = configs[status] || {
    label: status,
    icon: AlertCircle,
    className: "text-gray-500 bg-gray-100 dark:bg-gray-500/10",
  };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
        config.className,
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}
