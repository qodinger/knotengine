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
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden bg-background">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold font-mono">
              {step === 2 || step === 3 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep(1)}
                  className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 -ml-2"
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
              <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
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
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="5"
                      className="pl-7 h-11 text-lg font-bold font-mono shadow-sm bg-background/50 border-border/80"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      placeholder="10.00"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Pay With (Stablecoin)
                  </label>
                  <Select
                    value={selectedCoin}
                    onValueChange={(val) => {
                      setSelectedCoin(val);
                      setSelectedCurrency("");
                    }}
                  >
                    <SelectTrigger className="w-full h-11! shadow-sm bg-background/50 border-border/80 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0">
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
                          <Avatar className="size-5 bg-transparent p-0 h-6!">
                            <AvatarImage
                              src={asset.icon}
                              className="object-contain"
                            />
                            <AvatarFallback className="text-[10px] text-white bg-slate-500">
                              {asset.symbol}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {asset.symbol}
                            </span>
                            <span className="text-xs text-muted-foreground truncate font-normal">
                              {asset.label}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Network
                  </label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={(val) =>
                      setSelectedCurrency(val as Currency)
                    }
                    disabled={!selectedCoin}
                  >
                    <SelectTrigger className="w-full h-auto min-h-[44px] shadow-sm bg-background/50 border-border/80 disabled:opacity-40 py-2 items-center">
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
                              className="h-auto py-2 w-full [&>span:last-child]:flex-1"
                            >
                              <div className="w-full flex items-center justify-between gap-4 in-data-[slot=select-value]:flex-row in-data-[slot=select-value]:items-center in-data-[slot=select-value]:justify-start in-data-[slot=select-value]:gap-2">
                                <div className="flex flex-col items-start min-w-0 in-data-[slot=select-value]:flex-row in-data-[slot=select-value]:items-center in-data-[slot=select-value]:gap-2">
                                  <span className="font-bold text-sm text-foreground">
                                    {net.networkSymbol}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground truncate font-normal">
                                    {net.networkName}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end shrink-0 text-right in-data-[slot=select-value]:hidden">
                                  {net.estimatedTime && (
                                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                                      Arrival time {net.estimatedTime}
                                    </span>
                                  )}
                                  {net.networkFee && (
                                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
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
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-medium">
                  <AlertTriangle className="size-3.5" />
                  {generateError}
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <Button
                    className="w-full h-11 text-sm font-semibold shadow-sm"
                    disabled={isGenerating}
                    onClick={handleGeneratePayment}
                  >
                    {isGenerating ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      "Generate Payment Details"
                    )}
                  </Button>

                  <button
                    onClick={() => setStep(3)}
                    className="text-xs text-muted-foreground hover:text-foreground text-center font-medium transition-colors"
                  >
                    Already sent a payment?{" "}
                    <span className="underline underline-offset-2 decoration-muted-foreground/50">
                      Click here to verify it.
                    </span>
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-2 pt-2 border-t border-border mt-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Transaction Hash (Required)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste TxHash after sending"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="h-11 text-xs font-mono shadow-sm bg-background/50 border-border/80"
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
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-medium mt-3">
                      <AlertTriangle className="size-3.5" />
                      {claimStatus.error}
                    </div>
                  )}
                  {claimStatus?.success && (
                    <div className="flex items-center gap-1.5 p-2.5 mt-3 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
              <div className="mb-6 p-4 rounded-3xl bg-white border border-border shadow-xs dark:ring-4 dark:ring-white/10 mx-auto relative flex items-center justify-center">
                <QRCodeSVG
                  value={generatePaymentUri()}
                  size={180}
                  level={"H"}
                  includeMargin={false}
                  className="rounded-lg"
                />
                {selectedCurrency && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-2 rounded-full size-12 flex items-center justify-center">
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

              <div className="flex flex-col items-center mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  Amount Due
                </p>
                <div
                  className="group flex flex-col items-center cursor-pointer select-none outline-none"
                  onClick={() => {
                    const amountStr =
                      cryptoAmount !== null
                        ? String(Number(cryptoAmount.toFixed(8)))
                        : "0";
                    copyAddress(amountStr, "amount");
                  }}
                >
                  <div className="flex items-center gap-2 relative">
                    <h2
                      className={cn(
                        "text-4xl font-black tabular-nums tracking-tighter transition-colors",
                        copiedField === "amount"
                          ? "text-emerald-500"
                          : "text-foreground",
                      )}
                    >
                      {cryptoAmount !== null
                        ? String(Number(cryptoAmount.toFixed(8)))
                        : "0"}
                    </h2>
                    <span className="text-lg font-bold text-muted-foreground tracking-tight">
                      {selectedCurrency.includes("_")
                        ? selectedCurrency.split("_")[0]
                        : selectedCurrency}
                    </span>

                    {copiedField === "amount" && (
                      <span className="absolute -right-8 top-1/2 -translate-y-1/2">
                        <Check size={16} className="text-emerald-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    ≈ ${Number(usdAmount).toFixed(2)} USD
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to copy amount
                  </span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="flex bg-muted/30 border border-border/40 p-1.5 rounded-xl">
                  <div className="flex-1 px-3 py-2 flex items-center overflow-hidden">
                    <code className="text-xs font-mono font-medium truncate text-muted-foreground">
                      {getWalletAddress(selectedCurrency)}
                    </code>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0 h-8 rounded-lg"
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

                <div className="h-px bg-border/40 w-full" />

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Transaction Hash (Required)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste TxHash after sending"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="h-10 text-xs font-mono shadow-none"
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
                    <p className="text-xs text-rose-500 mt-1 font-medium flex items-center gap-1">
                      <AlertTriangle className="size-3 shrink-0" />
                      {claimStatus.error}
                    </p>
                  )}
                  {claimStatus?.success && (
                    <div className="flex items-center gap-1.5 p-2.5 mt-2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
