"use client";

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
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NETWORK_CONFIG } from "@qodinger/knot-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTestnet } from "../hooks/use-testnet";
import { TestnetInvoice } from "../types";

export function TestnetTab() {
  const {
    invoices,
    testnetLoading,
    simulating,
    successId,
    config,
    error,
    copied,
    simulatePayment,
    createTestInvoice,
    fetchPendingInvoices,
    copyToClipboard,
  } = useTestnet();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createAmount, setCreateAmount] = useState("10.00");
  const [createCurrency, setCreateCurrency] = useState("BTC");

  const [simulateInvoice, setSimulateInvoice] = useState<TestnetInvoice | null>(
    null,
  );
  const [simulateAmount, setSimulateAmount] = useState("");

  const truncate = (addr: string) => {
    if (!addr) return "";
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  const wallets: Array<{
    id: string;
    label: string;
    currency: string;
    address: string;
    type: string;
    iconUrl: string;
    iconColor: string;
    iconFallback: string;
  }> = [];
  if (config?.btcXpubTestnet) {
    wallets.push({
      id: "btc-testnet",
      label: "Bitcoin (Testnet)",
      currency: "BTC / LTC",
      address: config.btcXpubTestnet,
      type: "Testnet xPub",
      iconUrl: NETWORK_CONFIG.BTC[0].iconUrl,
      iconColor: NETWORK_CONFIG.BTC[0].iconColor,
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
      iconUrl: NETWORK_CONFIG.ETH[0].iconUrl,
      iconColor: NETWORK_CONFIG.ETH[0].iconColor,
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
              className="bg-background text-foreground hover:bg-background/80 border-destructive/30 h-7 text-xs"
            >
              <Link href="/dashboard/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Testnet Wallets Section */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Testnet Wallets</h2>
      </div>

      {wallets.length === 0 ? (
        <Card className="bg-muted/5 border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldCheck className="text-muted-foreground/30 mb-2 size-6" />
            <p className="text-muted-foreground/60 text-sm font-medium">
              No Testnet Wallets
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8 flex flex-col gap-2">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className="bg-card flex flex-col justify-between gap-4 rounded-xl border p-3 shadow-sm sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 items-center gap-4">
                <Avatar className="size-10 shrink-0 bg-transparent p-0">
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
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {wallet.label}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      {wallet.type}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-muted-foreground text-xs whitespace-nowrap">
                      {wallet.currency}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 border-border/30 flex w-full shrink-0 items-center gap-2 rounded-lg border p-2 sm:w-auto">
                <code className="text-muted-foreground flex-1 truncate px-1 font-mono text-xs sm:max-w-xs">
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
      )}

      {/* Simulator Section */}
      <div className="mt-8 mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            Simulation Pipeline
          </h2>
          <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
            <Zap className="size-3.5 text-amber-500" />
            Simulates a 3-step payment flow: Mempool → Confirming → Settled (~6
            seconds).
          </p>
        </div>
        <div className="flex items-start gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (wallets.length > 0) {
                setCreateCurrency(wallets[0].iconFallback);
                setShowCreateDialog(true);
              }
            }}
            disabled={testnetLoading || wallets.length === 0}
            className="h-8 gap-1.5 text-xs"
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

      <Card className="gap-0 overflow-hidden border py-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border/30 h-12 hover:bg-transparent">
                <TableHead className="w-45 pl-6 text-[10px] font-bold tracking-wider uppercase">
                  Invoice
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider uppercase">
                  Amount
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider uppercase">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-bold tracking-wider uppercase">
                  Address
                </TableHead>
                <TableHead className="pr-6 text-right text-[10px] font-bold tracking-wider uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testnetLoading && invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/30 flex size-12 items-center justify-center rounded-full">
                        <RefreshCw className="text-muted-foreground/20 size-6 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-semibold">
                          Loading...
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Loading testnet invoices...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-muted/30 flex size-12 items-center justify-center rounded-full">
                        <FlaskConical className="text-muted-foreground/20 size-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-semibold">
                          No pending invoices
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Create one to start testing.
                        </p>
                      </div>
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
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(inv.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {inv.crypto_amount}
                          </span>
                          <Badge
                            variant="secondary"
                            className="h-4 px-1 py-0 text-[10px]"
                          >
                            {inv.crypto_currency}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground text-[10px]">
                          ${inv.amount_usd.toFixed(2)} USD
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="text-muted-foreground max-w-35 truncate font-mono text-[10px]">
                          {inv.pay_address}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
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
                          partially_paid: {
                            label: "Partial",
                            className:
                              "bg-amber-500/10 text-amber-500 border-amber-500/20",
                          },
                          overpaid: {
                            label: "Overpaid",
                            className:
                              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                          },
                        };
                        const stage = stages[s] || stages.pending;
                        return (
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 text-[10px] font-bold",
                              stage.className,
                              isSimulating && "animate-pulse",
                            )}
                          >
                            {stage.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => {
                            const checkoutUrl =
                              process.env.NEXT_PUBLIC_CHECKOUT_URL ||
                              "https://checkout.knotengine.com";
                            window.open(
                              `${checkoutUrl}/checkout/${inv.invoice_id}`,
                              "_blank",
                            );
                          }}
                        >
                          <ExternalLink className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          disabled={
                            simulating === inv.invoice_id ||
                            successId === inv.invoice_id ||
                            (inv.status !== "pending" &&
                              inv.status !== "partially_paid" &&
                              simulating !== inv.invoice_id)
                          }
                          onClick={() => {
                            setSimulateInvoice(inv);
                            setSimulateAmount(inv.crypto_amount.toString());
                          }}
                          className={cn(
                            "h-7 w-28 text-[10px] font-bold tracking-wider uppercase transition-all",
                            successId === inv.invoice_id
                              ? "bg-emerald-500 text-white hover:bg-emerald-600"
                              : "bg-amber-500 text-black hover:bg-amber-600",
                          )}
                        >
                          {simulating === inv.invoice_id ? (
                            <>
                              <RefreshCw className="mr-1.5 size-3 animate-spin" />
                              Simulating
                            </>
                          ) : successId === inv.invoice_id ? (
                            <>
                              <CheckCircle2 className="mr-1.5 size-3" /> Paid
                            </>
                          ) : (
                            <>
                              <Zap className="mr-1.5 size-3" /> Simulate
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-center">
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
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Create Test Invoice</DialogTitle>
            <DialogDescription>
              Set the required amount and asset for your simulated customer
              payment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="amount"
                className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase"
              >
                Amount (USD)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="1.00"
                value={createAmount}
                onChange={(e) => setCreateAmount(e.target.value)}
                className="col-span-3 font-mono"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="currency"
                className="text-muted-foreground text-right text-xs font-semibold tracking-wider uppercase"
              >
                Currency
              </Label>
              <Select value={createCurrency} onValueChange={setCreateCurrency}>
                <SelectTrigger className="col-span-3 font-semibold">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.iconFallback}>
                      {w.iconFallback} ({w.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={testnetLoading}
              onClick={async () => {
                const amountNum = parseFloat(createAmount);
                if (isNaN(amountNum) || amountNum <= 0) return;
                const success = await createTestInvoice(
                  amountNum,
                  createCurrency,
                );
                if (success) setShowCreateDialog(false);
              }}
            >
              {testnetLoading ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!simulateInvoice}
        onOpenChange={(open) => !open && setSimulateInvoice(null)}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Simulate Payment Details</DialogTitle>
            <DialogDescription>
              Enter the exact crypto amount you want to simulate sending.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="simAmount"
                className="text-muted-foreground text-right text-xs leading-tight font-semibold tracking-wider uppercase"
              >
                Send Amount
              </Label>
              <div className="relative col-span-3">
                <Input
                  id="simAmount"
                  type="text"
                  value={simulateAmount}
                  onChange={(e) => setSimulateAmount(e.target.value)}
                  className="pr-12 font-mono"
                />
                <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-bold">
                  {simulateInvoice?.crypto_currency}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div />
              <p className="text-muted-foreground col-span-3 flex items-center justify-between text-[10px]">
                <span>
                  Target:{" "}
                  <span className="text-foreground font-mono">
                    {simulateInvoice?.crypto_amount}
                  </span>
                </span>
                <span>
                  Received:{" "}
                  <span className="text-foreground font-mono">
                    {simulateInvoice?.crypto_amount_received || 0}
                  </span>
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimulateInvoice(null)}>
              Cancel
            </Button>
            <Button
              disabled={testnetLoading}
              onClick={async () => {
                if (!simulateInvoice) return;
                simulatePayment(simulateInvoice, simulateAmount);
                setSimulateInvoice(null);
              }}
              className="gap-2 bg-amber-500 font-bold text-black hover:bg-amber-600"
            >
              <Zap size={14} /> Simulate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
