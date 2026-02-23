"use client";

import { AlertTriangle, Loader2, Check, Copy, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { Currency, NETWORK_CONFIG, ASSET_CONFIG } from "@qodinger/knot-types";
import { StatsData } from "../types";

interface TopUpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  stats: StatsData | null;
  step: 1 | 2 | 3;
  setStep: (step: 1 | 2 | 3) => void;
  usdAmount: string;
  setUsdAmount: (val: string) => void;
  selectedCoin: string;
  setSelectedCoin: (val: string) => void;
  selectedCurrency: Currency | "";
  setSelectedCurrency: (val: Currency | "") => void;
  isGenerating: boolean;
  generateError: string | null;
  handleGeneratePayment: () => void;
  cryptoAmount: number | null;
  getWalletAddress: (currency: string) => string | null;
  txHash: string;
  setTxHash: (val: string) => void;
  isClaiming: boolean;
  claimStatus: { success?: boolean; error?: string; message?: string } | null;
  submitClaim: () => void;
  copyAddress: (value: string, field: string) => void;
  copiedField: string | null;
}

export function TopUpDialog({
  isOpen,
  onOpenChange,
  stats,
  step,
  setStep,
  usdAmount,
  setUsdAmount,
  selectedCoin,
  setSelectedCoin,
  selectedCurrency,
  setSelectedCurrency,
  isGenerating,
  generateError,
  handleGeneratePayment,
  cryptoAmount,
  getWalletAddress,
  txHash,
  setTxHash,
  isClaiming,
  claimStatus,
  submitClaim,
  copyAddress,
  copiedField,
}: TopUpDialogProps) {
  const generatePaymentUri = () => {
    const address = getWalletAddress(selectedCurrency) || "";
    if (!address) return "";

    // Base currency symbol (e.g., BTC_TESTNET -> BTC)
    const baseCurrency = selectedCurrency.split("_")[0];

    if (baseCurrency === "BTC")
      return `bitcoin:${address}?amount=${cryptoAmount || 0}`;
    if (baseCurrency === "LTC")
      return `litecoin:${address}?amount=${cryptoAmount || 0}`;

    return address;
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isClaiming) onOpenChange(false);
      }}
    >
      <DialogContent className="bg-background overflow-hidden p-0 sm:max-w-[420px]">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 font-mono text-xl font-bold">
              {step === 2 || step === 3 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep(1)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground -ml-2 size-8 shrink-0"
                >
                  <ArrowLeft className="size-4" />
                </Button>
              ) : null}
              {step === 1
                ? "Top Up with Stablecoins"
                : step === 2
                  ? "Pay with Stablecoin"
                  : "Verify Transaction"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                {step === 1 && (
                  <>
                    KnotEngine uses <strong>Stablecoin-Only Billing</strong> via
                    Ethereum or Polygon to guarantee your balance stability and
                    fund our yield pools. Select an amount below.
                  </>
                )}
                {step === 2 &&
                  "Send the exact stablecoin amount via the Ethereum or Polygon network to the address below. Your balance updates 1:1 with USD after confirmation."}
                {step === 3 &&
                  "If you previously closed this dialog after sending payment, select the currency and paste the transaction hash below."}
              </div>
            </DialogDescription>
          </DialogHeader>

          {step === 1 || step === 3 ? (
            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-2">
                  <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-semibold">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="5"
                      className="bg-background/50 border-border/80 h-11 pl-7 font-mono text-lg font-bold shadow-sm"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      placeholder="10.00"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                    Pay With (Stablecoin)
                  </label>
                  <Select
                    value={selectedCoin}
                    onValueChange={(val) => {
                      setSelectedCoin(val);
                      setSelectedCurrency("");
                    }}
                  >
                    <SelectTrigger className="bg-background/50 border-border/80 h-11! w-full shadow-sm [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0">
                      <SelectValue placeholder="Select a stablecoin" />
                    </SelectTrigger>
                    <SelectContent className="[&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2">
                      {ASSET_CONFIG.filter((asset) => {
                        const isStable =
                          asset.id === "USDT" || asset.id === "USDC";
                        if (!isStable) return false;

                        return !!stats?.platformFeeWallets?.EVM;
                      }).map((asset) => (
                        <SelectItem
                          key={asset.id}
                          value={asset.id}
                          className="h-10"
                        >
                          <Avatar className="size-5 h-6! bg-transparent p-0">
                            <AvatarImage
                              src={asset.icon}
                              className="object-contain"
                            />
                            <AvatarFallback className="bg-slate-500 text-[10px] text-white">
                              {asset.symbol}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground text-sm font-bold">
                              {asset.symbol}
                            </span>
                            <span className="text-muted-foreground truncate text-xs font-normal">
                              {asset.label}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                    Network
                  </label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={(val) =>
                      setSelectedCurrency(val as Currency)
                    }
                    disabled={!selectedCoin}
                  >
                    <SelectTrigger className="bg-background/50 border-border/80 h-auto min-h-[44px] w-full items-center py-2 shadow-sm disabled:opacity-40">
                      <SelectValue placeholder="Select a network" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[320px]">
                      {selectedCoin &&
                        NETWORK_CONFIG[selectedCoin]
                          ?.filter(() => !!stats?.platformFeeWallets?.EVM)
                          .map((net) => (
                            <SelectItem
                              key={net.id}
                              value={net.id}
                              className="h-auto w-full py-2 [&>span:last-child]:flex-1"
                            >
                              <div className="flex w-full items-center justify-between gap-4 in-data-[slot=select-value]:flex-row in-data-[slot=select-value]:items-center in-data-[slot=select-value]:justify-start in-data-[slot=select-value]:gap-2">
                                <div className="flex min-w-0 flex-col items-start in-data-[slot=select-value]:flex-row in-data-[slot=select-value]:items-center in-data-[slot=select-value]:gap-2">
                                  <span className="text-foreground text-sm font-bold">
                                    {net.networkSymbol}
                                  </span>
                                  <span className="text-muted-foreground truncate text-[11px] font-normal">
                                    {net.networkName}
                                  </span>
                                </div>
                                <div className="flex shrink-0 flex-col items-end text-right in-data-[slot=select-value]:hidden">
                                  {net.estimatedTime && (
                                    <span className="text-muted-foreground/60 text-[10px] whitespace-nowrap">
                                      Arrival time {net.estimatedTime}
                                    </span>
                                  )}
                                  {net.networkFee && (
                                    <span className="text-muted-foreground text-[11px] whitespace-nowrap">
                                      fee {net.networkFee}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {generateError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs font-medium text-rose-500">
                  <AlertTriangle className="size-3.5" />
                  {generateError}
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <Button
                    className="h-11 w-full text-sm font-semibold shadow-sm"
                    disabled={isGenerating}
                    onClick={handleGeneratePayment}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      "Generate Payment Details"
                    )}
                  </Button>

                  <button
                    onClick={() => setStep(3)}
                    className="text-muted-foreground hover:text-foreground text-center text-xs font-medium transition-colors"
                  >
                    Already sent a payment?{" "}
                    <span className="decoration-muted-foreground/50 underline underline-offset-2">
                      Click here to verify it.
                    </span>
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="border-border mt-2 space-y-2 border-t pt-2">
                  <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                    Transaction Hash (Required)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste TxHash after sending"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="bg-background/50 border-border/80 h-11 font-mono text-xs shadow-sm"
                      disabled={isClaiming || claimStatus?.success}
                    />
                    <Button
                      className="h-11 px-6 shadow-sm"
                      onClick={submitClaim}
                      disabled={
                        !txHash ||
                        txHash.length < 10 ||
                        isClaiming ||
                        claimStatus?.success
                      }
                    >
                      {isClaiming ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                  {claimStatus?.error && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs font-medium text-rose-500">
                      <AlertTriangle className="size-3.5" />
                      {claimStatus.error}
                    </div>
                  )}
                  {claimStatus?.success && (
                    <div className="mt-3 flex items-center gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-4 shrink-0" />
                      <p className="text-sm font-medium">
                        {claimStatus.message}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="border-border relative mx-auto mb-6 flex items-center justify-center rounded-3xl border bg-white p-4 shadow-xs dark:ring-4 dark:ring-white/10">
                <QRCodeSVG
                  value={generatePaymentUri()}
                  size={180}
                  level={"H"}
                  includeMargin={false}
                  className="rounded-lg"
                />
                {selectedCurrency && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-white p-2">
                      <img
                        src={
                          Object.values(NETWORK_CONFIG)
                            .flat()
                            .find((n) => n.id === selectedCurrency)?.iconUrl ||
                          ""
                        }
                        alt={selectedCurrency}
                        className="size-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-8 flex flex-col items-center">
                <p className="text-muted-foreground mb-2 text-[10px] font-bold tracking-widest uppercase">
                  Amount Due
                </p>
                <div
                  className="group flex cursor-pointer flex-col items-center outline-none select-none"
                  onClick={() => {
                    const amountStr =
                      cryptoAmount !== null
                        ? String(Number(cryptoAmount.toFixed(8)))
                        : "0";
                    copyAddress(amountStr, "amount");
                  }}
                >
                  <div className="relative flex items-center gap-2">
                    <h2
                      className={cn(
                        "text-4xl font-black tracking-tighter tabular-nums transition-colors",
                        copiedField === "amount"
                          ? "text-emerald-500"
                          : "text-foreground",
                      )}
                    >
                      {cryptoAmount !== null
                        ? String(Number(cryptoAmount.toFixed(8)))
                        : "0"}
                    </h2>
                    <span className="text-muted-foreground text-lg font-bold tracking-tight">
                      {selectedCurrency.includes("_")
                        ? selectedCurrency.split("_")[0]
                        : selectedCurrency}
                    </span>

                    {copiedField === "amount" && (
                      <span className="absolute top-1/2 -right-8 -translate-y-1/2">
                        <Check size={16} className="text-emerald-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm font-medium">
                    ≈ ${Number(usdAmount).toFixed(2)} USD
                  </p>
                  <span className="text-muted-foreground mt-2 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                    Click to copy amount
                  </span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="bg-muted/30 border-border/40 flex rounded-xl border p-1.5">
                  <div className="flex flex-1 items-center overflow-hidden px-3 py-2">
                    <code className="text-muted-foreground truncate font-mono text-xs font-medium">
                      {getWalletAddress(selectedCurrency)}
                    </code>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 shrink-0 rounded-lg"
                    onClick={() =>
                      copyAddress(
                        getWalletAddress(selectedCurrency)!,
                        "address",
                      )
                    }
                  >
                    {copiedField === "address" ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>

                <div className="bg-border/40 h-px w-full" />

                <div className="space-y-2">
                  <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                    Transaction Hash (Required)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste TxHash after sending"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="h-10 font-mono text-xs shadow-none"
                      disabled={isClaiming || claimStatus?.success}
                    />
                    <Button
                      className="h-10 shrink-0"
                      onClick={submitClaim}
                      disabled={
                        !txHash ||
                        txHash.length < 10 ||
                        isClaiming ||
                        claimStatus?.success
                      }
                    >
                      {isClaiming ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>
                  {claimStatus?.error && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-rose-500">
                      <AlertTriangle className="size-3 shrink-0" />
                      {claimStatus.error}
                    </p>
                  )}
                  {claimStatus?.success && (
                    <div className="mt-2 flex items-center gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-4 shrink-0" />
                      <p className="text-sm font-medium">
                        {claimStatus.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
