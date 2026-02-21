"use client";

import { AlertTriangle, Loader2, Check, Copy } from "lucide-react";
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
import { Currency, NETWORK_CONFIG, CRYPTO_LABELS } from "@qodinger/knot-types";
import { StatsData } from "../types";

/**
 * Maps a currency id to the platformFeeWallets key to check availability.
 * BTC/LTC have their own keys, all EVM-based currencies share "EVM".
 */
function getPlatformWalletKey(currencyId: string): "BTC" | "LTC" | "EVM" {
  if (currencyId === "BTC") return "BTC";
  if (currencyId === "LTC") return "LTC";
  return "EVM";
}

interface TopUpDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  stats: StatsData | null;
  step: 1 | 2;
  setStep: (step: 1 | 2) => void;
  usdAmount: string;
  setUsdAmount: (val: string) => void;
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
            <DialogTitle className="flex items-center justify-between text-xl font-bold font-mono">
              {step === 1 ? "Select Top-Up Amount" : "Pay with Crypto"}
              {step === 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="h-8 text-xs font-sans text-muted-foreground hover:text-foreground"
                >
                  &larr; Back
                </Button>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-xs text-muted-foreground mt-1.5">
                {step === 1
                  ? "Enter how much you want to add to your prepaid balance, and choose a cryptocurrency."
                  : "Send the exact cryptocurrency amount to the address below. Your balance updates instantly after confirmation."}
              </div>
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-6">
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
                    className="pl-7 h-11 text-lg font-bold font-mono shadow-sm bg-background/50 border-border/80"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    placeholder="10.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Pay With (Currency)
                </label>
                <Select
                  value={selectedCurrency}
                  onValueChange={(val) => setSelectedCurrency(val as Currency)}
                >
                  <SelectTrigger className="w-full h-11 shadow-sm bg-background/50 border-border/80 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0">
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent className="[&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2">
                    {Object.values(NETWORK_CONFIG)
                      .flat()
                      .filter((net) => {
                        const key = getPlatformWalletKey(net.id);
                        return !!stats?.platformFeeWallets?.[key];
                      })
                      .map((net) => (
                        <SelectItem key={net.id} value={net.id}>
                          <Avatar className="size-5 bg-transparent p-0">
                            <AvatarImage
                              src={net.iconUrl}
                              className="object-contain"
                            />
                            <AvatarFallback
                              className={cn(
                                "text-[10px] text-white",
                                net.iconColor,
                              )}
                            >
                              {net.id.split("_")[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">
                            {CRYPTO_LABELS[net.id as Currency]}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {generateError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-medium">
                  <AlertTriangle className="size-3.5" />
                  {generateError}
                </div>
              )}

              <Button
                className="w-full h-11 text-sm font-semibold shadow-sm"
                disabled={!usdAmount || !selectedCurrency || isGenerating}
                onClick={handleGeneratePayment}
              >
                {isGenerating ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  "Generate Payment Details"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="mb-6 p-4 rounded-3xl bg-white border border-border shadow-xs dark:ring-4 dark:ring-white/10 mx-auto">
                <QRCodeSVG
                  value={getWalletAddress(selectedCurrency) || ""}
                  size={180}
                  level={"H"}
                  includeMargin={false}
                  className="rounded-lg"
                  imageSettings={
                    selectedCurrency
                      ? {
                          src:
                            Object.values(NETWORK_CONFIG)
                              .flat()
                              .find((n) => n.id === selectedCurrency)
                              ?.iconUrl || "",
                          height: 48,
                          width: 48,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>

              <p className="text-sm font-medium text-muted-foreground mb-1">
                Amount Due
              </p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-black tabular-nums tracking-tighter text-foreground">
                  {cryptoAmount?.toFixed(6)}
                </span>
                <span className="text-lg font-bold text-muted-foreground">
                  {selectedCurrency.includes("_")
                    ? selectedCurrency.split("_")[0]
                    : selectedCurrency}
                </span>
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
