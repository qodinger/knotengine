"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Copy,
  Check,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  Terminal,
  FlaskConical,
  Zap,
  CheckCircle2,
  Plus,
  AlertCircle,
  Key,
  Webhook,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

interface TestnetInvoice {
  invoice_id: string;
  amount_usd: number;
  crypto_amount: number;
  crypto_currency: string;
  pay_address: string;
  status: string;
  created_at: string;
}

export default function DevelopersPage() {
  const { data: session, update: updateSession } = useSession();
  const [copied, setCopied] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);
  const [isRotateDialogOpen, setIsRotateDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  // Testnet state
  const [invoices, setInvoices] = useState<TestnetInvoice[]>([]);
  const [testnetLoading, setTestnetLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [config, setConfig] = useState<{
    btcXpub?: string;
    btcXpubTestnet?: string;
    ethAddress?: string;
    ethAddressTestnet?: string;
    webhookUrl?: string;
    webhookSecret?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id || "generic");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRotateKey = async () => {
    setRotating(true);
    try {
      const res = await api.post("/v1/merchants/me/keys");
      await updateSession({ apiKey: res.data.apiKey });
      setNewKey(res.data.apiKey);
      setIsRotateDialogOpen(false);
    } catch (err) {
      console.error("Failed to rotate key:", err);
    } finally {
      setRotating(false);
    }
  };

  // Testnet functions
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Developers</h1>
        <p className="text-muted-foreground text-sm mt-1">
          API keys, testing tools, and integration resources.
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="bg-muted/30 h-9 w-auto">
          <TabsTrigger
            value="api-keys"
            className="text-xs font-medium gap-1.5 px-3"
          >
            <Key className="size-3" />
            API Keys
          </TabsTrigger>

          <TabsTrigger
            value="testnet"
            className="text-xs font-medium gap-1.5 px-3"
          >
            <FlaskConical className="size-3" />
            Simulator
          </TabsTrigger>
          <TabsTrigger
            value="quickstart"
            className="text-xs font-medium gap-1.5 px-3"
          >
            <Terminal className="size-3" />
            Quickstart
          </TabsTrigger>
        </TabsList>

        {/* ─── API KEYS TAB ─── */}
        <TabsContent value="api-keys" className="mt-6 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Standard keys
              </CardTitle>
              <CardDescription className="text-xs">
                These keys authenticate API requests. Secret keys are only
                visible once upon creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5 hover:bg-muted/5">
                    <TableHead className="w-[160px] pl-6 text-xs">
                      Name
                    </TableHead>
                    <TableHead className="text-xs">Token</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-right pr-6 text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="group">
                    <TableCell className="font-medium pl-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Key className="size-3.5 text-muted-foreground" />
                        Secret key
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground tracking-wider text-sm">
                      <div className="flex items-center gap-2">
                        <span>
                          {session?.user?.apiKey
                            ? `knot_sk_...${session.user.apiKey.slice(-4)}`
                            : "knot_sk_********************"}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] uppercase font-bold tracking-wide h-4 px-1"
                        >
                          Live
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs">
                            Actions
                          </DropdownMenuLabel>
                          {session?.user?.apiKey && (
                            <DropdownMenuItem
                              className="text-xs"
                              onClick={() =>
                                copyToClipboard(
                                  session.user.apiKey as string,
                                  "sk",
                                )
                              }
                            >
                              <Copy className="mr-2 h-3.5 w-3.5" />
                              Copy key
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={() => setIsRotateDialogOpen(true)}
                          >
                            <RefreshCw className="mr-2 h-3.5 w-3.5" />
                            Roll key...
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs text-destructive focus:text-destructive">
                            <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                            Revoke key
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TESTNET TAB ─── */}
        <TabsContent value="testnet" className="mt-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm">
                Configuration Required
              </AlertTitle>
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
                  Simulates a 3-step payment flow: Mempool → Confirming →
                  Settled (~6 seconds).
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
                {invoices.length === 0 ? (
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
        </TabsContent>

        {/* ─── QUICKSTART TAB ─── */}
        <TabsContent value="quickstart" className="mt-6 space-y-6">
          <Card className="border shadow-sm bg-slate-950 text-slate-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <CardTitle className="text-sm font-semibold text-slate-50">
                  Create your first invoice
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Use this curl command to test your integration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-sm overflow-x-auto border border-white/10 group relative">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    copyToClipboard(
                      `curl -X POST ${API_BASE_URL}/v1/invoices \\\n  -H "x-api-key: YOUR_KEY" \\\n  -d '{ "amount_usd": 100, "currency": "BTC" }'`,
                      "curl",
                    )
                  }
                >
                  {copied === "curl" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <div className="text-slate-300 leading-relaxed text-xs">
                  <span className="text-pink-400">curl</span> -X POST{" "}
                  {API_BASE_URL}/v1/invoices \<br />
                  &nbsp;&nbsp;-H{" "}
                  <span className="text-emerald-400">
                    &quot;x-api-key: YOUR_KEY&quot;
                  </span>{" "}
                  \<br />
                  &nbsp;&nbsp;-d{" "}
                  <span className="text-emerald-400">
                    &apos;{'{ "amount_usd": 100, "currency": "BTC" }'}&apos;
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-slate-400">
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Documentation &rarr;
                </a>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  API Reference &rarr;
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Webhook example */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Webhook payload
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Example payload sent to your webhook endpoint on payment
                confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-border/30 relative group">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          event: "invoice.confirmed",
                          invoice_id: "inv_abc123",
                          amount_usd: 100.0,
                          crypto_currency: "BTC",
                          tx_hash: "0xabc...",
                          confirmations: 6,
                        },
                        null,
                        2,
                      ),
                      "webhook",
                    )
                  }
                >
                  {copied === "webhook" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <pre className="text-muted-foreground">
                  {JSON.stringify(
                    {
                      event: "invoice.confirmed",
                      invoice_id: "inv_abc123",
                      amount_usd: 100.0,
                      crypto_currency: "BTC",
                      tx_hash: "0xabc...",
                      confirmations: 6,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── DIALOGS ─── */}
      <Dialog open={isRotateDialogOpen} onOpenChange={setIsRotateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roll API Key</DialogTitle>
            <DialogDescription>
              Are you sure? The current key will be invalidated immediately, and
              any applications using it will stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRotateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRotateKey}
              disabled={rotating}
            >
              {rotating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Roll key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Generated</DialogTitle>
            <DialogDescription>
              Copy your new API key now. You will not be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <Input
              readOnly
              value={newKey || ""}
              className="font-mono text-sm"
            />
            <Button
              size="icon"
              variant="secondary"
              onClick={() => newKey && copyToClipboard(newKey, "newkey")}
            >
              {copied === "newkey" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Alert
            variant="default"
            className="bg-amber-500/10 text-amber-600 border-amber-500/20 mb-4"
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm">Save this key</AlertTitle>
            <AlertDescription className="text-xs">
              Store this key in a secure location like a password manager or
              environment variable.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button type="button" onClick={() => setNewKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
