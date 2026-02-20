"use client";

import { useState, useCallback, useEffect } from "react";
import {
  FlaskConical,
  RefreshCw,
  Zap,
  CheckCircle2,
  Copy,
  Plus,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Invoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  pay_address: string;
  status: string;
  created_at: string;
}

export default function TestnetPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [config, setConfig] = useState<{
    btcXpub?: string;
    btcXpubTestnet?: string;
    ethAddress?: string;
    ethAddressTestnet?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [configRes, invoicesRes] = await Promise.all([
        api.get("/v1/merchants/me"),
        api.get("/v1/invoices?status=pending&limit=5"),
      ]);
      setConfig(configRes.data);
      setInvoices(invoicesRes.data.data);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPendingInvoices = async () => {
    try {
      const res = await api.get("/v1/invoices?status=pending&limit=5");
      setInvoices(res.data.data);
    } catch (err) {
      console.error("Failed to fetch pending invoices", err);
    }
  };

  const simulatePayment = async (invoice: Invoice) => {
    setSimulating(invoice.invoice_id);
    try {
      // 1. Simulate Mempool (0 confs)
      await api.post("/v1/webhooks/simulate", {
        invoiceId: invoice.invoice_id,
        txHash: `0x${Math.random().toString(16).slice(2)}${Math.random()
          .toString(16)
          .slice(2)}`,
        amount: invoice.crypto_amount.toString(),
        asset: invoice.crypto_currency,
        confirmations: 0,
      });

      // 2. Simulate Confirming (1 conf) after 3s
      setTimeout(async () => {
        await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash: `0x${Math.random().toString(16).slice(2)}${Math.random()
            .toString(16)
            .slice(2)}`,
          amount: invoice.crypto_amount.toString(),
          asset: invoice.crypto_currency,
          confirmations: 1,
        });
      }, 3000);

      // 3. Simulate Settled (10+ confs) after 6s
      setTimeout(async () => {
        await api.post("/v1/webhooks/simulate", {
          invoiceId: invoice.invoice_id,
          txHash: `0x${Math.random().toString(16).slice(2)}${Math.random()
            .toString(16)
            .slice(2)}`,
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
    // Optimistic check without loading state if config is already present
    if (!config) return;

    try {
      setLoading(true);
      setError(null);

      const availableCurrencies: string[] = [];
      if (config.btcXpub || config.btcXpubTestnet)
        availableCurrencies.push("BTC");
      if (config.ethAddress || config.ethAddressTestnet)
        availableCurrencies.push("ETH");

      if (availableCurrencies.length === 0) {
        setError(
          "Wallet configuration missing. Please add a BTC xPub or ETH Address (Mainnet or Testnet) in Settings to create test invoices.",
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
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="bg-background text-foreground hover:bg-background/80 border-destructive/30"
            >
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-none bg-background/50 border overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <FlaskConical className="size-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Testnet Environment
            </span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Payment Simulator
          </CardTitle>
          <CardDescription>
            Test your integration end-to-end without spending real assets.
            Simulate blockchain events to trigger webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 w-full">
              <h3 className="text-sm font-bold text-amber-500 mb-2 flex items-center gap-2">
                <Zap className="size-4" /> Realistic Simulation
              </h3>
              <p className="text-xs text-muted-foreground/80">
                Simulates a real 3-step payment flow: Mempool &rarr; Confirming
                &rarr; Settled (takes ~6 seconds).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Pending Invoices</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={createTestInvoice}
            disabled={loading}
            className="h-8 text-xs font-bold uppercase tracking-wider gap-2"
          >
            <Plus className="size-3" />
            Create Test Invoice
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPendingInvoices}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-background/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                ID / Created
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Address
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-xs text-muted-foreground"
                >
                  No pending invoices found. Create one to start testing.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow
                  key={inv.invoice_id}
                  className="group hover:bg-muted/30 border-white/5 transition-colors"
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs font-medium text-foreground">
                        {inv.invoice_id}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(inv.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {inv.crypto_amount}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 py-0 font-mono"
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
                    <div className="flex items-center gap-2">
                      <code className="bg-black/20 rounded px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground max-w-[140px] truncate">
                        {inv.pay_address}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          navigator.clipboard.writeText(inv.pay_address)
                        }
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      disabled={
                        simulating === inv.invoice_id ||
                        successId === inv.invoice_id
                      }
                      onClick={() => simulatePayment(inv)}
                      className={cn(
                        "h-8 text-[10px] font-bold uppercase tracking-wider transition-all",
                        successId === inv.invoice_id
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white w-32"
                          : "bg-amber-500 hover:bg-amber-600 text-black w-32",
                      )}
                    >
                      {simulating === inv.invoice_id ? (
                        <>
                          <RefreshCw className="size-3 animate-spin mr-2" />
                          Simulating...
                        </>
                      ) : successId === inv.invoice_id ? (
                        <>
                          <CheckCircle2 className="size-3 mr-2" /> Paid
                        </>
                      ) : (
                        <>
                          <Zap className="size-3 mr-2" /> Simulate Pay
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
