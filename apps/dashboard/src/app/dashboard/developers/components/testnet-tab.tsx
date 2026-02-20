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
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        api.get("/v1/invoices?status=pending&limit=5"),
      ]);
      setConfig(configRes.data);
      setInvoices(invoicesRes.data.data);
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
      const res = await api.get("/v1/invoices?status=pending&limit=5");
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Failed to fetch pending invoices", err);
    }
  };

  const simulatePayment = async (invoice: TestnetInvoice) => {
    setSimulating(invoice.invoice_id);
    try {
      await api.post("/v1/webhooks/simulate", {
        invoiceId: invoice.invoice_id,
        txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
        amount: invoice.crypto_amount.toString(),
        asset: invoice.crypto_currency,
        confirmations: 0,
      });

      setTimeout(async () => {
        await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
          amount: invoice.crypto_amount.toString(),
          asset: invoice.crypto_currency,
          confirmations: 1,
        });
      }, 3000);

      setTimeout(async () => {
        await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
          amount: invoice.crypto_amount.toString(),
          asset: invoice.crypto_currency,
          confirmations: 12,
        });
        setSuccessId(invoice.invoice_id);
        setSimulating(null);
        fetchPendingInvoices();
      }, 6000);
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
      if (config.btcXpub || config.btcXpubTestnet)
        availableCurrencies.push("BTC");
      if (config.ethAddress || config.ethAddressTestnet)
        availableCurrencies.push("ETH");

      if (availableCurrencies.length === 0) {
        setError(
          "Wallet configuration missing. Add a BTC xPub or ETH Address in Settings.",
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
      });
      await fetchPendingInvoices();
    } catch (err) {
      console.error("Failed to create test invoice", err);
    } finally {
      setTestnetLoading(false);
    }
  };

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

      {/* Simulation info */}
      <div className="flex w-full">
        <Card className="border shadow-sm relative overflow-hidden w-full">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-amber-500 mb-1.5 flex items-center gap-2">
              <Zap className="size-4" /> Realistic Simulation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Simulates a 3-step payment flow: Mempool → Confirming → Settled
              (~6 seconds).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending invoices table */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Pending Invoices</h2>
        <div className="flex gap-2">
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
                  <TableCell className="text-right pr-6">
                    <Button
                      size="sm"
                      disabled={
                        simulating === inv.invoice_id ||
                        successId === inv.invoice_id
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
    </div>
  );
}
