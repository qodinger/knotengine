"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Zap,
  Plus,
  RefreshCw,
  FlaskConical,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CRYPTO_LOGOS } from "@qodinger/knot-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TestnetInvoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  pay_address: string;
  status: string;
  created_at: string;
}

export function TestnetTab() {
  const [invoices, setInvoices] = useState<TestnetInvoice[]>([]);
  const [testnetLoading, setTestnetLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [config, setConfig] = useState<{
    btcXpub?: string;
    btcXpubTestnet?: string;
    ethAddress?: string;
    ethAddressTestnet?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const truncate = (addr: string) => {
    if (!addr) return "";
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || "generic");
    setTimeout(() => setCopied(null), 2000);
  };

  const fetchTestnetData = useCallback(async () => {
    try {
      setTestnetLoading(true);
      const [configRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me"),
        api.get("/v1/invoices?limit=10&include_testnet=true"),
      ]);
      setConfig(configRes.data);
      // Only show active (non-expired, non-confirmed) invoices in the pipeline
      const active = (invoicesRes.data.data as TestnetInvoice[]).filter((inv) =>
        ["pending", "mempool_detected", "confirming"].includes(inv.status),
      );
      setInvoices(active);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setTestnetLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestnetData();
  }, [fetchTestnetData]);

  const fetchPendingInvoices = async () => {
    try {
      const res = await api.get("/v1/invoices?limit=10&include_testnet=true");
      const active = (res.data.data as TestnetInvoice[]).filter((inv) =>
        ["pending", "mempool_detected", "confirming"].includes(inv.status),
      );
      setInvoices(active);
    } catch (err) {
      console.error("Failed to fetch active invoices", err);
    }
  };

  const simulatePayment = async (invoice: TestnetInvoice) => {
    setSimulating(invoice.invoice_id);
    const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;

    // Helper to optimistically update invoice status in local state
    const setInvoiceStatus = (status: string) => {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.invoice_id === invoice.invoice_id ? { ...inv, status } : inv,
        ),
      );
    };

    try {
      // Step 1: Mempool detected (0 confirmations)
      setInvoiceStatus("mempool_detected");
      await api.post("/v1/webhooks/simulate", {
        invoiceId: invoice.invoice_id,
        txHash,
        amount: invoice.crypto_amount.toString(),
        asset: invoice.crypto_currency,
        confirmations: 0,
      });

      // Step 2: Confirming (1 confirmation)
      setTimeout(async () => {
        setInvoiceStatus("confirming");
        await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash,
          amount: invoice.crypto_amount.toString(),
          asset: invoice.crypto_currency,
          confirmations: 1,
        });
      }, 2000);

      // Step 3: Confirmed (enough confirmations)
      setTimeout(async () => {
        setInvoiceStatus("confirmed");
        await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash,
          amount: invoice.crypto_amount.toString(),
          asset: invoice.crypto_currency,
          confirmations: 12,
        });
        setSuccessId(invoice.invoice_id);
        setSimulating(null);
        // After 3s remove the confirmed invoice from the list and refresh
        setTimeout(() => {
          setSuccessId(null);
          fetchPendingInvoices();
        }, 3000);
      }, 5000);
    } catch (err) {
      console.error("Simulation failed", err);
      setSimulating(null);
    }
  };

  const createTestInvoice = async () => {
    if (!config) return;
    try {
      setTestnetLoading(true);
      setError(null);
      const availableCurrencies: string[] = [];
      if (config.btcXpub || config.btcXpubTestnet) {
        availableCurrencies.push("BTC");
      }
      if (config.ethAddress || config.ethAddressTestnet) {
        availableCurrencies.push("ETH");
      }

      if (availableCurrencies.length === 0) {
        setError(
          "Wallet configuration missing. Add a BTC xPub or ETH Address in Settings or generate Testnet Wallets here.",
        );
        return;
      }

      const currency =
        availableCurrencies[
          Math.floor(Math.random() * availableCurrencies.length)
        ];
      await api.post("/v1/invoices", {
        amount_usd: Math.round((10 + Math.random() * 90) * 100) / 100,
        currency,
        is_testnet: true,
      });
      await fetchPendingInvoices();
    } catch (err) {
      console.error("Failed to create test invoice", err);
    } finally {
      setTestnetLoading(false);
    }
  };

  const wallets = [];
  if (config?.btcXpubTestnet) {
    wallets.push({
      id: "btc-testnet",
      label: "Bitcoin (Testnet)",
      currency: "BTC / LTC",
      address: config.btcXpubTestnet,
      type: "Testnet xPub",
      iconUrl: CRYPTO_LOGOS.BTC,
      iconColor: "bg-amber-500",
      iconFallback: "BTC",
    });
  }
  if (config?.ethAddressTestnet) {
    wallets.push({
      id: "eth-testnet",
      label: "Ethereum (Testnet)",
      currency: "ETH / ERC-20",
      address: config.ethAddressTestnet,
      type: "Testnet Address",
      iconUrl: CRYPTO_LOGOS.ETH,
      iconColor: "bg-indigo-500",
      iconFallback: "ETH",
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm">Configuration Required</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-xs">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="bg-background text-foreground hover:bg-background/80 border-destructive/30 text-xs h-7"
            >
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Testnet Wallets Section */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Testnet Wallets</h2>
      </div>

      {wallets.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="size-6 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-muted-foreground/60">
              No Testnet Wallets
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border shadow-sm overflow-hidden mb-8">
          <div className="divide-y divide-border/40">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/10"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="size-10 bg-transparent p-0 shrink-0">
                    <AvatarImage
                      src={wallet.iconUrl}
                      className="object-contain"
                    />
                    <AvatarFallback
                      className={cn(
                        "text-[10px] font-bold text-white",
                        wallet.iconColor,
                      )}
                    >
                      {wallet.iconFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {wallet.label}
                      </p>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium"
                      >
                        {wallet.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {wallet.currency}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 bg-muted/30 p-2 rounded-lg border border-border/30 w-full sm:w-auto">
                  <code className="text-xs font-mono text-muted-foreground truncate flex-1 sm:max-w-xs px-1">
                    {truncate(wallet.address)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => copyToClipboard(wallet.address, wallet.id)}
                  >
                    {copied === wallet.id ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Simulator Section */}
      <div className="flex items-center justify-between mb-4 mt-8">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            Simulation Pipeline
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Zap className="size-3.5 text-amber-500" />
            Simulates a 3-step payment flow: Mempool → Confirming → Settled (~6
            seconds).
          </p>
        </div>
        <div className="flex gap-2 items-start pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={createTestInvoice}
            disabled={testnetLoading}
            className="h-8 text-xs gap-1.5"
          >
            <Plus className="size-3" />
            Create Test Invoice
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPendingInvoices}
            disabled={testnetLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw
              className={cn("size-4", testnetLoading && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/30">
              <TableHead className="w-[180px] text-xs font-medium pl-6">
                Invoice
              </TableHead>
              <TableHead className="text-xs font-medium">Amount</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Address</TableHead>
              <TableHead className="text-right text-xs font-medium pr-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testnetLoading && invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="size-6 text-muted-foreground/20 animate-spin" />
                    <p className="text-xs text-muted-foreground/60 font-medium">
                      Loading testnet invoices...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FlaskConical className="size-6 text-muted-foreground/20" />
                    <p className="text-xs text-muted-foreground/60 font-medium">
                      No pending invoices. Create one to start testing.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow
                  key={inv.invoice_id}
                  className="group hover:bg-muted/5 border-border/20 transition-colors"
                >
                  <TableCell className="pl-6">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-medium">
                        {inv.invoice_id}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(inv.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {inv.crypto_amount}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 px-1 py-0"
                        >
                          {inv.crypto_currency}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        ${inv.amount_usd.toFixed(2)} USD
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <code className="text-[10px] font-mono text-muted-foreground max-w-[140px] truncate">
                        {inv.pay_address}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          copyToClipboard(
                            inv.pay_address,
                            `addr-${inv.invoice_id}`,
                          )
                        }
                      >
                        {copied === `addr-${inv.invoice_id}` ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const isSuccess = successId === inv.invoice_id;
                      const isSimulating = simulating === inv.invoice_id;
                      const s = isSuccess ? "confirmed" : inv.status;
                      const stages: Record<
                        string,
                        { label: string; className: string }
                      > = {
                        pending: {
                          label: "Pending",
                          className:
                            "bg-muted/50 text-muted-foreground border-border/50",
                        },
                        mempool_detected: {
                          label: "Mempool",
                          className:
                            "bg-blue-500/10 text-blue-400 border-blue-500/20",
                        },
                        confirming: {
                          label: "Confirming",
                          className:
                            "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        },
                        confirmed: {
                          label: "Settled ✓",
                          className:
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        },
                      };
                      const stage = stages[s] || stages.pending;
                      return (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold h-5",
                            stage.className,
                            isSimulating && "animate-pulse",
                          )}
                        >
                          {stage.label}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      size="sm"
                      disabled={
                        simulating === inv.invoice_id ||
                        successId === inv.invoice_id ||
                        (inv.status !== "pending" &&
                          simulating !== inv.invoice_id)
                      }
                      onClick={() => simulatePayment(inv)}
                      className={cn(
                        "h-7 text-[10px] font-bold uppercase tracking-wider transition-all w-28",
                        successId === inv.invoice_id
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-amber-500 hover:bg-amber-600 text-black",
                      )}
                    >
                      {simulating === inv.invoice_id ? (
                        <>
                          <RefreshCw className="size-3 animate-spin mr-1.5" />
                          Simulating
                        </>
                      ) : successId === inv.invoice_id ? (
                        <>
                          <CheckCircle2 className="size-3 mr-1.5" /> Paid
                        </>
                      ) : (
                        <>
                          <Zap className="size-3 mr-1.5" /> Simulate
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-center mt-4">
        <Button
          variant="link"
          size="sm"
          asChild
          className="text-muted-foreground text-xs font-medium"
        >
          <Link
            href="/dashboard/payments?tab=testnet"
            className="flex items-center gap-1.5"
          >
            View full test payment history
            <ExternalLink className="size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
